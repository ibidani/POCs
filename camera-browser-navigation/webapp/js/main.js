/**
 * Main Entry Point - Coordinates all modules
 */

const App = {
  /**
   * Initialize the application
   */
  async init() {
    console.log('Camera Browser Navigation initializing...');

    // Initialize UI
    UIOverlay.init();

    // Set up toggle handler
    AppState.on('toggle', () => this.toggle());

    // Initial scroll progress
    UIOverlay.updateScrollProgress();
    window.addEventListener('scroll', () => UIOverlay.updateScrollProgress());

    console.log('App ready. Press Ctrl+Shift+G or click button to enable.');
  },

  /**
   * Toggle camera control on/off
   */
  async toggle() {
    if (AppState.enabled) {
      await this.disable();
    } else {
      await this.enable();
    }
  },

  /**
   * Enable camera control
   */
  async enable() {
    try {
      UIOverlay.showLoading('Starting camera...');

      // Initialize camera
      const video = UIOverlay.getVideoElement();
      await CameraModule.init(video);

      UIOverlay.showLoading('Loading hand detection model...');

      // Initialize hand detector
      await HandDetector.init(video, (results) => this.onResults(results));

      // Start detection
      await HandDetector.start();

      AppState.set('enabled', true);
      UIOverlay.hideLoading();
      UIOverlay.showStatus('Gesture control active', 'detecting');

      console.log('Camera control enabled');

    } catch (error) {
      console.error('Failed to enable:', error);
      UIOverlay.hideLoading();
      UIOverlay.showStatus(error.message, 'error');
      this.disable();
    }
  },

  /**
   * Disable camera control
   */
  async disable() {
    HandDetector.stop();
    CameraModule.stop();
    GestureRecognizer.reset();
    ScrollController.stop();

    AppState.set('enabled', false);
    UIOverlay.showStatus('Gesture control disabled', 'idle');
    UIOverlay.showGestureIndicator(false);

    // Clear canvas
    const ctx = UIOverlay.getCanvasContext();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    console.log('Camera control disabled');
  },

  /**
   * Handle detection results
   */
  onResults(results) {
    const { landmarks } = results;

    // Draw landmarks on overlay
    UIOverlay.drawLandmarks(landmarks);

    if (!landmarks) {
      // No hand detected
      if (AppState.isPinching) {
        GestureRecognizer.reset();
        ScrollController.stop();
        UIOverlay.showGestureIndicator(false);
        UIOverlay.showStatus('Gesture control active', 'detecting');
      }
      return;
    }

    // Process gestures
    const gesture = GestureRecognizer.process(landmarks);

    // Handle gesture events
    if (gesture.event === 'pinch_start') {
      UIOverlay.showGestureIndicator(true);
      UIOverlay.showStatus('Pinch detected - move to scroll', 'pinching');
    } else if (gesture.event === 'pinch_end') {
      UIOverlay.showGestureIndicator(false);
      UIOverlay.showStatus('Gesture control active', 'detecting');
    }

    // Apply scroll
    if (gesture.isPinching && gesture.delta) {
      ScrollController.handleGesture(gesture);
    }
  }
};

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
