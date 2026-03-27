import * as THREE from 'three'

// ─── DNA drive mode profiles ──────────────────────────────────
export const DRIVE_MODES = {
    efficient: {
        maxSpeed: 66,
        acceleration: 5.5,
        braking: 16,
        engineBraking: 2.5,
        label: 'All Weather',
    },
    natural: {
        maxSpeed: 66,
        acceleration: 8.5,
        braking: 20,
        engineBraking: 3.5,
        label: 'Natural',
    },
    dynamic: {
        maxSpeed: 66,
        acceleration: 12,
        braking: 24,
        engineBraking: 4.5,
        label: 'Dynamic',
    },
    race: {
        maxSpeed: 66,
        acceleration: 15,
        braking: 28,
        engineBraking: 5.5,
        label: 'Race',
    },
}

export const CAR_CONFIG = {
    // Dimensions
    wheelbase: 6.0,
    trackWidth: 1.65,

    // Steering
    maxSteeringAngle: Math.PI / 4.4,
    minSteeringAngle: Math.PI / 28,
    steeringSpeed: 1.35,
    steeringReturnSpeed: 2.2,
    steeringHalfSpeed: 70,

    // Powertrain defaults (overridden by drive mode)
    maxSpeed: 66,
    acceleration: 12,
    braking: 24,
    engineBraking: 4.5,

    // Tire model
    frontGripMu: 1.12,
    rearGripMu: 1.18,
    peakSlipAngle: 0.39,
    slipFalloff: 0.5,

    // Weight
    weightDistribution: 0.5,
    cgHeight: 0.34,
    mass: 1520,

    // Aero
    dragCoefficient: 0.0004,
    downforceCoefficient: 0.00016,

    // Body roll
    rollStiffness: 0.02,
    rollSmoothing: 0.85,

    // Body pitch
    pitchStiffness: 0.03,
    pitchSmoothing: 5.0,

    // Handbrake
    handbrakeRearGripMultiplier: 0.98,

    // Surface
    surfaceGripMultiplier: {
        asphalt: 1.0,
        concrete: 0.97,
        wet: 0.76,
        dirt: 0.6,
        grass: 0.45,
    },

    // ── Geometric correction tuning ───────────────────────────
    // Max angular acceleration (rad/s²) the correction can produce.
    // This is THE key limit that prevents snap. Lower = more gentle
    // entry into turns, higher = sharper initial bite.
    geometricMaxYawAccel: 1.8,

    // Spring stiffness pulling yaw rate toward geometric target.
    // Multiplied by yaw error to get desired accel (before clamping).
    geometricSpringRate: 4.0,

    // Lateral damping in grip regime. Keeps car tracking its nose.
    // Higher = cleaner turns, lower = more float/drift tendency.
    gripLateralDamping: 7.0,

    // Dynamic wheelbase floor (fraction of full wheelbase at zero speed)
    minWheelbaseFraction: 0.35,
}

export function getCarConfig(driveMode) {
    const mode = DRIVE_MODES[driveMode] || DRIVE_MODES.dynamic
    return {
        ...CAR_CONFIG,
        maxSpeed: mode.maxSpeed,
        acceleration: mode.acceleration,
        braking: mode.braking,
        engineBraking: mode.engineBraking,
    }
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
        loadOnFront: 0.5,
        loadOnRear: 0.5,

        currentSurface: 'asphalt',
        surfaceGrip: 1.0,

        speed: 0,
        sidewaysSpeed: 0,
    }
}

// ─── Helpers ──────────────────────────────────────────────────
function tireForce(absSlip, mu, peakSlip) {
    const x = absSlip / peakSlip
    return mu * (x / (1 + Math.abs(x)))
}

/**
 * Attempt to smoothly fade from 0→1 between edge0 and edge1.
 * IMPORTANT: returns 0 when x < edge0, 1 when x > edge1.
 */
function smoothstep(x, edge0, edge1) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
}

// ─── Main physics update ──────────────────────────────────────
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
    const dt = Math.min(delta, 0.05)
    const mass = config.mass || 1520

    // ── STEERING (progressive with speed) ─────────────────────
    const speedKmh = Math.abs(physics.forwardSpeed) * 3.6
    const topSpeedKmh = config.maxSpeed * 3.6
    const linearScale = Math.min(1, speedKmh / topSpeedKmh)
    const steerFactor = 1.0 - linearScale * 0.55

    const currentMaxSteer = THREE.MathUtils.lerp(
        config.minSteeringAngle,
        config.maxSteeringAngle * 1.2,
        steerFactor
    )
    const targetSteering = steeringInput * currentMaxSteer

    const steerProgress =
        Math.abs(physics.steeringAngle) / (currentMaxSteer || 0.001)
    const steeringResistance = THREE.MathUtils.lerp(
        1.0,
        0.15,
        Math.pow(steerProgress, 2.0)
    )

    if (Math.abs(steeringInput) > 0.01) {
        physics.steeringAngle +=
            (targetSteering - physics.steeringAngle) *
            Math.min(1, config.steeringSpeed * dt * 4 * steeringResistance)
    } else {
        physics.steeringAngle +=
            (0 - physics.steeringAngle) *
            Math.min(1, config.steeringReturnSpeed * dt * 4)
    }
    physics.steeringAngle = THREE.MathUtils.clamp(
        physics.steeringAngle,
        -currentMaxSteer,
        currentMaxSteer
    )

    // ── SURFACE ───────────────────────────────────────────────
    const surfaceMu =
        config.surfaceGripMultiplier[physics.currentSurface] || 1.0
    physics.surfaceGrip = surfaceMu

    // ── WEIGHT TRANSFER ───────────────────────────────────────
    const longitudinalAccel =
        throttleInput > 0
            ? config.acceleration * throttleInput
            : throttleInput < 0
                ? config.braking * throttleInput
                : 0
    const weightTransferLong =
        (longitudinalAccel * config.cgHeight) / config.wheelbase
    physics.weightTransfer = THREE.MathUtils.lerp(
        physics.weightTransfer,
        weightTransferLong * 0.015,
        Math.min(1, 2 * dt)
    )

    const baseFront = config.weightDistribution
    const frontLoad = THREE.MathUtils.clamp(
        baseFront + physics.weightTransfer,
        0.25,
        0.45
    )
    const rearLoad = 1.0 - frontLoad
    physics.loadOnFront = frontLoad
    physics.loadOnRear = rearLoad

    // ── SLIP ANGLES ───────────────────────────────────────────
    const absForward = Math.abs(physics.forwardSpeed)

    const minWBFrac = config.minWheelbaseFraction ?? 0.35
    const dynamicWheelbase = THREE.MathUtils.lerp(
        config.wheelbase * minWBFrac,
        config.wheelbase,
        linearScale
    )
    const halfWB = dynamicWheelbase * 0.5

    const vLatFront = physics.lateralSpeed + physics.yawRate * halfWB
    const vLatRear = physics.lateralSpeed - physics.yawRate * halfWB

    let targetFrontSlip = 0
    let targetRearSlip = 0

    if (absForward > 0.1) {
        targetFrontSlip =
            Math.atan2(vLatFront, absForward) -
            physics.steeringAngle * Math.sign(physics.forwardSpeed)
        targetRearSlip = Math.atan2(vLatRear, absForward)
    }

    const slipRelaxationAlpha = 1 - Math.exp(-8 * dt)
    physics.frontSlipAngle +=
        (targetFrontSlip - physics.frontSlipAngle) * slipRelaxationAlpha
    physics.rearSlipAngle +=
        (targetRearSlip - physics.rearSlipAngle) * slipRelaxationAlpha

    const frontSlipAngle = physics.frontSlipAngle
    const rearSlipAngle = physics.rearSlipAngle

    // ── TRACTION CIRCLE & TIRE FORCES ─────────────────────────
    const accelUsage = Math.max(0, throttleInput)
    const brakeUsage = Math.max(0, -throttleInput)
    const frontLongUsage = brakeUsage
    const rearLongUsage = Math.max(accelUsage, brakeUsage)
    const maxUsage = 0.95
    const frontLatAvailable = Math.sqrt(
        Math.max(0, 1.0 - Math.pow(frontLongUsage * maxUsage, 2))
    )
    const rearLatAvailable = Math.sqrt(
        Math.max(0, 1.0 - Math.pow(rearLongUsage * maxUsage, 2))
    )

    const frontMu =
        config.frontGripMu *
        surfaceMu *
        (0.9 + (0.6 * frontLoad) / baseFront) *
        frontLatAvailable

    let rearMu =
        config.rearGripMu *
        surfaceMu *
        (0.4 + (0.8 * rearLoad) / (1 - baseFront)) *
        rearLatAvailable

    if (handbrakeActive) {
        rearMu *= config.handbrakeRearGripMultiplier
    }

    const downforce =
        config.downforceCoefficient *
        physics.forwardSpeed *
        physics.forwardSpeed

    const absFrontSlip = Math.abs(frontSlipAngle)
    const absRearSlip = Math.abs(rearSlipAngle)
    const speedSlipScale = THREE.MathUtils.lerp(1.0, 0.6, speedKmh / 200)
    const effectivePeakSlip = config.peakSlipAngle * speedSlipScale

    const frontForceCoeff = tireForce(
        absFrontSlip,
        frontMu + downforce,
        effectivePeakSlip
    )
    const rearForceCoeff = tireForce(
        absRearSlip,
        rearMu + downforce,
        effectivePeakSlip
    )

    const gravity = 16.81
    const frontLatForce =
        -Math.sign(frontSlipAngle) *
        frontForceCoeff *
        frontLoad *
        gravity *
        mass
    const rearLatForce =
        -Math.sign(rearSlipAngle) *
        rearForceCoeff *
        rearLoad *
        gravity *
        mass

    // Grip diagnostics
    physics.frontGrip = THREE.MathUtils.clamp(
        1.0 - absFrontSlip / (effectivePeakSlip * 3),
        0,
        1
    )
    physics.rearGrip = THREE.MathUtils.clamp(
        1.0 - absRearSlip / (effectivePeakSlip * 3),
        0,
        1
    )
    physics.frontSlipRatio = 1 - physics.frontGrip
    physics.rearSlipRatio = 1 - physics.rearGrip

    // ── OVERSTEER / UNDERSTEER ────────────────────────────────
    physics.isUndersteering =
        absFrontSlip > effectivePeakSlip * 2.5 &&
        Math.abs(steeringInput) > 0.3 &&
        absForward > 10 &&
        throttleInput > 0.5

    physics.isOversteering =
        (absRearSlip > absFrontSlip * 1.05 &&
            absRearSlip > effectivePeakSlip * 0.6 &&
            absForward > 1.5) ||
        handbrakeActive

    // ── LONGITUDINAL FORCES ───────────────────────────────────
    let FxFront = 0
    let FxRear = 0

    const maxEngineForce = config.acceleration * mass
    const maxBrakeForce = config.braking * mass

    if (isBurnout) {
        FxRear = maxEngineForce * 0.4
    } else if (throttleInput > 0) {
        FxRear = maxEngineForce * throttleInput
    } else if (throttleInput < 0) {
        if (physics.forwardSpeed > 1.0) {
            FxFront = -maxBrakeForce * 0.7 * Math.abs(throttleInput)
            FxRear = -maxBrakeForce * 0.3 * Math.abs(throttleInput)
        } else {
            FxRear = maxEngineForce * throttleInput * 0.5
        }
    } else {
        FxRear =
            -Math.sign(physics.forwardSpeed) * config.engineBraking * mass
    }

    // Aero drag
    const dragForce =
        0.5 *
        1.225 *
        config.dragCoefficient *
        2.0 *
        physics.forwardSpeed *
        physics.forwardSpeed
    FxFront -= Math.sign(physics.forwardSpeed) * dragForce * 0.5
    FxRear -= Math.sign(physics.forwardSpeed) * dragForce * 0.5

    if (handbrakeActive && absForward > 0.1) {
        FxRear =
            -Math.sign(physics.forwardSpeed) * config.braking * mass * 1.5
    }

    // ── LOCAL DYNAMICS INTEGRATION ────────────────────────────
    const cosSteer = Math.cos(physics.steeringAngle)
    const sinSteer = Math.sin(physics.steeringAngle)

    const FxFrontWorld =
        FxFront * cosSteer - frontLatForce * sinSteer * 0.15
    const FyFrontWorld =
        FxFront * sinSteer * 0.15 + frontLatForce * cosSteer

    const FxTotal = FxFrontWorld + FxRear
    const FyTotal = FyFrontWorld + rearLatForce

    const ax = FxTotal / mass + physics.lateralSpeed * physics.yawRate
    const ay = FyTotal / mass - physics.forwardSpeed * physics.yawRate

    const aDist = dynamicWheelbase * config.weightDistribution
    const bDist = dynamicWheelbase * (1 - config.weightDistribution)
    const Iz = mass * (aDist * aDist + bDist * bDist)
    const yawAcc = (aDist * FyFrontWorld - bDist * rearLatForce) / Iz

    physics.forwardSpeed += ax * dt
    physics.lateralSpeed += ay * dt
    physics.yawRate += yawAcc * dt

    // ══════════════════════════════════════════════════════════
    // ── GEOMETRIC GRIP CORRECTION (rate-limited) ──────────────
    // ══════════════════════════════════════════════════════════
    //
    // Instead of slamming yaw rate to the geometric target, we
    // compute a desired angular ACCELERATION and hard-clamp it.
    // This ensures the first frame of turning is never violent,
    // while sustained steering eventually reaches the geometric
    // yaw rate over multiple frames.
    //
    // The clamp value is speed-dependent: softer at high speed
    // (stability), slightly firmer at medium speed (responsiveness).
    //
    // ══════════════════════════════════════════════════════════

    // 1. Geometric target — use FULL wheelbase, not dynamic.
    //    Dynamic wheelbase is an arcade hack for tire model;
    //    the geometric radius should reflect actual car dimensions.
    const geometricYawRate =
        absForward > 0.3
            ? (physics.forwardSpeed * Math.tan(physics.steeringAngle)) /
            config.wheelbase
            : 0

    // 2. Tire saturation metric: how close to (or past) the limit?
    //    0.0 = no slip, 1.0 = at peak, >1.0 = past peak (sliding)
    const frontSaturation = absFrontSlip / (effectivePeakSlip || 0.01)
    const rearSaturation = absRearSlip / (effectivePeakSlip || 0.01)
    const maxSaturation = Math.max(frontSaturation, rearSaturation)

    // 3. Grip blend: 1 when tires are comfortably within grip
    //    envelope, fading to 0 as they approach/exceed the peak.
    //    Wide transition (0.4 → 1.3) so it's never a switch.
    const gripFactor = 1.0 - smoothstep(maxSaturation, 0.4, 1.3)

    // 4. Speed authority: correction fades in from ~5 km/h (avoid
    //    twitching at standstill) and gently reduces above 120 km/h
    //    (at very high speed, tires should govern behavior).
    const speedFadeIn = smoothstep(speedKmh, 10, 50)
    const speedFadeOut = 1.0 - smoothstep(speedKmh, 70, 120) * 0.5
    const speedAuthority = speedFadeIn * speedFadeOut

    // 5. Suppress during deliberate slides
    let correctionAllowed = 1.0
    if (handbrakeActive) {
        correctionAllowed = 0.0
    } else if (
        throttleInput > 0.6 &&
        absRearSlip > effectivePeakSlip * 0.5
    ) {
        // Smoothly back off as power oversteer develops
        correctionAllowed *=
            1.0 -
            smoothstep(
                absRearSlip,
                effectivePeakSlip * 0.5,
                effectivePeakSlip * 1.5
            )
    }

    // 6. Combined blend
    const geometricBlend = gripFactor * correctionAllowed * speedAuthority

    // 7. Compute correction as angular acceleration
    const yawError = geometricYawRate - physics.yawRate
    const springRate = config.geometricSpringRate ?? 4.0
    const desiredCorrAccel = yawError * springRate

    // 8. Hard clamp — THIS prevents the keyboard snap.
    //    At low speed / standstill the clamp is generous (tighter
    //    parking turns), at high speed it's reduced (stability).
    const baseMaxAccel = config.geometricMaxYawAccel ?? 1.8
    const maxCorrAccel = THREE.MathUtils.lerp(
        baseMaxAccel * 1.2,
        baseMaxAccel * 0.5,
        linearScale
    )
    const clampedCorrAccel = THREE.MathUtils.clamp(
        desiredCorrAccel,
        -maxCorrAccel,
        maxCorrAccel
    )

    // 9. Apply
    physics.yawRate += clampedCorrAccel * geometricBlend * dt

    // ══════════════════════════════════════════════════════════
    // ── ADAPTIVE LATERAL DAMPING ──────────────────────────────
    // ══════════════════════════════════════════════════════════
    //
    // Grip regime:  moderate damping — car tracks its heading,
    //               lateral velocity is killed so slip angles
    //               stay low → stable feedback loop.
    // Slide regime: light damping — lateral speed builds up,
    //               drift angle develops naturally.
    //
    // Speed scaling prevents excessive damping at near-standstill
    // (where lateral speed is meaningless anyway).
    //
    // ══════════════════════════════════════════════════════════
    const gripDamp = config.gripLateralDamping ?? 5.0
    const slideDamp = 0.5
    const effectiveLateralDamp = THREE.MathUtils.lerp(
        gripDamp,
        slideDamp,
        smoothstep(maxSaturation, 0.3, 1.0)
    )
    const lateralDampSpeedScale = smoothstep(absForward, 0.5, 5.0)
    physics.lateralSpeed *= Math.max(
        0,
        1 - effectiveLateralDamp * lateralDampSpeedScale * dt
    )

    // ── ADAPTIVE YAW DAMPING ──────────────────────────────────
    // In grip regime: light damping (geometric correction provides
    //   stability, heavy damping would fight it).
    // In oversteer+throttle: light (let drift develop).
    // In slide without control: firm (prevent spin).
    let yawDamp
    if (physics.isOversteering && throttleInput > 0) {
        yawDamp = 0.4
    } else if (geometricBlend > 0.5) {
        yawDamp = 0.4
    } else {
        yawDamp = 1.2
    }
    physics.yawRate *= Math.max(0, 1 - yawDamp * dt)

    physics.forwardSpeed = THREE.MathUtils.clamp(
        physics.forwardSpeed,
        -config.maxSpeed * 0.35,
        config.maxSpeed
    )

    // Clean stop
    if (absForward < 0.15 && Math.abs(throttleInput) < 0.01) {
        physics.forwardSpeed = 0
        physics.lateralSpeed *= 0.85
        physics.yawRate *= 0.85
    }

    // ── APPLY YAW ─────────────────────────────────────────────
    group.rotation.y += physics.yawRate * dt

    // ── WORLD VELOCITY ────────────────────────────────────────
    const sinY = Math.sin(group.rotation.y)
    const cosY = Math.cos(group.rotation.y)

    physics.velX =
        sinY * physics.forwardSpeed + cosY * physics.lateralSpeed
    physics.velZ =
        cosY * physics.forwardSpeed - sinY * physics.lateralSpeed

    // ── BODY ROLL ─────────────────────────────────────────────
    const actualLateralG = physics.forwardSpeed * physics.yawRate
    const steeringAnticipation =
        physics.steeringAngle * absForward * 0.15
    const combinedLateralG =
        actualLateralG * 0.3 + steeringAnticipation * 0.3

    const speedRollScale = THREE.MathUtils.clamp(
        (speedKmh - 10) / 40,
        0,
        1
    )
    const powerRollMultiplier =
        Math.abs(throttleInput) > 0.05 ? 1.0 : 0.4

    const maxRollRad = THREE.MathUtils.degToRad(3.5)
    const targetRoll = THREE.MathUtils.clamp(
        combinedLateralG *
        config.rollStiffness *
        speedRollScale *
        powerRollMultiplier,
        -maxRollRad,
        maxRollRad
    )

    const effectiveTarget = Math.abs(targetRoll) < 0.003 ? 0 : targetRoll

    const isRecovering =
        Math.abs(effectiveTarget) < 0.005 || Math.abs(steeringInput) < 0.05
    const activeRollSmoothing = isRecovering
        ? 8.0
        : config.rollSmoothing * 2.5
    const rollAlpha = 1 - Math.exp(-activeRollSmoothing * dt)
    physics.rollAngle +=
        (effectiveTarget - physics.rollAngle) * rollAlpha

    if (
        Math.abs(physics.rollAngle) < 0.001 &&
        Math.abs(effectiveTarget) < 0.001
    ) {
        physics.rollAngle = 0
    }

    // ── BODY PITCH ────────────────────────────────────────────
    const targetPitch = THREE.MathUtils.clamp(
        -FxTotal * config.pitchStiffness * 0.01,
        -THREE.MathUtils.degToRad(2),
        THREE.MathUtils.degToRad(2)
    )
    const pitchAlpha = 1 - Math.exp(-config.pitchSmoothing * dt)
    physics.pitchAngle += (targetPitch - physics.pitchAngle) * pitchAlpha
    if (
        Math.abs(physics.pitchAngle) < 0.001 &&
        Math.abs(targetPitch) < 0.001
    ) {
        physics.pitchAngle = 0
    }

    // ── ALIASES ───────────────────────────────────────────────
    physics.speed = physics.forwardSpeed
    physics.sidewaysSpeed = physics.lateralSpeed

    return {
        forwardSpeed: physics.forwardSpeed,
        lateralSpeed: physics.lateralSpeed,
        slipAngle: rearSlipAngle,
        slipRatio:
            absForward > 1 ? Math.abs(physics.lateralSpeed) / absForward : 0,
        isOversteer: physics.isOversteering,
        isUndersteer: physics.isUndersteering,
        geometricBlend,
        tireSaturation: maxSaturation,
    }
}

export function exportCarState({
    physics,
    group,
    handbrakeActive,
    isBurnout,
    config,
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
    }
}