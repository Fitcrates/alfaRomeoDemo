# Alfa Romeo Experience - Camera System Documentation

This document explains how to adjust camera positions and angles for each section of the Alfa Romeo experience.

## Overview

The experience uses a **fixed car position** with a **moving camera** system. As the user scrolls through sections, the camera smoothly transitions to different positions to showcase various angles of the car.

## File Locations

| File | Purpose |
|------|---------|
| `src/components/Scene/CameraController.jsx` | Camera configurations and movement logic |
| `src/components/ScrollExperience.jsx` | Car position and scene setup |

---

## Coordinate System

Understanding the 3D coordinate system is essential for positioning the camera:

```
                    +Z (Front of car)
                        ▲
                        │
                        │
         -X ◄───────────┼───────────► +X
        (Left)     [CAR]            (Right)
                        │
                        │
                        ▼
                    -Z (Rear of car)

Y-axis: +Y is UP, -Y is DOWN
Ground level: y ≈ -0.8
Car center: y ≈ 0
```

---

## Camera Configuration Parameters

Each section has three main parameters:

### 1. Position `[x, y, z]`
Where the camera is located in 3D space.

| Axis | Negative (-) | Zero (0) | Positive (+) |
|------|--------------|----------|--------------|
| **X** | Left of car | Centered | Right of car |
| **Y** | Below car (ground ~-0.8) | Car center height | Above car |
| **Z** | Behind car (rear) | Centered | In front of car |

### 2. Target `[x, y, z]`
The point in 3D space the camera looks at.

| Common Values | Effect |
|---------------|--------|
| `[0, 0, 0]` | Look at car center |
| `[0, 0.5, 0]` | Look at upper body/roof |
| `[0, -0.3, 0]` | Look at lower body/wheels |
| `[0, 0, 2]` | Look at front of car |
| `[0, 0, -2]` | Look at rear of car |
| `[0.8, 0.3, 1.5]` | Look at front-right wheel |

### 3. FOV (Field of View)
Controls how "zoomed in" the view appears.

| FOV Value | Effect |
|-----------|--------|
| 30-40 | Telephoto - compressed perspective, dramatic |
| 45-55 | Natural - balanced, standard view |
| 60-80 | Wide angle - shows more, can distort edges |

---

## Section Configurations

Edit these values in `src/components/Scene/CameraController.jsx`:

### Hero Section
```javascript
hero: {
  position: [5, 1.5, 7],    // Front-right, elevated
  target: [0, 0, 0],        // Car center
  fov: 45,                  // Standard
}
```
**Purpose:** Opening dramatic shot, classic 3/4 view

**Adjustments:**
- Closer view: `position: [4, 1.5, 5]`
- More dramatic low angle: `position: [5, 0.5, 7]`
- Show more side: `position: [7, 1.5, 5]`

---

### Engine Section
```javascript
engine: {
  position: [3, 1.2, 6],    // Close front view
  target: [0, 0.3, 1],      // Hood area
  fov: 50,
}
```
**Purpose:** Showcase front design and hood

**Adjustments:**
- Focus on grille: `target: [0, 0.5, 2]`
- Lower dramatic angle: `position: [3, 0.4, 6]`

---

### Suspension Section
```javascript
suspension: {
  position: [-5, 0.8, 4],   // Left side, low
  target: [0, 0, 0],
  fov: 48,
}
```
**Purpose:** Show stance and suspension

**Adjustments:**
- Show rear suspension: `position: [-5, 0.8, -3]`
- Lower to emphasize stance: `position: [-5, 0.3, 4]`

---

### Wheels Section
```javascript
wheels: {
  position: [4, 0.4, 3],    // Low, front-right
  target: [0.8, 0.3, 1.5],  // Front-right wheel
  fov: 55,
}
```
**Purpose:** Focus on wheels and brakes

**Adjustments:**
- Focus on rear wheel: `position: [4, 0.4, -2]`, `target: [0.8, 0.3, -1.5]`
- More dramatic: `position: [3, 0.2, 2]`

---

### Interior Section
```javascript
interior: {
  position: [3.5, 1.3, 1.5],  // Right side, cabin level
  target: [0, 0.9, 0.3],      // Dashboard area
  fov: 52,
}
```
**Purpose:** Showcase interior through window

**Adjustments:**
- Closer to window: `position: [2.5, 1.2, 1]`
- Show more dashboard: `target: [0, 0.8, 0.8]`

---

### Engine Bay Section
```javascript
enginebay: {
  position: [1.5, 3.5, 3],    // Above and front
  target: [0, 0.5, 1.5],      // Engine bay
  fov: 50,
}
```
**Purpose:** Top-down view of engine compartment

**Adjustments:**
- More top-down: `position: [0, 4, 2]`
- Angled view: `position: [2.5, 3, 2.5]`

---

### Gallery Section
```javascript
gallery: {
  position: [-4, 1.5, -5],    // Left-rear
  target: [0, 0.2, 0],
  fov: 45,
}
```
**Purpose:** Rear 3/4 beauty shot

**Adjustments:**
- Show more rear: `position: [0, 1.5, -7]`
- Dramatic low: `position: [-4, 0.5, -5]`

---

### Free Roam Section
```javascript
freeroam: {
  position: [5, 2, 6],
  target: [0, 0, 0],
  fov: 45,
}
```
**Purpose:** Starting position before user takes control

**Note:** OrbitControls takes over after initial position

---

### Contact Section
```javascript
contact: {
  position: [0, 1.5, 8],      // Direct front
  target: [0, 0, 0],
  fov: 42,
}
```
**Purpose:** Final beauty shot

**Adjustments:**
- More cinematic: `fov: 35`, `position: [0, 1.2, 10]`

---

## Car Position Configuration

Edit in `src/components/ScrollExperience.jsx`:

```javascript
const CAR_POSITION = [0, -0.8, 0]  // [x, y, z]
const CAR_ROTATION = Math.PI * 0.05  // Radians
```

### CAR_POSITION
| Value | Effect |
|-------|--------|
| `[0, -0.8, 0]` | Centered on floor (default) |
| `[2, -0.8, 0]` | Shifted right |
| `[-2, -0.8, 0]` | Shifted left |
| `[0, -0.8, 2]` | Shifted forward |

### CAR_ROTATION
| Value | Car Facing Direction |
|-------|---------------------|
| `0` | Directly at camera (+Z) |
| `Math.PI * 0.25` | 45° right |
| `Math.PI * 0.5` | Right side (+X) |
| `Math.PI` | Away from camera (-Z) |
| `Math.PI * 1.5` | Left side (-X) |

---

## Quick Reference - Common Adjustments

### To Zoom In
- Move camera closer (reduce distance from `[0,0,0]`)
- OR reduce FOV (e.g., `45 → 35`)

### To Zoom Out
- Move camera further away
- OR increase FOV (e.g., `45 → 60`)

### To Show More of One Side
- Increase `x` for more right side visible
- Decrease `x` (negative) for more left side visible

### To Look Down at Car
- Increase camera `y` position
- Decrease target `y`

### To Look Up at Car (Dramatic)
- Decrease camera `y` position (closer to ground)
- Increase target `y`

### To Focus on Specific Part
- Move target coordinates to that part
- Move camera closer to that area

---

## Transition Speed

The camera transition smoothness is controlled by `lerpSpeed` in `CameraController.jsx`:

```javascript
const lerpSpeed = 4  // Lower = smoother but slower
                     // Higher = snappier response
```

---

## Example: Creating a New Camera Angle

To add a dramatic low-angle front shot for the engine section:

```javascript
engine: {
  position: [2, 0.3, 5],    // Low (y=0.3), close front
  target: [0, 0.8, 0],      // Look up at hood
  fov: 55,                  // Slightly wide for drama
}
```

This creates a "hero shot" looking up at the car from a low angle.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera clips through car | Move camera position further away |
| Car looks distorted | Reduce FOV (use 40-50 range) |
| Transition feels jerky | Reduce `lerpSpeed` value |
| Can't see specific part | Adjust target to focus on that area |
| View feels too close | Increase distance or increase FOV |
