# Three.js App Fixes Applied

## Summary of Changes

### 1. ✅ Duplicate Lights Code - RESOLVED

**Issue**: After refactoring, lights were duplicated between `carLights.jsx` (unused) and `CarModel.jsx` (active).

**Solution**: 
- Marked `src/components/CarModel/carLights.jsx` as DEPRECATED with clear comments
- The active lights implementation remains in `src/components/Scene/CarModel.jsx` (lines 680-760+)
- No code removal to maintain git history, but file is clearly marked as unused

**Recommendation**: You can safely delete `src/components/CarModel/carLights.jsx` if desired.

---

### 2. ✅ Kart Track Sinking Issue - FIXED

**Issue**: Car tires were getting covered by asphalt in some places on the karting track.

**Root Cause**: `CAR_RIDE_HEIGHT = 0.0` meant the car had zero ground clearance.

**Solution**:
- Added `carRideHeight: 0.08` to karting track tuning (8cm clearance)
- Added `carRideHeight: 0.05` to drift track tuning (5cm clearance)
- Updated `CarModel.jsx` to use `terrainConfig.carRideHeight ?? 0.05` as fallback
- Improved terrain following settings for karting track:
  - `terrainRaycastModulo: 1` - Sample EVERY frame for maximum responsiveness
  - `maxRisePerSecond: 15.0` - Very fast rise to immediately lift car if sinking
  - `maxStepUp: 2.5` - Moderate step for curbs
  - `minTerrainNormalY: 0.1` - Accept most surfaces but filter extreme slopes

**Files Modified**:
- `src/components/Scene/KartTrackScene.jsx`
- `src/components/Scene/DriftTrackScene.jsx`
- `src/components/Scene/CarModel.jsx`

---

### 3. ✅ Drift Sound for Oversteer/Understeer - IMPLEMENTED

**Issue**: Drift sound (`/sounds/giulia-drift-sound.wav`) was loaded but only triggered during handbrake drift, not during oversteer/understeer.

**Solution**:
- Enhanced `EngineSoundSystem.jsx` to read `isOversteering` and `isUndersteering` from `carPositionRef`
- Added sound logic:
  - **Burnout**: Volume 0.85 (highest intensity)
  - **Handbrake Drift**: Volume scales with sideways speed (0-1.0)
  - **Oversteer** (rear tires losing grip): Volume scales with speed, max 0.7
  - **Understeer** (front tires scrubbing): Volume scales with speed, max 0.5

**Physics Already Exports These States**:
The physics system in `carPhysics.js` already calculates and exports:
- `isOversteering`: When slip angle exceeds threshold and car is sliding
- `isUndersteering`: When slip ratio is high and steering input is active

**Files Modified**:
- `src/components/Audio/EngineSoundSystem.jsx`

---

## Testing Recommendations

1. **Kart Track**: Drive around the entire track and verify the car rides smoothly on the asphalt without tires sinking below the surface.

2. **Drift Sound**: 
   - Test handbrake drifting (Space key) - should hear tire squeal
   - Test high-speed cornering without handbrake - should hear understeer sound when front tires scrub
   - Test aggressive steering at speed - should hear oversteer sound when rear slides out
   - Test burnout (W+S simultaneously) - should hear maximum tire squeal

3. **Lights**: Verify headlights and taillights work correctly (no change in functionality, just code cleanup).

---

## Technical Details

### Terrain Following Improvements

The karting track now uses aggressive terrain following to prevent sinking:
- Samples terrain every frame (no skipping)
- Fast vertical adjustment (15 units/sec rise, 12 units/sec fall)
- Proper ground clearance (8cm) ensures tires stay above surface
- Tight tolerance (3.0 units) prevents sudden jumps

### Sound System Architecture

The drift sound system now has 4 distinct states:
1. **Burnout** (W+S): Maximum squeal, simulates stationary wheel spin
2. **Handbrake Drift** (Space): Dynamic volume based on lateral velocity
3. **Oversteer**: Rear tires breaking traction during cornering
4. **Understeer**: Front tires scrubbing when turning too aggressively

All sounds blend smoothly with 0.15 lerp factor for natural transitions.

---

## Files Changed

1. `src/components/Audio/EngineSoundSystem.jsx` - Added oversteer/understeer sound
2. `src/components/Scene/KartTrackScene.jsx` - Fixed ride height and terrain tuning
3. `src/components/Scene/DriftTrackScene.jsx` - Added ride height config
4. `src/components/Scene/CarModel.jsx` - Use configurable ride height
5. `src/components/CarModel/carLights.jsx` - Marked as deprecated

---

## No Breaking Changes

All changes are backward compatible and enhance existing functionality without removing features.
