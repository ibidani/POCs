# Camera Browser Navigation - Implementation Plan

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Hand Detection | MediaPipe Hands | Fastest, most accurate, runs on GPU via WebGL |
| Camera Access | WebRTC (getUserMedia) | Standard browser API |
| UI Framework | Vanilla JS + CSS | Minimal footprint, no build step |
| Packaging | Browser Extension (Manifest V3) | Cross-site functionality |
| Alternative | Standalone Webapp | Simpler, single-page demo |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Extension                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Camera    │  │  MediaPipe  │  │    Gesture      │  │
│  │   Module    │──│   Hands     │──│   Interpreter   │  │
│  │             │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └────────┬────────┘  │
│                                              │          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────▼────────┐  │
│  │     UI      │  │   State     │  │    Scroll       │  │
│  │   Overlay   │◄─│   Manager   │◄─│   Controller    │  │
│  │             │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Module Breakdown

### 1. Camera Module (`camera.js`)
```javascript
// Responsibilities:
// - Request camera permissions
// - Initialize video stream
// - Provide frame access to MediaPipe
// - Handle camera errors gracefully

// Key Functions:
async function initCamera(constraints)
function getVideoElement()
async function stopCamera()
```

### 2. Hand Detector (`detector.js`)
```javascript
// Responsibilities:
// - Load MediaPipe Hands model
// - Process video frames
// - Extract hand landmarks
// - Emit landmark data

// Key Functions:
async function initDetector()
function processFrame(videoElement)
function getLandmarks() // Returns 21 hand landmarks
```

### 3. Gesture Interpreter (`gestures.js`)
```javascript
// Responsibilities:
// - Analyze landmarks for gestures
// - Track gesture state (start/hold/end)
// - Calculate movement deltas
// - Debounce/smooth noisy data

// Key Functions:
function detectPinch(landmarks) // Returns {isPinching, position}
function calculateDelta(currentPos, previousPos)
function smoothMovement(delta, history) // Moving average
```

### 4. Scroll Controller (`scroll.js`)
```javascript
// Responsibilities:
// - Convert gesture data to scroll actions
// - Apply sensitivity settings
// - Execute smooth scrolling
// - Respect scroll boundaries

// Key Functions:
function scroll(deltaY, sensitivity)
function smoothScroll(target)
```

### 5. UI Overlay (`overlay.js`)
```javascript
// Responsibilities:
// - Render camera preview
// - Draw hand landmarks
// - Show gesture state indicator
// - Display status messages

// Key Functions:
function createOverlay()
function drawLandmarks(landmarks)
function showStatus(message)
function toggle()
```

### 6. State Manager (`state.js`)
```javascript
// Responsibilities:
// - Track enabled/disabled state
// - Store user preferences
// - Coordinate modules
// - Handle keyboard shortcuts

// State:
{
  enabled: boolean,
  cameraActive: boolean,
  showPreview: boolean,
  sensitivity: number,
  currentGesture: string
}
```

## Implementation Phases

### Phase 1: Proof of Concept (Webapp)
**Goal**: Validate gesture detection and scrolling work

| Step | Task | Deliverable |
|------|------|-------------|
| 1.1 | Set up project structure | `index.html`, basic CSS |
| 1.2 | Implement camera access | Working video feed |
| 1.3 | Integrate MediaPipe Hands | Landmark detection |
| 1.4 | Implement pinch detection | Console logs on pinch |
| 1.5 | Add scroll control | Page scrolls with pinch |
| 1.6 | Add basic UI overlay | Camera preview + landmarks |

**Estimated Complexity**: ~400 lines of code

### Phase 2: Polish & Optimization
**Goal**: Production-ready webapp

| Step | Task | Deliverable |
|------|------|-------------|
| 2.1 | Add smoothing/debouncing | Jitter-free scrolling |
| 2.2 | Implement toggle (Ctrl+Shift+G) | Keyboard control |
| 2.3 | Add status indicator | Visual feedback |
| 2.4 | Performance optimization | Stable 30 FPS |
| 2.5 | Error handling | Graceful degradation |
| 2.6 | Settings panel | Sensitivity adjustment |

### Phase 3: Browser Extension
**Goal**: Package as installable extension

| Step | Task | Deliverable |
|------|------|-------------|
| 3.1 | Create manifest.json (V3) | Extension structure |
| 3.2 | Background service worker | Lifecycle management |
| 3.3 | Content script injection | Cross-site support |
| 3.4 | Popup UI | Quick settings |
| 3.5 | Permission handling | Camera access flow |
| 3.6 | Chrome Web Store prep | Icons, description |

## File Structure

```
camera-browser-navigation/
├── REQUIREMENTS.md
├── IMPLEMENTATION_PLAN.md
├── webapp/                    # Standalone webapp (Phase 1-2)
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── main.js           # Entry point
│       ├── camera.js         # Camera module
│       ├── detector.js       # MediaPipe integration
│       ├── gestures.js       # Gesture recognition
│       ├── scroll.js         # Scroll control
│       ├── overlay.js        # UI overlay
│       └── state.js          # State management
├── extension/                 # Browser extension (Phase 3)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   └── icons/
└── docs/
    └── gestures.md           # Gesture reference
```

## Key Algorithms

### Pinch Detection
```javascript
function detectPinch(landmarks) {
  const thumbTip = landmarks[4];   // Thumb tip
  const indexTip = landmarks[8];   // Index finger tip

  const distance = Math.hypot(
    thumbTip.x - indexTip.x,
    thumbTip.y - indexTip.y
  );

  const PINCH_THRESHOLD = 0.05; // Normalized distance

  return {
    isPinching: distance < PINCH_THRESHOLD,
    position: {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2
    }
  };
}
```

### Smooth Scrolling
```javascript
function smoothScroll(deltaY, sensitivity = 1.0) {
  // Apply exponential smoothing
  const smoothedDelta = deltaY * 0.3 + lastDelta * 0.7;
  lastDelta = smoothedDelta;

  // Convert to pixels (video is normalized 0-1)
  const scrollAmount = smoothedDelta * window.innerHeight * sensitivity;

  window.scrollBy({
    top: scrollAmount,
    behavior: 'auto' // 'smooth' adds latency
  });
}
```

### Movement Debouncing
```javascript
const MOVEMENT_HISTORY = [];
const HISTORY_SIZE = 5;

function getSmoothedMovement(currentY) {
  MOVEMENT_HISTORY.push(currentY);
  if (MOVEMENT_HISTORY.length > HISTORY_SIZE) {
    MOVEMENT_HISTORY.shift();
  }

  // Return moving average
  return MOVEMENT_HISTORY.reduce((a, b) => a + b, 0) / MOVEMENT_HISTORY.length;
}
```

## Performance Optimization Strategies

### 1. Frame Rate Management
```javascript
// Process every 2nd frame if needed
let frameCount = 0;
function onFrame() {
  frameCount++;
  if (frameCount % 2 === 0) {
    processHandDetection();
  }
  requestAnimationFrame(onFrame);
}
```

### 2. Web Worker Offloading
- Consider moving gesture calculation to Web Worker
- Keep MediaPipe on main thread (needs canvas access)

### 3. Resolution Optimization
```javascript
const cameraConstraints = {
  video: {
    width: { ideal: 640 },  // Lower res = faster
    height: { ideal: 480 },
    frameRate: { ideal: 30, max: 30 }
  }
};
```

### 4. Detection Confidence Threshold
```javascript
// Only process high-confidence detections
if (results.multiHandLandmarks && results.multiHandedness[0].score > 0.8) {
  processGestures(results.multiHandLandmarks[0]);
}
```

## Testing Plan

| Test Type | Description | Tool |
|-----------|-------------|------|
| Unit | Gesture detection logic | Jest |
| Integration | Camera → Scroll pipeline | Manual |
| Performance | FPS, CPU, memory | Chrome DevTools |
| Usability | Real user testing | Manual |
| Compatibility | Cross-browser | BrowserStack |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor lighting affects detection | High | Add calibration step, adjust thresholds |
| High CPU usage | High | Frame skipping, resolution reduction |
| Browser compatibility issues | Medium | Feature detection, graceful fallback |
| MediaPipe model loading slow | Medium | Show loading indicator, cache model |
| False positive gestures | Medium | Require gesture hold time, confidence threshold |

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Detection accuracy | > 95% | Manual testing |
| Scroll responsiveness | < 100ms latency | Performance profiling |
| FPS stability | 30 FPS ± 5 | Chrome DevTools |
| User satisfaction | > 4/5 rating | User feedback |
