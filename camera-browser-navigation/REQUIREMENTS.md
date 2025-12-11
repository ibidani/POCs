# Camera Browser Navigation - Requirements

## Overview
A lightweight browser extension/webapp that enables hands-free browser navigation using webcam-based hand gesture recognition. The system prioritizes performance and simplicity, starting with scroll control via pinch gestures.

## Goals
- **Performance**: Real-time gesture detection at 30+ FPS with minimal CPU usage
- **Simplicity**: Clean, minimal UI with intuitive gestures
- **Accessibility**: Enable hands-free browsing for users with mobility limitations
- **Privacy**: All processing done locally - no data leaves the browser

## Functional Requirements

### Phase 1: Core Scroll Control (MVP)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Detect pinch gesture (thumb + index finger) | High |
| FR-2 | Scroll up when pinch moves up | High |
| FR-3 | Scroll down when pinch moves down | High |
| FR-4 | Scroll speed proportional to movement speed | High |
| FR-5 | Visual feedback showing detected gesture | Medium |
| FR-6 | Toggle on/off with keyboard shortcut | High |
| FR-7 | Camera preview overlay (toggleable) | Medium |

### Phase 2: Extended Navigation (Future)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8 | Horizontal scroll with horizontal pinch movement | Medium |
| FR-9 | Click action with closed fist gesture | Low |
| FR-10 | Back/Forward with swipe gestures | Low |
| FR-11 | Zoom with two-hand pinch | Low |

## Non-Functional Requirements

### Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Frame processing latency | < 33ms (30 FPS) |
| NFR-2 | Gesture detection latency | < 100ms |
| NFR-3 | CPU usage (idle with camera on) | < 15% |
| NFR-4 | CPU usage (active gesture tracking) | < 30% |
| NFR-5 | Memory footprint | < 100MB |

### Compatibility
| ID | Requirement |
|----|-------------|
| NFR-6 | Chrome 90+ support |
| NFR-7 | Firefox 88+ support |
| NFR-8 | Edge 90+ support |
| NFR-9 | Works with standard webcams (720p+) |

### Usability
| ID | Requirement |
|----|-------------|
| NFR-10 | No installation required for webapp version |
| NFR-11 | One-click enable/disable |
| NFR-12 | Clear visual indication of active state |
| NFR-13 | Works in varying lighting conditions |

## Technical Constraints
- Must use WebRTC for camera access
- Must use MediaPipe Hands or TensorFlow.js HandPose for detection
- All processing must be client-side (no server calls)
- Must not interfere with normal browsing

## User Stories

### US-1: Basic Scroll
> As a user, I want to scroll a webpage by making a pinch gesture and moving my hand up/down, so I can browse without touching my device.

**Acceptance Criteria:**
- Camera permission requested on first use
- Pinch gesture detected within 1 second
- Smooth scrolling follows hand movement
- Scroll stops when pinch is released

### US-2: Toggle Control
> As a user, I want to quickly enable/disable gesture control, so I can switch between gesture and traditional input.

**Acceptance Criteria:**
- Keyboard shortcut (Ctrl+Shift+G) toggles control
- Visual indicator shows current state
- Camera stops when disabled (saves resources)

### US-3: Visual Feedback
> As a user, I want to see my detected hand position, so I know the system is tracking correctly.

**Acceptance Criteria:**
- Optional camera preview in corner
- Hand landmarks overlay on preview
- Current gesture state displayed

## Gesture Definitions

### Pinch Gesture
```
Detection: Distance between thumb tip and index finger tip < threshold (25px normalized)
States:
  - PINCH_START: Fingers come together
  - PINCH_HOLD: Fingers remain together
  - PINCH_END: Fingers separate

Scroll Mapping:
  - Track Y-position of pinch midpoint
  - Delta Y * sensitivity = scroll amount
  - Positive delta = scroll down
  - Negative delta = scroll up
```

## Out of Scope (Phase 1)
- Multi-hand gestures
- Custom gesture training
- Voice commands
- Mobile browser support
- Gesture recording/playback
