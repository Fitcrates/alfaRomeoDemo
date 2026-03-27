# Understeer Reduction Updates

## Overview
Applied targeted physics improvements to reduce understeer at low speeds and during braking, with comprehensive tuning documentation.

---

## Changes Applied

### 1. Low-Speed Grip Boost (NEW)
**Problem:** Car understeers excessively below 50% of max speed  
**Solution:** Progressive grip boost that fades from 0% to 50% speed

**New Parameter:**
```javascript
lowSpeedGripBoost: 1.25  // 25% extra front grip at low speeds
```

**How it works:**
- At 0% speed: Full boost applied (1.25x front grip)
- At 25% speed: Half boost applied (1.125x front grip)
- At 50% speed: No boost (1.0x front grip)
- Above 50% speed: No boost

**To adjust:**
- Increase (e.g., 1.30-1.35) for even sharper low-speed turns
- Decrease (e.g., 1.15-1.20) for more realistic low-speed behavior
- Set to 1.0 to disable completely

---

### 2. Braking Grip Boost (NEW)
**Problem:** Car understeers when braking and turning simultaneously  
**Solution:** Extra front grip proportional to brake pressure

**New Parameter:**
```javascript
brakingFrontGripBoost: 1.28  // 28% extra front grip when fully braking
```

**How it works:**
- No braking (0%): No boost (1.0x front grip)
- Half braking (50%): Half boost (1.14x front grip)
- Full braking (100%): Full boost (1.28x front grip)

**To adjust:**
- Increase (e.g., 1.35-1.40) for trail-braking oversteer behavior
- Decrease (e.g., 1.15-1.20) for more neutral braking
- Set to 1.0 to disable completely

---

### 2b. Brake Rotation Assist (NEW - KEYBOARD COMPENSATION)
**Problem:** Keyboard braking is binary (0% or 100%), can't modulate like real trail-braking  
**Solution:** Automatically reduce rear grip when braking + steering to rotate the car

**New Parameters:**
```javascript
brakingRearGripReduction: 0.82      // 18% less rear grip when trail-braking
brakingRotationThreshold: 0.25      // Min steering input to activate (25%)
```

**How it works:**
- Braking only: No effect (normal braking)
- Steering only: No effect (normal turning)
- Braking + steering >25%: Rear grip reduces progressively
- More steering = more rotation (scales up to 80% steering input)
- Simulates proper trail-braking technique automatically

**Effect:** Car will tighten its line when braking into corners, rear steps out slightly

**To adjust brakingRearGripReduction:**
- Lower (0.75-0.80) for more aggressive rotation (loose rear)
- Higher (0.85-0.90) for gentler rotation (more stable)
- Set to 1.0 to disable rotation assist

**To adjust brakingRotationThreshold:**
- Lower (0.15-0.20) for easier activation (small steering triggers it)
- Higher (0.30-0.40) for harder activation (requires more steering)
- Typical: 0.20-0.30 for most users

---

### 3. Base Front Grip Increase
**Changed:**
```javascript
frontGripMu: 1.12  →  1.22  // +9% base front grip
```

**Effect:** Improves overall front tire bite, reduces general understeer tendency

**To adjust:**
- Increase (1.25-1.30) for even less understeer
- Decrease (1.15-1.18) if car feels too responsive
- Balance with rearGripMu to control oversteer/understeer balance

---

### 4. Geometric Correction Improvements
**Changed:**
```javascript
geometricMaxYawAccel: 1.8  →  2.2   // +22% turn-in response
geometricSpringRate: 4.0   →  5.0   // +25% correction strength
```

**Effect:** Sharper initial turn-in response, especially at lower speeds

**To adjust geometricMaxYawAccel:**
- Increase (2.5-3.0) for arcade-like instant response
- Decrease (1.5-1.8) for more realistic, gradual turn-in
- This is THE key parameter for keyboard snap prevention

**To adjust geometricSpringRate:**
- Increase (6.0-8.0) for faster correction to geometric path
- Decrease (3.0-4.0) for more natural, tire-dominated behavior

---

## Complete Tuning Guide

### Understeer/Oversteer Balance
```javascript
// More front grip = less understeer
frontGripMu: 1.22           // Range: 1.0-1.3

// More rear grip = less oversteer
rearGripMu: 1.18            // Range: 1.0-1.3

// Ratio matters: front/rear = 1.22/1.18 = 1.03 (slight understeer bias)
```

### Low-Speed Behavior
```javascript
// Grip boost below 50% speed
lowSpeedGripBoost: 1.25     // Range: 1.0-1.35

// Tighter turns at low speed
minWheelbaseFraction: 0.55  // Range: 0.35-0.75 (lower = tighter)

// Turn-in sharpness
geometricMaxYawAccel: 2.2   // Range: 1.0-3.0 (higher = sharper)
```

### Braking Behavior
```javascript
// Front grip when braking
brakingFrontGripBoost: 1.28      // Range: 1.0-1.40

// Rear grip reduction for rotation (KEYBOARD ASSIST)
brakingRearGripReduction: 0.82   // Range: 0.75-0.95 (lower = more rotation)

// Steering threshold to activate rotation
brakingRotationThreshold: 0.25   // Range: 0.15-0.40 (lower = easier to trigger)

// Brake force distribution (in updateCarPhysics)
FxFront = -maxBrakeForce * 0.7  // 70% front
FxRear = -maxBrakeForce * 0.3   // 30% rear
```

### Tire Slip Characteristics
```javascript
// Peak slip angle (where max grip occurs)
peakSlipAngle: 0.39         // Range: 0.25-0.50 radians
                            // Lower = sharper, earlier breakaway
                            // Higher = progressive, later breakaway
```

### Turn-In Response
```javascript
// Max angular acceleration for corrections
geometricMaxYawAccel: 2.2   // Range: 1.0-3.0
                            // Lower = gentle, realistic
                            // Higher = sharp, arcade

// Correction spring stiffness
geometricSpringRate: 5.0    // Range: 2.0-8.0
                            // Lower = slower correction
                            // Higher = faster correction

// Lateral damping in grip
gripLateralDamping: 1.0     // Range: 0.3-2.0
                            // Lower = more float/drift
                            // Higher = cleaner tracking
```

---

## Testing Recommendations

### Test 1: Low-Speed Turns (Parking Lot)
- Drive at 20-30 km/h
- Make tight turns with full steering
- **Expected:** Car should turn sharply without plowing forward
- **Adjust:** `lowSpeedGripBoost` if still understeering

### Test 2: Trail Braking (Corner Entry)
- Approach corner at 80+ km/h
- Brake while turning in (keyboard: full brake + steering)
- **Expected:** Car should rotate/tighten the turn, rear steps out slightly
- **Adjust:** `brakingRearGripReduction` for more/less rotation
- **Adjust:** `brakingRotationThreshold` if activating too early/late

### Test 3: Mid-Speed Corners (40-60 km/h)
- Steady throttle through sweeping turns
- **Expected:** Neutral balance, follows steering input
- **Adjust:** `frontGripMu` vs `rearGripMu` ratio

### Test 4: High-Speed Stability (100+ km/h)
- Fast sweepers with small steering inputs
- **Expected:** Stable, predictable, no twitching
- **Adjust:** `geometricMaxYawAccel` if too snappy

---

## Quick Fixes

### "Still too much understeer at low speeds"
```javascript
lowSpeedGripBoost: 1.35      // Increase from 1.25
frontGripMu: 1.28            // Increase from 1.22
```

### "Braking into corners still pushes wide"
```javascript
brakingFrontGripBoost: 1.35       // Increase from 1.28
brakingRearGripReduction: 0.78    // Decrease from 0.82 (more rotation)
brakingRotationThreshold: 0.20    // Decrease from 0.25 (easier to trigger)
```

### "Car spins out when braking into corners"
```javascript
brakingRearGripReduction: 0.88    // Increase from 0.82 (less rotation)
brakingRotationThreshold: 0.35    // Increase from 0.25 (harder to trigger)
// Or disable rotation assist:
brakingRearGripReduction: 1.0     // Disable completely
```

### "Turn-in feels too slow/numb"
```javascript
geometricMaxYawAccel: 2.5    // Increase from 2.2
geometricSpringRate: 6.0     // Increase from 5.0
```

### "Car feels too twitchy/arcade"
```javascript
geometricMaxYawAccel: 1.8    // Decrease from 2.2
geometricSpringRate: 4.0     // Decrease from 5.0
lowSpeedGripBoost: 1.15      // Decrease from 1.25
```

---

## Technical Details

### Low-Speed Boost Implementation
```javascript
const speedPercent = speedKmh / topSpeedKmh
const lowSpeedBoost = speedPercent < 0.5
  ? THREE.MathUtils.lerp(
      config.lowSpeedGripBoost || 1.0,
      1.0,
      speedPercent / 0.5
    )
  : 1.0
```
- Uses linear interpolation for smooth transition
- Only active below 50% of max speed
- Multiplies front tire grip coefficient

### Braking Boost Implementation
```javascript
const brakingBoost = THREE.MathUtils.lerp(
  1.0,
  config.brakingFrontGripBoost || 1.0,
  brakeUsage
)
```
- Proportional to brake input (0.0-1.0)
- Linear scaling for predictable behavior
- Only affects front tires (realistic weight transfer)

### Brake Rotation Assist Implementation (KEYBOARD COMPENSATION)
```javascript
const steeringAmount = Math.abs(steeringInput)
const rotationThreshold = config.brakingRotationThreshold || 0.25

const isTrailBraking = brakeUsage > 0.3 && steeringAmount > rotationThreshold

const rotationIntensity = isTrailBraking
  ? brakeUsage * smoothstep(steeringAmount, rotationThreshold, 0.8)
  : 0

const brakingRearReduction = THREE.MathUtils.lerp(
  1.0,
  config.brakingRearGripReduction || 0.82,
  rotationIntensity
)
```
- Only activates when braking >30% AND steering >threshold
- Scales with both brake pressure and steering input
- Uses smoothstep for progressive activation
- Reduces rear grip to induce controlled rotation
- Simulates proper trail-braking technique for keyboard users

**Why this works:**
- Real drivers modulate brakes (100% → 50% → 0%) through corner
- Keyboard users can only do (100% → 0%), no middle ground
- This system automatically reduces rear grip to compensate
- Result: Car rotates into corner like proper trail-braking

### Combined Grip Calculation
```javascript
const frontMu =
  config.frontGripMu *
  surfaceMu *
  (0.9 + (0.6 * frontLoad) / baseFront) *
  frontLatAvailable *
  lowSpeedBoost *      // NEW
  brakingBoost         // NEW
```
- Boosts multiply with existing grip factors
- Preserves weight transfer and traction circle effects
- Surface grip and load sensitivity still apply

---

## Summary

**Key improvements:**
1. ✅ 25% extra front grip below 50% speed (reduces low-speed understeer)
2. ✅ 28% extra front grip when braking (enables trail-braking)
3. ✅ 18% rear grip reduction when braking + steering (keyboard trail-brake assist)
4. ✅ Progressive rotation scaling with steering input (natural feel)
5. ✅ 9% higher base front grip (improves overall turn-in)
6. ✅ 22% sharper turn-in response (better initial bite)
7. ✅ Comprehensive tuning documentation with ranges and effects

**Result:** Car now tightens its line when braking into corners (like real trail-braking), turns eagerly at low speeds, and maintains high-speed stability.
