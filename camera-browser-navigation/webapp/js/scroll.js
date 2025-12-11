/**
 * Scroll Controller Module - Converts gestures to scroll actions
 */

const ScrollController = {
  // Scroll state
  lastScrollTime: 0,
  scrollVelocity: 0,
  isScrolling: false,

  // Smoothing
  velocityHistory: [],
  velocityHistorySize: 3,

  /**
   * Process gesture and apply scroll
   * @param {Object} gesture - Gesture data from recognizer
   */
  handleGesture(gesture) {
    if (!gesture.isPinching || !gesture.delta) {
      this.stop();
      return;
    }

    // Convert normalized delta to scroll amount
    // Negative delta.y (hand moves up) = scroll up (negative scroll)
    // Positive delta.y (hand moves down) = scroll down (positive scroll)
    const rawVelocity = gesture.delta.y * window.innerHeight * 2;

    // Apply smoothing
    const smoothedVelocity = this.smoothVelocity(rawVelocity);

    // Apply sensitivity
    const scrollAmount = smoothedVelocity * AppState.sensitivity;

    // Apply minimum threshold to avoid jitter
    if (Math.abs(scrollAmount) < 1) {
      return;
    }

    this.scroll(scrollAmount);
    this.isScrolling = true;
  },

  /**
   * Execute scroll action
   * @param {number} deltaY - Amount to scroll in pixels
   */
  scroll(deltaY) {
    window.scrollBy({
      top: deltaY,
      left: 0,
      behavior: 'auto' // 'smooth' adds too much latency
    });

    this.lastScrollTime = performance.now();
    AppState.emit('scroll', { deltaY });
  },

  /**
   * Smooth velocity using exponential moving average
   * @param {number} velocity - Raw velocity
   * @returns {number} Smoothed velocity
   */
  smoothVelocity(velocity) {
    this.velocityHistory.push(velocity);

    if (this.velocityHistory.length > this.velocityHistorySize) {
      this.velocityHistory.shift();
    }

    // Exponential weighting (more recent = higher weight)
    let weightedSum = 0;
    let weightSum = 0;

    this.velocityHistory.forEach((v, i) => {
      const weight = Math.pow(2, i);
      weightedSum += v * weight;
      weightSum += weight;
    });

    return weightedSum / weightSum;
  },

  /**
   * Stop scrolling
   */
  stop() {
    this.isScrolling = false;
    this.velocityHistory = [];
    this.scrollVelocity = 0;
  },

  /**
   * Get current scroll progress (0-1)
   * @returns {number} Scroll progress
   */
  getProgress() {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  },

  /**
   * Check if at scroll boundaries
   * @returns {Object} Boundary state
   */
  getBoundaries() {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    return {
      atTop: scrollTop <= 0,
      atBottom: scrollTop >= scrollHeight - 1
    };
  }
};
