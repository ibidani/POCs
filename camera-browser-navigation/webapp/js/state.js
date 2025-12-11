/**
 * State Manager - Central state management for the application
 */

const AppState = {
  // Core state
  enabled: false,
  cameraActive: false,
  showPreview: true,
  isLoading: false,

  // Settings
  sensitivity: 1.0,
  smoothing: 0.7,
  pinchThreshold: 0.08,

  // Gesture state
  currentGesture: 'none',
  isPinching: false,
  pinchStartY: null,
  lastPinchY: null,

  // Callbacks
  listeners: {},

  /**
   * Subscribe to state changes
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  /**
   * Emit state change event
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  },

  /**
   * Update state and notify listeners
   */
  set(key, value) {
    const oldValue = this[key];
    this[key] = value;
    this.emit('change', { key, value, oldValue });
    this.emit(`change:${key}`, { value, oldValue });
  },

  /**
   * Toggle enabled state
   */
  toggle() {
    this.set('enabled', !this.enabled);
    return this.enabled;
  },

  /**
   * Reset gesture state
   */
  resetGesture() {
    this.isPinching = false;
    this.pinchStartY = null;
    this.lastPinchY = null;
    this.currentGesture = 'none';
  }
};

// Freeze the structure but allow value changes
Object.seal(AppState);
