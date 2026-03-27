# Physics System - Quick Summary

## What Changed

Completely rewrote the car physics to add realistic weight transfer, grip dynamics, and inertia.

## Key Improvements

### 1. Real Weight Transfer
- Weight shifts forward when braking → front tires grip better
- Weight shifts backward when accelerating → rear tires grip better
- Weight shifts during cornering → affects grip distribution
- **You can now FEEL the weight of the car**

### 2. Separate Front & Rear Grip
- Front tires and rear tires now have independent grip values
- Each axle responds differently to weight transfer and driver inputs
- Grip values range from 0.1 (10% - sliding) to 1.0 (100% - full traction)

### 3. Realistic Understeer
**When:** High-speed cornering + braking, or sudden direction changes
**Feel:** Car doesn't turn enough, plows forward, front tires scrub
**How to trigger:** Drive fast (>40 km/h), turn sharply while braking
**How to recover:** Reduce steering, lift throttle to shift weight forward

### 4. Realistic Oversteer
**When:** Accelerating in a corner (power oversteer)
**Feel:** Rear end slides out, car rotates too much, tail-happy
**How to trigger:** Enter corner at moderate speed, apply throttle mid-corner
**How to recover:** Counter-steer, modulate throttle

### 5. Proper Inertia
- Car now has momentum and resists sudden direction changes
- High-speed slalom feels heavy and realistic
- No more instant direction changes

## How to Test

### Test 1: Understeer
1. Drive at 50+ km/h
2. Turn left sharply
3. Immediately turn right sharply
4. **Expected:** Car resists, plows forward, front tires scrub

### Test 2: Power Oversteer
1. Drive at 30 km/h
2. Turn into a corner
3. Apply full throttle mid-corner
4. **Expected:** Rear slides out, car rotates, requires counter-steering

### Test 3: Weight Transfer
1. Drive at any speed
2. Brake hard
3. **Expected:** Front dives, rear lifts, car feels heavy

## Technical Details

- **Weight Distribution:** 52% front / 48% rear (realistic for Giulia QV)
- **Understeer Trigger:** Front grip < 25%
- **Oversteer Trigger:** Rear grip < 30%
- **Weight Transfer Range:** 20% to 80% (dynamic)

## Files Changed

- `src/components/CarModel/carPhysics.js` - Complete rewrite

## No Breaking Changes

All changes are internal. The physics API remains the same.

---

**Result:** The car now feels like a real 505hp RWD sports sedan with proper weight transfer, grip loss, and inertia. No more arcade-like instant direction changes!
