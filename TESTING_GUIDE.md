# Physics Testing Guide

## Quick Start

1. Start the app
2. Navigate to Free Roam or Racetrack section
3. Turn on the engine (click engine button)
4. Follow the test scenarios below

---

## Test Scenario 1: Understeer (High-Speed Direction Change)

### Setup
- Track: Any (Karting track recommended for space)
- Speed: Build up to 50+ km/h (about 2/3 throttle for 3-4 seconds)

### Steps
1. Drive straight and build speed
2. Turn LEFT sharply (press A or Left Arrow)
3. Immediately turn RIGHT sharply (press D or Right Arrow)
4. Repeat: LEFT → RIGHT → LEFT

### Expected Behavior
- **Feel:** Car feels heavy, resists direction changes
- **Visual:** Car doesn't turn as sharply as steering input suggests
- **Sound:** Drift/scrub sound plays (giulia-drift-sound.wav)
- **Physics:** Front tires lose grip, car "plows" forward
- **Recovery:** Gradually regains grip as speed reduces

### What You're Testing
- Weight transfer during direction changes
- Front grip loss (understeer)
- Inertia and momentum
- Sound system responding to understeer state

---

## Test Scenario 2: Power Oversteer (Throttle in Corner)

### Setup
- Track: Any with corners
- Speed: Moderate (30-40 km/h)

### Steps
1. Approach a corner at moderate speed
2. Turn into the corner (A or D)
3. Apply FULL throttle (W) mid-corner
4. Hold throttle and steering

### Expected Behavior
- **Feel:** Rear end slides out, car wants to spin
- **Visual:** Car rotates more than steering input, tail slides
- **Sound:** Drift/scrub sound plays (louder than understeer)
- **Physics:** Rear tires lose grip, oversteer triggered
- **Recovery:** Requires counter-steering to control

### What You're Testing
- Weight transfer backward during acceleration
- Rear grip loss (power oversteer)
- Oversteer detection and sound
- Counter-steering requirement

---

## Test Scenario 3: Handbrake Drift (Intentional Oversteer)

### Setup
- Track: Any with space
- Speed: 30+ km/h

### Steps
1. Build moderate speed
2. Turn into a corner
3. Press and HOLD SPACE (handbrake)
4. Modulate steering to control slide

### Expected Behavior
- **Feel:** Rear locks up, car slides sideways
- **Visual:** Dramatic tail slide, skid marks
- **Sound:** Maximum drift sound (volume 0.85)
- **Physics:** Rear grip drops to ~10%, oversteer triggered
- **Recovery:** Release handbrake, counter-steer

### What You're Testing
- Handbrake grip loss
- Drift effects (skid marks, smoke)
- Maximum oversteer sound
- Slide control

---

## Test Scenario 4: Weight Transfer (Braking)

### Setup
- Track: Any straight section
- Speed: 40+ km/h

### Steps
1. Build speed on straight
2. Apply FULL brake (S or Down Arrow)
3. Observe car behavior

### Expected Behavior
- **Feel:** Car dives forward, rear lifts
- **Visual:** Front suspension compresses (if visible)
- **Physics:** Weight shifts forward, front grip increases
- **Sound:** No drift sound (braking in straight line)

### What You're Testing
- Longitudinal weight transfer
- Front/rear load distribution
- Brake effectiveness

---

## Test Scenario 5: Trail Braking (Advanced)

### Setup
- Track: Corner with approach straight
- Speed: 45+ km/h

### Steps
1. Approach corner at high speed
2. Start braking BEFORE corner
3. Turn into corner WHILE STILL BRAKING
4. Release brake mid-corner
5. Apply throttle on exit

### Expected Behavior
- **Entry:** Weight forward, responsive turn-in
- **Mid-corner:** Balanced, car rotates well
- **Exit:** Weight backward, stable acceleration
- **Sound:** Brief understeer sound if too aggressive

### What You're Testing
- Dynamic weight transfer
- Brake + steer interaction
- Front grip during braking
- Smooth transition from brake to throttle

---

## Test Scenario 6: Burnout (W+S Simultaneously)

### Setup
- Track: Any location
- Speed: Stationary or slow

### Steps
1. Press and HOLD W (throttle)
2. Press and HOLD S (brake) simultaneously
3. Hold both keys for 2-3 seconds

### Expected Behavior
- **Feel:** Car doesn't move forward, wheels spin
- **Visual:** Smoke from rear tires, skid marks
- **Sound:** Maximum tire squeal (volume 0.85)
- **Physics:** Rear wheels spin, front wheels locked

### What You're Testing
- Burnout detection
- Maximum sound volume
- Visual effects (smoke, marks)

---

## Test Scenario 7: Slalom (Inertia Test)

### Setup
- Track: Long straight section
- Speed: 50+ km/h

### Steps
1. Build high speed
2. Perform slalom: LEFT → RIGHT → LEFT → RIGHT
3. Keep speed constant, only change direction

### Expected Behavior
- **Feel:** Car feels heavy, resists changes
- **Visual:** Wide, sweeping turns (not instant)
- **Sound:** Continuous drift/scrub sound
- **Physics:** Lateral forces, weight shifts side-to-side

### What You're Testing
- Inertia and momentum
- Lateral weight transfer
- Continuous grip loss
- Realistic handling at speed

---

## Test Scenario 8: Low-Speed Maneuverability

### Setup
- Track: Any location
- Speed: Very slow (5-10 km/h)

### Steps
1. Drive slowly
2. Turn sharply (full steering input)
3. Change direction quickly

### Expected Behavior
- **Feel:** Responsive, easy to control
- **Visual:** Tight turning radius
- **Sound:** No drift sound (low speed)
- **Physics:** Full grip, no understeer/oversteer

### What You're Testing
- Low-speed handling
- Grip at low speeds
- No false understeer/oversteer triggers

---

## Diagnostic Checklist

### Understeer
- [ ] Triggers at high speed + sharp turn
- [ ] Front grip drops below 0.25
- [ ] Car plows forward despite steering
- [ ] Drift sound plays (volume ~0.3-0.5)
- [ ] Recovers when speed reduces

### Oversteer
- [ ] Triggers with throttle in corner
- [ ] Rear grip drops below 0.3
- [ ] Car rotates more than steering input
- [ ] Drift sound plays (volume ~0.5-0.7)
- [ ] Requires counter-steering

### Weight Transfer
- [ ] Visible during braking (front dive)
- [ ] Visible during acceleration (rear squat)
- [ ] Affects grip distribution
- [ ] Smooth transitions

### Inertia
- [ ] Car resists sudden direction changes
- [ ] Feels heavy at high speed
- [ ] Momentum carries car forward
- [ ] Not arcade-like

### Sound System
- [ ] Burnout: Volume 0.85
- [ ] Handbrake drift: Volume scales with sideways speed
- [ ] Oversteer: Volume ~0.5-0.7
- [ ] Understeer: Volume ~0.3-0.5
- [ ] Smooth volume transitions

---

## Common Issues & Solutions

### Issue: No understeer at high speed
**Cause:** Not turning sharply enough or speed too low
**Solution:** Build speed to 50+ km/h, turn SHARPLY (full steering input)

### Issue: No oversteer with throttle
**Cause:** Speed too high or not enough throttle
**Solution:** Enter corner at 30-40 km/h, apply FULL throttle mid-corner

### Issue: Car feels too slidey
**Cause:** Grip values may need tuning
**Solution:** Increase `tireGrip` in CAR_CONFIG (currently 0.92)

### Issue: Car feels too grippy
**Cause:** Grip loss factors may be too low
**Solution:** Increase `accelerationGripLoss` or `brakingGripLoss` in CAR_CONFIG

### Issue: No drift sound
**Cause:** Sound file not loaded or volume too low
**Solution:** Check browser console for audio errors, verify `/sounds/giulia-drift-sound.wav` exists

---

## Performance Monitoring

### Browser Console
Open browser console (F12) and check for:
- No physics errors
- No audio errors
- Smooth frame rate (60 FPS)

### Visual Indicators
- Skid marks appear during drift
- Smoke particles during burnout
- Body roll visible in corners
- Smooth animations

### Audio Indicators
- Engine sound changes with RPM
- Drift sound plays during grip loss
- Volume scales appropriately
- No audio crackling or stuttering

---

## Advanced Testing

### Test Different Drive Modes
1. Switch between DNA modes (Efficient, Natural, Dynamic, Race)
2. Test same scenarios in each mode
3. **Expected:** Race mode = more power oversteer, Efficient mode = more stable

### Test Different Tracks
1. Drift track: Wide, smooth surfaces
2. Karting track: Tight corners, curbs
3. **Expected:** Different grip characteristics, same physics behavior

### Test Edge Cases
1. Reverse at high speed
2. 180-degree handbrake turn
3. Full lock steering at standstill
4. **Expected:** No crashes, stable physics

---

## Success Criteria

✅ **Understeer:** Triggers reliably at high speed + sharp turn
✅ **Oversteer:** Triggers reliably with throttle in corner
✅ **Weight Transfer:** Visible and affects grip
✅ **Inertia:** Car feels heavy and realistic
✅ **Sound:** Plays correctly for all grip loss states
✅ **No Crashes:** Physics remains stable in all scenarios
✅ **Fun Factor:** Car is challenging but controllable

---

## Feedback

After testing, note:
- Which scenarios work well?
- Which scenarios need tuning?
- Does the car feel realistic?
- Is it fun to drive?
- Any unexpected behavior?

Use this feedback to fine-tune the physics parameters in `carPhysics.js`.
