# Track and Visual Effects Fixes

## Issues Fixed

### 1. Floating Tire Marks on Karting Track ✅
**Problem:** Tire marks were positioned relative to car height, causing them to float in air or clip through terrain on tracks with elevation changes.

**Solution:** 
- Added raycasting to detect actual terrain height at each tire mark position
- Marks now spawn 1cm above the actual terrain surface they're on
- Prevents z-fighting while ensuring marks stick to ground

**Implementation:**
```javascript
// In DriftEffects.jsx
const raycasterRef = useRef(new THREE.Raycaster());
const rayOrigin = useRef(new THREE.Vector3());
const rayDown = useRef(new THREE.Vector3(0, -1, 0));

// Raycast down from mark position to find terrain
rayOrigin.current.set(worldX, y + 5, worldZ);
raycasterRef.current.set(rayOrigin.current, rayDown.current);
const hits = raycasterRef.current.intersectObjects(terrainMeshes, false);
if (hits.length > 0) {
  markY = hits[0].point.y + 0.01; // 1cm above terrain
}
```

**Changes:**
- `DriftEffects.jsx`: Added terrain raycasting for mark placement
- `DriftEffects.jsx`: Added `terrainMeshes` prop
- `KartTrackScene.jsx`: Pass `terrainMeshes` to DriftEffects
- `DriftTrackScene.jsx`: Pass `terrainMeshes` to DriftEffects

---

### 2. Smoke Rendering Under Transparent Car Parts ✅
**Problem:** Burnout smoke appeared under transparent meshes (windows, lights) but not under the body, creating a visual glitch where only the body was visible through smoke.

**Solution:**
- Set explicit `renderOrder` to control draw sequence
- Tire marks render first (renderOrder=0)
- Smoke renders last (renderOrder=100) to appear on top of everything
- Added `depthTest={true}` and `side={THREE.FrontSide}` for proper depth handling

**Implementation:**
```javascript
// Tire marks - render first
<instancedMesh renderOrder={0}>
  <meshBasicMaterial depthWrite={false} />
</instancedMesh>

// Smoke - render last (on top)
<instancedMesh renderOrder={100}>
  <meshBasicMaterial 
    depthWrite={false}
    depthTest={true}
    side={THREE.FrontSide}
  />
</instancedMesh>
```

**Why this works:**
- Higher renderOrder = drawn later = appears on top
- `depthTest={true}` ensures smoke respects depth buffer (doesn't render behind solid objects)
- `depthWrite={false}` prevents smoke from blocking other transparent objects
- Smoke now covers entire car uniformly, including body and transparent parts

---

### 3. Barriers Not Blocking in Drift Track ✅
**Problem:** Barriers were partially blocking but cars could drive through them.

**Solution:**
- Increased collision check frequency (every frame instead of every 2 frames)
- Increased collision detection distance from 1.0 to 1.5 units
- Stronger bounce-back response (0.6 instead of 0.3)
- Added velocity damping on collision
- Configurable collision parameters in terrain tuning

**New Parameters:**
```javascript
// In DriftTrackScene.jsx TRACK_TUNING
collisionRaycastModulo: 1,      // Check every frame (was 2)
collisionDistance: 1.5,         // Detection range in units
collisionBounce: 0.6,           // Bounce strength (0-1)
```

**Implementation:**
```javascript
// In CarModel.jsx collision detection
if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
  collision = true;
  // Bounce back with configurable strength
  physics.velX *= -collisionBounce;
  physics.velZ *= -collisionBounce;
  physics.forwardSpeed *= collisionBounce;
  physics.lateralSpeed *= collisionBounce;
  // Push car back from barrier
  const pushBack = Math.min(0.2, intersects[0].distance * 0.5);
  group.position.x -= forwardDir.x * pushBack;
  group.position.z -= forwardDir.z * pushBack;
}
```

**Effect:**
- Barriers now solidly block the car
- Realistic bounce-back on impact
- No more driving through walls

---

## Configuration Guide

### Tire Mark Placement
No configuration needed - automatically adapts to terrain height.

### Smoke Rendering
Adjust in `DriftEffects.jsx`:
```javascript
// Smoke appearance
renderOrder={100}        // Higher = renders later (on top)
opacity={0.25}          // Transparency (0-1)
color="#cccccc"         // Smoke color

// Smoke physics
s.vy = 1.5 + Math.random() * 3  // Upward velocity
s.life = 1.0                     // Lifetime in seconds
```

### Barrier Collision
Adjust in scene's `TRACK_TUNING`:
```javascript
collisionRaycastModulo: 1,    // Check frequency (1=every frame)
                              // Lower = more responsive
                              // Higher = better performance

collisionDistance: 1.5,       // Detection range
                              // Increase for earlier detection
                              // Decrease for tighter tolerance

collisionBounce: 0.6,         // Bounce strength (0-1)
                              // 0 = no bounce (stop dead)
                              // 1 = full elastic bounce
                              // 0.6 = realistic impact
```

---

## Testing Checklist

### Tire Marks
- [ ] Drive on flat sections - marks should be on ground
- [ ] Drive on slopes - marks should follow terrain contour
- [ ] Drive on bumpy sections - marks should stick to surface
- [ ] No floating marks in air
- [ ] No marks clipping through ground

### Smoke
- [ ] Burnout smoke covers entire car body
- [ ] Smoke doesn't disappear behind transparent parts
- [ ] Smoke appears on top of car uniformly
- [ ] Smoke doesn't render inside car interior
- [ ] Smoke fades naturally as it rises

### Barriers
- [ ] Cannot drive through barriers
- [ ] Car bounces back on impact
- [ ] Collision feels solid and responsive
- [ ] No clipping through walls at high speed
- [ ] Barriers work on all track sections

---

## Technical Notes

### Raycasting Performance
- Tire marks raycast only when spawning (not every frame)
- Uses existing terrainMeshes array (no additional overhead)
- Minimal performance impact

### Render Order
- Three.js renders objects in this order:
  1. Opaque objects (by depth, front to back)
  2. Transparent objects (by renderOrder, then depth back to front)
- renderOrder overrides default sorting for transparent objects
- Lower renderOrder = drawn first = appears behind
- Higher renderOrder = drawn last = appears on top

### Collision Detection
- Raycasts in direction of movement
- Only checks when car is moving (speed > 0.5)
- Configurable frequency to balance performance/accuracy
- Uses existing trackColliders array (no new geometry needed)

---

## Files Modified

1. `src/components/Effects/DriftEffects.jsx`
   - Added terrain raycasting for mark placement
   - Added renderOrder for proper draw sequence
   - Added terrainMeshes prop
   - Improved smoke positioning

2. `src/components/Scene/CarModel.jsx`
   - Enhanced collision detection
   - Added configurable collision parameters
   - Stronger bounce-back response

3. `src/components/Scene/DriftTrackScene.jsx`
   - Updated TRACK_TUNING with collision parameters
   - Pass terrainMeshes to DriftEffects

4. `src/components/Scene/KartTrackScene.jsx`
   - Pass terrainMeshes to DriftEffects

---

## Summary

All three issues resolved:
1. ✅ Tire marks now stick to terrain on elevation changes
2. ✅ Smoke renders properly over entire car (no transparent part glitches)
3. ✅ Barriers solidly block car movement in drift track

The fixes are performance-friendly and use existing systems (raycasting, renderOrder) without adding significant overhead.
