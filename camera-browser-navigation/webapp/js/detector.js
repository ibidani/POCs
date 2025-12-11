/**
 * Hand Detector Module - MediaPipe Hands integration
 */

const HandDetector = {
  hands: null,
  camera: null,
  isRunning: false,
  onResults: null,

  /**
   * Initialize MediaPipe Hands
   */
  async init(videoElement, resultsCallback) {
    this.onResults = resultsCallback;

    // Initialize MediaPipe Hands
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    // Configure hand detection
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0, // 0 = Lite, 1 = Full (Lite is faster)
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    // Set up results handler
    this.hands.onResults((results) => this.handleResults(results));

    // Initialize camera utility from MediaPipe
    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.isRunning && this.hands) {
          await this.hands.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480
    });

    return this;
  },

  /**
   * Start detection
   */
  async start() {
    if (!this.camera) {
      throw new Error('Detector not initialized');
    }
    this.isRunning = true;
    await this.camera.start();
  },

  /**
   * Stop detection
   */
  stop() {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
    }
  },

  /**
   * Handle detection results
   */
  handleResults(results) {
    if (!this.isRunning) return;

    const landmarks = results.multiHandLandmarks?.[0] || null;
    const handedness = results.multiHandedness?.[0] || null;

    if (this.onResults) {
      this.onResults({
        landmarks,
        handedness,
        image: results.image
      });
    }
  },

  /**
   * Landmark indices for MediaPipe hand model:
   * 0: Wrist
   * 1-4: Thumb (CMC, MCP, IP, TIP)
   * 5-8: Index finger (MCP, PIP, DIP, TIP)
   * 9-12: Middle finger
   * 13-16: Ring finger
   * 17-20: Pinky
   */
  LANDMARKS: {
    WRIST: 0,
    THUMB_TIP: 4,
    INDEX_TIP: 8,
    MIDDLE_TIP: 12,
    RING_TIP: 16,
    PINKY_TIP: 20
  }
};
