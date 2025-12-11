/**
 * UI Overlay Module - Visual feedback and controls
 */

const UIOverlay = {
  elements: {},

  /**
   * Initialize UI elements
   */
  init() {
    this.createOverlay();
    this.createStatusIndicator();
    this.createGestureIndicator();
    this.createScrollIndicator();
    this.bindEvents();
  },

  /**
   * Create camera overlay with controls
   */
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'camera-overlay';
    overlay.innerHTML = `
      <div id="camera-container">
        <video id="video-feed" playsinline></video>
        <canvas id="landmark-canvas"></canvas>
      </div>
      <div class="controls">
        <button id="toggle-btn" class="control-btn">
          <span class="btn-icon">📷</span>
          <span class="btn-text">Enable Camera</span>
        </button>
        <button id="preview-btn" class="control-btn" style="display: none;">
          <span class="btn-icon">👁</span>
          <span class="btn-text">Hide Preview</span>
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    this.elements = {
      overlay,
      container: document.getElementById('camera-container'),
      video: document.getElementById('video-feed'),
      canvas: document.getElementById('landmark-canvas'),
      toggleBtn: document.getElementById('toggle-btn'),
      previewBtn: document.getElementById('preview-btn')
    };

    // Set canvas size
    this.elements.canvas.width = 240;
    this.elements.canvas.height = 180;
  },

  /**
   * Create status indicator
   */
  createStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'status-indicator';
    indicator.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">Ready</span>
    `;
    document.body.appendChild(indicator);
    this.elements.statusIndicator = indicator;
  },

  /**
   * Create gesture indicator (center screen)
   */
  createGestureIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'gesture-indicator';
    indicator.textContent = '👌';
    document.body.appendChild(indicator);
    this.elements.gestureIndicator = indicator;
  },

  /**
   * Create scroll progress indicator
   */
  createScrollIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'scroll-indicator';
    indicator.innerHTML = '<div id="scroll-progress"></div>';
    document.body.appendChild(indicator);
    this.elements.scrollIndicator = indicator;
    this.elements.scrollProgress = document.getElementById('scroll-progress');
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Toggle button
    this.elements.toggleBtn.addEventListener('click', () => {
      AppState.emit('toggle');
    });

    // Preview button
    this.elements.previewBtn.addEventListener('click', () => {
      AppState.set('showPreview', !AppState.showPreview);
    });

    // Keyboard shortcut (Ctrl+Shift+G)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        AppState.emit('toggle');
      }
    });

    // State change listeners
    AppState.on('change:enabled', ({ value }) => this.updateToggleButton(value));
    AppState.on('change:showPreview', ({ value }) => this.updatePreview(value));
    AppState.on('scroll', () => this.updateScrollProgress());
  },

  /**
   * Get video element
   */
  getVideoElement() {
    return this.elements.video;
  },

  /**
   * Get canvas context for drawing
   */
  getCanvasContext() {
    return this.elements.canvas.getContext('2d');
  },

  /**
   * Draw hand landmarks on canvas
   */
  drawLandmarks(landmarks) {
    const ctx = this.getCanvasContext();
    const canvas = this.elements.canvas;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || !AppState.showPreview) return;

    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],     // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],     // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17]           // Palm
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];

      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    });

    // Draw landmarks
    landmarks.forEach((point, index) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      // Highlight thumb and index tips
      if (index === 4 || index === 8) {
        ctx.fillStyle = AppState.isPinching ? '#ff0' : '#0ff';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw pinch indicator
    if (AppState.isPinching) {
      const thumb = landmarks[4];
      const index = landmarks[8];
      const midX = (thumb.x + index.x) / 2 * canvas.width;
      const midY = (thumb.y + index.y) / 2 * canvas.height;

      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(midX, midY, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /**
   * Update status indicator
   */
  showStatus(message, type = 'idle') {
    const indicator = this.elements.statusIndicator;
    const textEl = indicator.querySelector('.status-text');

    textEl.textContent = message;
    indicator.className = `visible ${type}`;

    // Auto-hide after delay for non-persistent states
    if (type === 'idle' || type === 'error') {
      setTimeout(() => {
        if (indicator.classList.contains(type)) {
          indicator.classList.remove('visible');
        }
      }, 3000);
    }
  },

  /**
   * Update toggle button state
   */
  updateToggleButton(enabled) {
    const btn = this.elements.toggleBtn;
    const text = btn.querySelector('.btn-text');
    const icon = btn.querySelector('.btn-icon');

    if (enabled) {
      btn.classList.add('active');
      text.textContent = 'Disable Camera';
      icon.textContent = '🛑';
      this.elements.previewBtn.style.display = 'flex';
      this.elements.container.classList.add('visible');
      this.elements.scrollIndicator.classList.add('visible');
    } else {
      btn.classList.remove('active');
      text.textContent = 'Enable Camera';
      icon.textContent = '📷';
      this.elements.previewBtn.style.display = 'none';
      this.elements.container.classList.remove('visible');
      this.elements.scrollIndicator.classList.remove('visible');
    }
  },

  /**
   * Update preview visibility
   */
  updatePreview(visible) {
    const btn = this.elements.previewBtn;
    const text = btn.querySelector('.btn-text');

    if (visible) {
      this.elements.container.classList.add('visible');
      text.textContent = 'Hide Preview';
    } else {
      this.elements.container.classList.remove('visible');
      text.textContent = 'Show Preview';
    }
  },

  /**
   * Show/hide gesture indicator
   */
  showGestureIndicator(show) {
    const indicator = this.elements.gestureIndicator;
    if (show) {
      indicator.classList.add('visible');
    } else {
      indicator.classList.remove('visible');
    }
  },

  /**
   * Update scroll progress bar
   */
  updateScrollProgress() {
    const progress = ScrollController.getProgress();
    this.elements.scrollProgress.style.height = `${progress * 100}%`;
  },

  /**
   * Show loading overlay
   */
  showLoading(message = 'Loading...') {
    let loading = document.querySelector('.loading-overlay');

    if (!loading) {
      loading = document.createElement('div');
      loading.className = 'loading-overlay';
      loading.innerHTML = `
        <div class="spinner"></div>
        <p class="loading-text">${message}</p>
      `;
      document.body.appendChild(loading);
    } else {
      loading.querySelector('.loading-text').textContent = message;
      loading.style.display = 'flex';
    }
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
      loading.style.display = 'none';
    }
  }
};
