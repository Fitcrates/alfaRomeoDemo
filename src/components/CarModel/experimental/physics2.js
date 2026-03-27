import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════
// DEFINITIVE PHYSICS v3 — Geometric turning + grip modulation
//
// Philosophy: The car TURNS using geometry (like the original
// working code). Tire grip MODULATES how much of that turn the
// car can actually achieve. This gives both responsive steering
// AND natural understeer/oversteer/drift.
//
// Car model is 5.2 game units long (CarModel.jsx line 215).
// Original working wheelbase was 4.52 game units.
// ═══════════════════════════════════════════════════════════════

// DNA drive mode profiles
export const DRIVE_MODES = {
    efficient: {
        maxSpeed: 66,
        acceleration: 5,
        braking: 20,
        friction: 18,
        label: "All Weather",
    },
    natural: {
        maxSpeed: 66,
        acceleration: 8,
        braking: 22,
        friction: 16,
        label: "Natural",
    },
    dynamic: {
        maxSpeed: 66,
        acceleration: 11,
        braking: 25,
        friction: 14,
        label: "Dynamic",
    },
    race: {
        maxSpeed: 66,
        acceleration: 15,
        braking: 30,
        friction: 12,
        label: "Race",
    },
};

export const CAR_CONFIG = {
    // ── Geometry (game units) ──────────────────────────────────
    wheelbase: 4.52,       // Original working value
    trackWidth: 1.87,

    // ── Steering ───────────────────────────────────────────────
    maxSteeringAngle: Math.PI / 6,    // ~30° at standstill
    minSteeringAngle: Math.PI / 24,   // ~7.5° at top speed
    steeringSpeed: 2.0,
    steeringReturnSpeed: 2.0,

    // ── Powertrain ─────────────────────────────────────────────
    maxSpeed: 66,
    acceleration: 11,
    braking: 25,
    friction: 14,

    // ── Grip & Tire Model ──────────────────────────────────────
    // These modify how much of the geometric turn the car achieves.
    // 1.0 = full grip, car follows steering perfectly.
    // Lower values = tires saturate earlier = more understeer/slide.
    //
    // TUNING:
    //   frontGrip > rearGrip → car oversteers (rear breaks loose first)
    //   frontGrip < rearGrip → car understeers (front washes out first)
    //   Equal → neutral handling
    frontGrip: 1.0,
    rearGrip: 0.97,

    // Speed at which grip starts to reduce (km/h).
    // Below this speed: full grip, car turns perfectly.
    // Above: grip gradually reduces based on how hard the car is cornering.
    gripFadeStartKmh: 15,

    // Maximum grip reduction at top speed cornering.
    // 0.35 means at top speed + full steering, grip drops to 35%.
    // This is the primary understeer control at high speed.
    highSpeedGripFloor: 0.35,

    // How much throttle reduces rear grip (traction circle).
    // Higher = more power oversteer under throttle.
    // 0.0 = throttle has no effect on cornering, 1.0 = massive effect
    throttleGripPenalty: 0.45,

    // How much braking reduces front grip.
    brakeGripPenalty: 0.30,

    // Coast grip bonus: when coasting (no throttle/brake),
    // tires have MORE grip because all traction budget goes to cornering.
    coastGripBonus: 1.15,

    // ── Weight ─────────────────────────────────────────────────
    weightDistribution: 0.50,  // 50% front
    cgHeight: 0.5,
    mass: 1.0,                 // Gameplay mass, not kg

    // ── Handbrake ──────────────────────────────────────────────
    // How much rear grip remains with handbrake fully engaged.
    // 0.0 = zero rear grip (instant 360), 1.0 = no effect.
    handbrakeRearGrip: 0.08,
    handbrakeRampSpeed: 5.0,
    // Additional braking force from handbrake (fraction of config.braking)
    handbrakeBrakeMult: 0.7,

    // ── Lateral dynamics ───────────────────────────────────────
    // How quickly lateral (sliding) velocity decays.
    // Higher = less sliding, more planted. Lower = more drift.
    // This is the equivalent of the original's "traction" system.
    lateralGripRate: 0.05,        // Normal grip: fast lateral decay
    lateralSlideRate: 0.95,       // Handbrake: slow lateral decay = drift

    // ── Body motion ────────────────────────────────────────────
    rollStiffness: 0.012,
    rollSmoothing: 4.0,
    pitchStiffness: 0.04,
    pitchSmoothing: 5.0,

    // ── Surface ────────────────────────────────────────────────
    surfaceGripMultiplier: {
        asphalt: 1.0,
        concrete: 0.97,
        wet: 0.75,
        dirt: 0.60,
        grass: 0.45,
    },
};

export function getCarConfig(driveMode) {
    const mode = DRIVE_MODES[driveMode] || DRIVE_MODES.dynamic;
    return {
        ...CAR_CONFIG,
        maxSpeed: mode.maxSpeed,
        acceleration: mode.acceleration,
        braking: mode.braking,
        friction: mode.friction,
    };
}

export function createPhysicsState() {
    return {
        forwardSpeed: 0,
        lateralSpeed: 0,
        yawRate: 0,
        velX: 0,
        velZ: 0,
        steeringAngle: 0,
        rollAngle: 0,
        pitchAngle: 0,
        frontSlipAngle: 0,
        rearSlipAngle: 0,
        frontGrip: 1,
        rearGrip: 1,
        frontSlipRatio: 0,
        rearSlipRatio: 0,
        isOversteering: false,
        isUndersteering: false,
        weightTransfer: 0,
        loadOnFront: 0.50,
        loadOnRear: 0.50,
        currentSurface: "asphalt",
        surfaceGrip: 1.0,
        speed: 0,
        sidewaysSpeed: 0,
        handbrakeGripFactor: 0,
        currentTraction: 0.05,
        currentOversteer: 1.0,
    };
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
}

function approach(current, target, rate, dt) {
    return current + (target - current) * (1 - Math.exp(-rate * dt));
}

// ═══════════════════════════════════════════════════════════════
// Main physics update
// ═══════════════════════════════════════════════════════════════

export function updateCarPhysics({
    physics,
    config,
    group,
    delta,
    throttleInput,
    steeringInput,
    handbrakeActive,
    isBurnout,
}) {
    const dt = Math.min(delta, 0.05);
    const absForward = Math.abs(physics.forwardSpeed);
    const speedKmh = absForward * 3.6;

    // ── SURFACE ────────────────────────────────────────────────
    const surfaceMu = config.surfaceGripMultiplier[physics.currentSurface] || 1.0;
    physics.surfaceGrip = surfaceMu;

    // ── STEERING (speed-sensitive, like original) ──────────────
    const globalMaxSpeed = DRIVE_MODES.race?.maxSpeed || 66;
    const speedRatio = clamp(absForward / globalMaxSpeed, 0, 1);
    const currentMaxSteer = THREE.MathUtils.lerp(
        config.maxSteeringAngle,
        config.minSteeringAngle,
        speedRatio
    );

    const targetSteering = steeringInput * currentMaxSteer;

    if (Math.abs(steeringInput) > 0.01) {
        const steerAlpha = 1 - Math.exp(-config.steeringSpeed * 4 * dt);
        physics.steeringAngle += (targetSteering - physics.steeringAngle) * steerAlpha;
    } else {
        const returnAlpha = 1 - Math.exp(-config.steeringReturnSpeed * 4 * dt);
        physics.steeringAngle += (0 - physics.steeringAngle) * returnAlpha;
    }

    physics.steeringAngle = clamp(physics.steeringAngle, -currentMaxSteer, currentMaxSteer);

    // ── HANDBRAKE RAMP ─────────────────────────────────────────
    physics.handbrakeGripFactor = approach(
        physics.handbrakeGripFactor,
        handbrakeActive ? 1 : 0,
        config.handbrakeRampSpeed,
        dt
    );

    // ── FORWARD SPEED (simple, like original) ──────────────────
    if (isBurnout) {
        // Burnout: engine spinning but car barely moves
        physics.forwardSpeed += config.acceleration * 0.1 * dt;
    } else if (throttleInput > 0) {
        physics.forwardSpeed += config.acceleration * throttleInput * dt;
    } else if (throttleInput < 0) {
        physics.forwardSpeed += config.braking * throttleInput * dt;
    } else {
        // Friction / engine braking
        const frictionForce = config.friction * dt;
        if (Math.abs(physics.forwardSpeed) < frictionForce) {
            physics.forwardSpeed = 0;
        } else {
            physics.forwardSpeed -= Math.sign(physics.forwardSpeed) * frictionForce;
        }
    }

    // Handbrake braking
    if (handbrakeActive && absForward > 0.3) {
        physics.forwardSpeed -= Math.sign(physics.forwardSpeed)
            * config.braking * config.handbrakeBrakeMult * physics.handbrakeGripFactor * dt;
    }

    physics.forwardSpeed = clamp(physics.forwardSpeed, -config.maxSpeed * 0.4, config.maxSpeed);

    // ── WEIGHT TRANSFER ────────────────────────────────────────
    const accelNorm = throttleInput > 0
        ? throttleInput
        : throttleInput < 0 ? throttleInput * (config.braking / config.acceleration) : 0;
    const wtTarget = -accelNorm * config.cgHeight / config.wheelbase * 0.15;
    physics.weightTransfer = approach(physics.weightTransfer, wtTarget, 6, dt);

    const baseFront = config.weightDistribution;
    const loadFront = clamp(baseFront + physics.weightTransfer, 0.38, 0.62);
    const loadRear = 1.0 - loadFront;
    physics.loadOnFront = loadFront;
    physics.loadOnRear = loadRear;

    // ── GRIP COMPUTATION ───────────────────────────────────────
    // This is the KEY system that creates understeer/oversteer.
    //
    // Grip Factor = how much of the geometric turn the car can achieve.
    //   1.0 = perfect turn (low speed, neutral conditions)
    //   < 1.0 = understeer (car turns less than steering asks)
    //   > 1.0 = oversteer (car turns more, rear breaks loose)

    // Base grip reduces with speed (cornering demand grows with v²)
    const speedGripFade = speedKmh > config.gripFadeStartKmh
        ? THREE.MathUtils.lerp(1.0, config.highSpeedGripFloor,
            clamp((speedKmh - config.gripFadeStartKmh) / (globalMaxSpeed * 3.6 - config.gripFadeStartKmh), 0, 1))
        : 1.0;

    // Front grip
    let frontGripFactor = config.frontGrip * speedGripFade * surfaceMu;
    // Braking reduces front grip (friction circle)
    const brakeGripLoss = Math.max(0, -throttleInput) * config.brakeGripPenalty;
    frontGripFactor *= (1.0 - brakeGripLoss);
    // Weight on front increases front grip
    frontGripFactor *= (0.8 + 0.4 * loadFront);

    // Rear grip
    let rearGripFactor = config.rearGrip * speedGripFade * surfaceMu;
    // Throttle reduces rear grip (traction circle, PRIMARY oversteer source)
    const throttleGripLoss = Math.max(0, throttleInput) * config.throttleGripPenalty;
    rearGripFactor *= (1.0 - throttleGripLoss);
    // Weight on rear increases rear grip
    rearGripFactor *= (0.8 + 0.4 * loadRear);

    // Coasting bonus: no throttle/brake = all grip goes to cornering
    if (Math.abs(throttleInput) < 0.05 && !handbrakeActive) {
        frontGripFactor *= config.coastGripBonus;
        rearGripFactor *= config.coastGripBonus;
    }

    // Handbrake kills rear grip
    rearGripFactor *= THREE.MathUtils.lerp(1.0, config.handbrakeRearGrip, physics.handbrakeGripFactor);

    // Combined grip = weighted average (front matters more for steering, rear for stability)
    const combinedGrip = frontGripFactor * 0.6 + rearGripFactor * 0.4;

    // Store for diagnostics
    physics.frontGrip = clamp(frontGripFactor, 0, 1.5);
    physics.rearGrip = clamp(rearGripFactor, 0, 1.5);

    // ── GEOMETRIC TURNING (core from original) ─────────────────
    // This is what ACTUALLY makes the car turn.
    // Turn radius from bicycle model: R = wheelbase / tan(steerAngle)
    // Angular velocity = forwardSpeed / R = forwardSpeed × tan(steerAngle) / wheelbase

    if (Math.abs(physics.forwardSpeed) > 0.001 && Math.abs(physics.steeringAngle) > 0.001) {
        const turnRadius = config.wheelbase / Math.tan(physics.steeringAngle);
        let angularVelocity = physics.forwardSpeed / turnRadius;

        // APPLY GRIP: reduce angular velocity when tires can't keep up
        angularVelocity *= combinedGrip;

        // Oversteer boost: when rear grip is LOWER than front,
        // the rear slides out and the car rotates MORE than steering asks
        const gripDiff = frontGripFactor - rearGripFactor;
        if (gripDiff > 0.05) {
            // Rear has less grip → car over-rotates
            const oversteerBoost = 1.0 + gripDiff * 1.5;
            angularVelocity *= oversteerBoost;
        }

        physics.yawRate = angularVelocity;
    } else {
        // Decay yaw rate when not steering
        physics.yawRate *= Math.pow(0.05, dt);
    }

    // Apply yaw
    group.rotation.y += physics.yawRate * dt;

    // ── LATERAL VELOCITY (drift physics) ───────────────────────
    // Decompose world velocity into local forward/lateral
    const bodyX = Math.sin(group.rotation.y);
    const bodyZ = Math.cos(group.rotation.y);
    const rightX = Math.cos(group.rotation.y);
    const rightZ = -Math.sin(group.rotation.y);

    // Build world velocity from forward speed + existing lateral
    let localForward = physics.forwardSpeed;
    let localLateral = physics.lateralSpeed || 0;

    // Traction system: how quickly lateral speed decays
    // High traction = lateral dies fast = planted cornering
    // Low traction = lateral persists = drift/slide
    const targetTraction = handbrakeActive
        ? config.lateralSlideRate
        : config.lateralGripRate;

    physics.currentTraction = approach(
        physics.currentTraction,
        targetTraction,
        handbrakeActive ? 5.0 : 0.8,
        dt
    );

    // Apply lateral decay
    localLateral *= Math.pow(physics.currentTraction, dt * 60);

    // Cornering generates some lateral velocity naturally
    if (Math.abs(physics.yawRate) > 0.01) {
        // Centripetal effect: turning creates sideways velocity
        const lateralGeneration = physics.yawRate * absForward * 0.02;
        localLateral += lateralGeneration * dt;
    }

    physics.lateralSpeed = localLateral;

    // ── WORLD VELOCITY ─────────────────────────────────────────
    physics.velX = bodyX * localForward + rightX * localLateral;
    physics.velZ = bodyZ * localForward + rightZ * localLateral;

    // NOTE: Position is applied by CarModel.jsx (lines 434-436) which
    // also handles collision detection. Do NOT apply position here.

    // ── SLIP ANGLES (for diagnostics/visuals) ──────────────────
    if (absForward > 0.5) {
        const vLatFront = localLateral + physics.yawRate * config.wheelbase * 0.5;
        const vLatRear = localLateral - physics.yawRate * config.wheelbase * 0.5;
        physics.frontSlipAngle = Math.atan2(vLatFront, absForward) - physics.steeringAngle;
        physics.rearSlipAngle = Math.atan2(vLatRear, absForward);
    } else {
        physics.frontSlipAngle *= 0.9;
        physics.rearSlipAngle *= 0.9;
    }

    const absFrontSlip = Math.abs(physics.frontSlipAngle);
    const absRearSlip = Math.abs(physics.rearSlipAngle);
    physics.frontSlipRatio = clamp(absFrontSlip / 0.3, 0, 1);
    physics.rearSlipRatio = clamp(absRearSlip / 0.3, 0, 1);

    // ── UNDERSTEER / OVERSTEER DETECTION ───────────────────────
    physics.isUndersteering =
        frontGripFactor < 0.75 &&
        Math.abs(steeringInput) > 0.3 &&
        absForward > 5;

    physics.isOversteering =
        (rearGripFactor < frontGripFactor * 0.85 && absForward > 3) ||
        (handbrakeActive && absForward > 2);

    // ── BODY ROLL ──────────────────────────────────────────────
    const lateralG = physics.yawRate * absForward;
    const speedRollScale = clamp((speedKmh - 8) / 50, 0, 1);
    const powerRollMult = Math.abs(throttleInput) > 0.05 ? 1.0 : 0.5;
    const maxRollRad = THREE.MathUtils.degToRad(3.5);
    const targetRoll = clamp(
        lateralG * config.rollStiffness * speedRollScale * powerRollMult,
        -maxRollRad,
        maxRollRad
    );
    physics.rollAngle = approach(physics.rollAngle, targetRoll, config.rollSmoothing, dt);
    if (Math.abs(physics.rollAngle) < 0.001 && Math.abs(targetRoll) < 0.001) {
        physics.rollAngle = 0;
    }

    // ── BODY PITCH ─────────────────────────────────────────────
    const pitchForce = throttleInput > 0
        ? -config.acceleration * throttleInput
        : throttleInput < 0 ? -config.braking * throttleInput : 0;

    const targetPitch = clamp(
        pitchForce * config.pitchStiffness * 0.01,
        -THREE.MathUtils.degToRad(2),
        THREE.MathUtils.degToRad(2)
    );
    physics.pitchAngle = approach(physics.pitchAngle, targetPitch, config.pitchSmoothing, dt);
    if (Math.abs(physics.pitchAngle) < 0.001 && Math.abs(targetPitch) < 0.001) {
        physics.pitchAngle = 0;
    }

    // ── CLEAN STOP ─────────────────────────────────────────────
    if (Math.abs(physics.forwardSpeed) < 0.15 && Math.abs(throttleInput) < 0.01) {
        physics.forwardSpeed = 0;
        physics.lateralSpeed *= 0.85;
        physics.yawRate *= 0.85;
    }

    // ── ALIASES ────────────────────────────────────────────────
    physics.speed = physics.forwardSpeed;
    physics.sidewaysSpeed = physics.lateralSpeed;

    return {
        forwardSpeed: physics.forwardSpeed,
        lateralSpeed: physics.lateralSpeed,
        slipAngle: physics.rearSlipAngle,
        slipRatio: absForward > 1 ? Math.abs(physics.lateralSpeed) / absForward : 0,
        isOversteer: physics.isOversteering,
        isUndersteer: physics.isUndersteering,
    };
}

export function exportCarState({
    physics,
    group,
    handbrakeActive,
    isBurnout,
    slipAngle,
}) {
    return {
        x: group.position.x,
        y: group.position.y,
        z: group.position.z,
        rotation: group.rotation.y,
        speed: physics.forwardSpeed,
        sidewaysSpeed: physics.lateralSpeed,
        yawRate: physics.yawRate,
        isDrifting:
            (physics.isOversteering || handbrakeActive) &&
            (Math.abs(physics.lateralSpeed) > 1.0 ||
                Math.abs(physics.yawRate) > 0.4 ||
                handbrakeActive) &&
            Math.abs(physics.forwardSpeed) > 2.5,
        isBurnout,
        isOversteering: physics.isOversteering,
        isUndersteering: physics.isUndersteering,
        bodyRoll: physics.rollAngle,
        bodyPitch: physics.pitchAngle,
        weightTransfer: physics.weightTransfer,
        loadOnFront: physics.loadOnFront,
        loadOnRear: physics.loadOnRear,
        frontGrip: physics.frontGrip,
        rearGrip: physics.rearGrip,
        frontSlipRatio: physics.frontSlipRatio,
        rearSlipRatio: physics.rearSlipRatio,
        slipAngle: slipAngle || physics.rearSlipAngle || 0,
        currentSurface: physics.currentSurface,
    };
}