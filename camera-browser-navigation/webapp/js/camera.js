/**
 * Camera Module - Handles webcam access and video stream
 */

const CameraModule = {
  video: null,
  stream: null,

  /**
   * Initialize camera with specified constraints
   */
  async init(videoElement) {
    this.video = videoElement;

    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user'
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      return new Promise((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.video.play()
            .then(() => {
              AppState.set('cameraActive', true);
              resolve(this.video);
            })
            .catch(reject);
        };
        this.video.onerror = reject;
      });
    } catch (error) {
      console.error('Camera access error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Stop camera and release resources
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    AppState.set('cameraActive', false);
  },

  /**
   * Get video element
   */
  getVideo() {
    return this.video;
  },

  /**
   * Check if camera is active
   */
  isActive() {
    return this.stream !== null && AppState.cameraActive;
  },

  /**
   * Handle camera errors with user-friendly messages
   */
  handleError(error) {
    let message = 'Camera error';

    switch (error.name) {
      case 'NotAllowedError':
        message = 'Camera permission denied. Please allow camera access.';
        break;
      case 'NotFoundError':
        message = 'No camera found. Please connect a webcam.';
        break;
      case 'NotReadableError':
        message = 'Camera is in use by another application.';
        break;
      case 'OverconstrainedError':
        message = 'Camera does not support required settings.';
        break;
      default:
        message = `Camera error: ${error.message}`;
    }

    return new Error(message);
  }
};
