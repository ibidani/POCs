/**
 * Gesture Recognition Module - Detects and interprets hand gestures
 */

const GestureRecognizer = {
  // Movement history for smoothing
  positionHistory: [],
  historySize: 5,

  // Pinch state
  wasPinching: false,
  pinchStartPosition: null,

  /**
   * Detect pinch gesture from landmarks
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @returns {Object} Pinch state and position
   */
  detectPinch(landmarks) {
    if (!landmarks) {
      return { isPinching: false, position: null };
    }

    const thumbTip = landmarks[HandDetector.LANDMARKS.THUMB_TIP];
    const indexTip = landmarks[HandDetector.LANDMARKS.INDEX_TIP];

    // Calculate distance between thumb and index finger
    const distance = Math.hypot(
      thumbTip.x - indexTip.x,
      thumbTip.y - indexTip.y
    );

    const isPinching = distance < AppState.pinchThreshold;

    // Calculate pinch midpoint
    const position = {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2
    };

    return {
      isPinching,
      position,
      distance,
      confidence: 1 - (distance / AppState.pinchThreshold)
    };
  },

  /**
   * Process landmarks and return gesture state
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @returns {Object} Gesture information
   */
  process(landmarks) {
    const pinchResult = this.detectPinch(landmarks);

    let gesture = {
      type: 'none',
      isPinching: pinchResult.isPinching,
      position: pinchResult.position,
      delta: null,
      event: null
    };

    if (pinchResult.isPinching) {
      // Smooth the position
      const smoothedPosition = this.smoothPosition(pinchResult.position);
      gesture.position = smoothedPosition;

      if (!this.wasPinching) {
        // Pinch just started
        gesture.event = 'pinch_start';
        gesture.type = 'pinch';
        this.pinchStartPosition = smoothedPosition;
        AppState.pinchStartY = smoothedPosition.y;
        AppState.lastPinchY = smoothedPosition.y;
      } else {
        // Pinch continuing
        gesture.event = 'pinch_move';
        gesture.type = 'pinch';

        // Calculate delta from last position
        if (AppState.lastPinchY !== null) {
          gesture.delta = {
            x: smoothedPosition.x - this.pinchStartPosition.x,
            y: smoothedPosition.y - AppState.lastPinchY
          };
        }

        AppState.lastPinchY = smoothedPosition.y;
      }

      this.wasPinching = true;
      AppState.isPinching = true;
      AppState.currentGesture = 'pinch';

    } else {
      if (this.wasPinching) {
        // Pinch just ended
        gesture.event = 'pinch_end';
      }

      this.wasPinching = false;
      this.pinchStartPosition = null;
      this.clearHistory();
      AppState.resetGesture();
    }

    return gesture;
  },

  /**
   * Smooth position using moving average
   * @param {Object} position - Current position {x, y}
   * @returns {Object} Smoothed position
   */
  smoothPosition(position) {
    this.positionHistory.push(position);

    if (this.positionHistory.length > this.historySize) {
      this.positionHistory.shift();
    }

    // Calculate moving average
    const sum = this.positionHistory.reduce(
      (acc, pos) => ({
        x: acc.x + pos.x,
        y: acc.y + pos.y
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / this.positionHistory.length,
      y: sum.y / this.positionHistory.length
    };
  },

  /**
   * Clear position history
   */
  clearHistory() {
    this.positionHistory = [];
  },

  /**
   * Reset gesture recognizer state
   */
  reset() {
    this.wasPinching = false;
    this.pinchStartPosition = null;
    this.clearHistory();
  }
};
