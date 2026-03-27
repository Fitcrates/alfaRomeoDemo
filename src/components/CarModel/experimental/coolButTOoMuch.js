import * as THREE from "three";

// DNA drive mode profiles
export const DRIVE_MODES = {
    efficient: {
        maxSpeed: 66,
        acceleration: 8,
        braking: 18,
        engineBraking: 3,
        label: "All Weather",
    },
    natural: {
        maxSpeed: 66,
        acceleration: 12,
        braking: 22,
        engineBraking: 4,
        label: "Natural",
    },
    dynamic: {
        maxSpeed: 66,
        acceleration: 16,
        braking: 26,
        engineBraking: 5,
        label: "Dynamic",
    },
    race: {
        maxSpeed: 66,
        acceleration: 22,
        braking: 32,
        engineBraking: 6,
        label: "Race",
    },
};

export const CAR_CONFIG = {
    // Dimensions
    wheelbase: 5.7,
    trackWidth: 1.6,

    // Steering
    // At 0 km/h the car gets full maxSteeringAngle (very tight)
    // At speed it fades toward minSteeringAngle
    maxSteeringAngle: Math.PI / 4.5,
    minSteeringAngle: Math.PI / 20,
    steeringSpeed: 1.5,
    steeringReturnSpeed: 2.0,
    // Speed at which steering is halfway between max and min (km/h)
    steeringHalfSpeed: 45,

    // Powertrain defaults (overridden by drive mode)
    maxSpeed: 66,
    acceleration: 16,
    braking: 26,
    engineBraking: 5,

    // Tire model
    frontGripMu: 1.05,
    rearGripMu: 1.0,
    peakSlipAngle: 0.13,
    slipFalloff: 0.5,

    // Weight
    weightDistribution: 0.48,
    cgHeight: 0.45,
    mass: 1520,

    // Aero
    dragCoefficient: 0.0003,
    downforceCoefficient: 0.0001,

    // Body roll
    rollStiffness: 0.01,
    rollSmoothing: 0.8,

    // Body pitch
    pitchStiffness: 0.04,
    pitchSmoothing: 5.0,

    // Handbrake
    handbrakeRearGripMultiplier: 0.15,

    // Surface
    surfaceGripMultiplier: {
        asphalt: 1.0,
        concrete: 0.95,
        wet: 0.72,
        dirt: 0.55,
        grass: 0.4,
    },
};

export function getCarConfig(driveMode) {
    const mode = DRIVE_MODES[driveMode] || DRIVE_MODES.dynamic;
    return {
        ...CAR_CONFIG,
        maxSpeed: mode.maxSpeed,
        acceleration: mode.acceleration,
        braking: mode.braking,
        engineBraking: mode.engineBraking,
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
        loadOnFront: 0.48,
        loadOnRear: 0.52,

        currentSurface: "asphalt",
        surfaceGrip: 1.0,

        speed: 0,
        sidewaysSpeed: 0,
    };
}

// ─── Tire curve ───────────────────────────────────────────────
function tireForce(absSlip, mu, peakSlip, falloff) {
    if (absSlip < peakSlip) {
        return mu * (absSlip / peakSlip);
    }
    const overSlip = absSlip - peakSlip;
    return Math.max(mu * 0.25, mu - mu * falloff * overSlip);
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
    const dt = Math.min(delta, 0.05);

    // ── STEERING (progressive with speed) ─────────────────────
    const speedKmh = Math.abs(physics.forwardSpeed) * 3.6;
    // Smooth falloff: at 0 km/h → 1.0, at steeringHalfSpeed → 0.5
    const steerFactor =
        1.0 / (1.0 + speedKmh / config.steeringHalfSpeed);
    const currentMaxSteer = THREE.MathUtils.lerp(
        config.minSteeringAngle,
        config.maxSteeringAngle,
        steerFactor
    );
    const targetSteering = steeringInput * currentMaxSteer;

    if (Math.abs(steeringInput) > 0.01) {
        physics.steeringAngle +=
            (targetSteering - physics.steeringAngle) *
            Math.min(1, config.steeringSpeed * dt * 4);
    } else {
        physics.steeringAngle +=
            (0 - physics.steeringAngle) *
            Math.min(1, config.steeringReturnSpeed * dt * 4);
    }
    physics.steeringAngle = THREE.MathUtils.clamp(
        physics.steeringAngle,
        -currentMaxSteer,
        currentMaxSteer
    );

    // ── SURFACE ───────────────────────────────────────────────
    const surfaceMu =
        config.surfaceGripMultiplier[physics.currentSurface] || 1.0;
    physics.surfaceGrip = surfaceMu;

    // ── WEIGHT TRANSFER ───────────────────────────────────────
    const longitudinalAccel =
        throttleInput > 0
            ? config.acceleration * throttleInput
            : throttleInput < 0
                ? config.braking * throttleInput
                : 0;
    const weightTransferLong =
        (longitudinalAccel * config.cgHeight) / config.wheelbase;
    physics.weightTransfer = THREE.MathUtils.lerp(
        physics.weightTransfer,
        weightTransferLong * 0.015,
        Math.min(1, 6 * dt)
    );

    const baseFront = config.weightDistribution;
    const frontLoad = THREE.MathUtils.clamp(
        baseFront + physics.weightTransfer,
        0.25,
        0.75
    );
    const rearLoad = 1.0 - frontLoad;
    physics.loadOnFront = frontLoad;
    physics.loadOnRear = rearLoad;

    // ── SLIP ANGLES ───────────────────────────────────────────
    const absForward = Math.abs(physics.forwardSpeed);
    const halfWB = config.wheelbase * 0.5;

    const vLatFront = physics.lateralSpeed + physics.yawRate * halfWB;
    const vLatRear = physics.lateralSpeed - physics.yawRate * halfWB;

    let frontSlipAngle = 0;
    let rearSlipAngle = 0;

    // Lower threshold so slip builds even at low speed turns
    if (absForward > 0.3) {
        frontSlipAngle =
            Math.atan2(vLatFront, absForward) -
            physics.steeringAngle * Math.sign(physics.forwardSpeed);
        rearSlipAngle = Math.atan2(vLatRear, absForward);
    }

    physics.frontSlipAngle = frontSlipAngle;
    physics.rearSlipAngle = rearSlipAngle;

    // ── TIRE FORCES ───────────────────────────────────────────
    const frontMu =
        config.frontGripMu *
        surfaceMu *
        (0.7 + (0.3 * frontLoad) / baseFront);
    let rearMu =
        config.rearGripMu *
        surfaceMu *
        (0.7 + (0.3 * rearLoad) / (1 - baseFront));

    if (handbrakeActive) {
        rearMu *= config.handbrakeRearGripMultiplier;
    }

    const downforce =
        config.downforceCoefficient *
        physics.forwardSpeed *
        physics.forwardSpeed;

    const absFrontSlip = Math.abs(frontSlipAngle);
    const absRearSlip = Math.abs(rearSlipAngle);

    // Scale peakSlipAngle with speed — at high speed the reduced
    // steering angle means less slip is generated, so the tire
    // saturates at a smaller angle to preserve slide behaviour
    const speedSlipScale = THREE.MathUtils.lerp(1.0, 0.6, speedKmh / 200);
    const effectivePeakSlip = config.peakSlipAngle * speedSlipScale;

    const frontForceCoeff = tireForce(
        absFrontSlip,
        frontMu + downforce,
        effectivePeakSlip,
        config.slipFalloff
    );
    const rearForceCoeff = tireForce(
        absRearSlip,
        rearMu + downforce,
        effectivePeakSlip,
        config.slipFalloff
    );

    const gravity = 9.81;
    const frontLatForce =
        -Math.sign(frontSlipAngle) * frontForceCoeff * frontLoad * gravity;
    const rearLatForce =
        -Math.sign(rearSlipAngle) * rearForceCoeff * rearLoad * gravity;

    // Grip diagnostics
    physics.frontGrip = THREE.MathUtils.clamp(
        1.0 - absFrontSlip / (effectivePeakSlip * 3),
        0,
        1
    );
    physics.rearGrip = THREE.MathUtils.clamp(
        1.0 - absRearSlip / (effectivePeakSlip * 3),
        0,
        1
    );
    physics.frontSlipRatio = 1 - physics.frontGrip;
    physics.rearSlipRatio = 1 - physics.rearGrip;

    // ── OVERSTEER / UNDERSTEER ────────────────────────────────
    physics.isUndersteering =
        absFrontSlip > effectivePeakSlip * 1.5 &&
        Math.abs(steeringInput) > 0.3 &&
        absForward > 5;

    physics.isOversteering =
        absRearSlip > absFrontSlip * 1.3 &&
        absRearSlip > effectivePeakSlip &&
        absForward > 3;

    // ── LONGITUDINAL FORCES ───────────────────────────────────
    let longForce = 0;

    if (isBurnout) {
        longForce = config.acceleration * 0.15;
    } else if (throttleInput > 0) {
        longForce = config.acceleration * throttleInput;
    } else if (throttleInput < 0) {
        if (physics.forwardSpeed > 0.5) {
            longForce = -config.braking * Math.abs(throttleInput);
        } else {
            longForce = config.acceleration * throttleInput * 0.4;
        }
    } else {
        if (absForward > 0.3) {
            longForce =
                -Math.sign(physics.forwardSpeed) * config.engineBraking;
        } else {
            physics.forwardSpeed *= 0.9;
        }
    }

    // Aero drag
    longForce -=
        config.dragCoefficient *
        physics.forwardSpeed *
        Math.abs(physics.forwardSpeed);

    // ── INTEGRATE ─────────────────────────────────────────────
    physics.forwardSpeed += longForce * dt;
    physics.forwardSpeed = THREE.MathUtils.clamp(
        physics.forwardSpeed,
        -config.maxSpeed * 0.35,
        config.maxSpeed
    );

    // Lateral from tires
    const totalLatForce = frontLatForce + rearLatForce;
    physics.lateralSpeed += totalLatForce * dt;

    // Yaw moment
    const yawMoment =
        (frontLatForce * halfWB - rearLatForce * halfWB) /
        (config.wheelbase * 0.8);
    physics.yawRate += yawMoment * dt;

    // Yaw damping
    physics.yawRate *= Math.max(0, 1 - 0.8 * dt);

    // Lateral damping
    const latDamp = handbrakeActive ? 1.5 : 5.0;
    physics.lateralSpeed *= Math.max(0, 1 - latDamp * dt);

    // Clean stop
    if (absForward < 0.15 && Math.abs(throttleInput) < 0.01) {
        physics.forwardSpeed = 0;
        physics.lateralSpeed *= 0.85;
        physics.yawRate *= 0.85;
    }

    // ── APPLY YAW ─────────────────────────────────────────────
    group.rotation.y += physics.yawRate * dt;

    // ── WORLD VELOCITY ────────────────────────────────────────
    const sinY = Math.sin(group.rotation.y);
    const cosY = Math.cos(group.rotation.y);

    physics.velX =
        sinY * physics.forwardSpeed + cosY * physics.lateralSpeed;
    physics.velZ =
        cosY * physics.forwardSpeed - sinY * physics.lateralSpeed;

    // ── BODY ROLL (driven by actual lateral g-force) ──────────
    // Use yawRate * forwardSpeed as the lateral acceleration source
    // BUT also include a direct component from steering input so
    // roll anticipates the turn slightly
    const actualLateralG = physics.forwardSpeed * physics.yawRate;
    const steeringAnticipation =
        physics.steeringAngle * absForward * 0.15;
    const combinedLateralG = actualLateralG * 0.7 + steeringAnticipation * 0.3;

    const maxRollRad = THREE.MathUtils.degToRad(3.5);
    const targetRoll = THREE.MathUtils.clamp(
        combinedLateralG * config.rollStiffness,
        -maxRollRad,
        maxRollRad
    );

    // Dead-zone: if target is very small, snap to zero to prevent
    // lingering roll when driving straight
    const effectiveTarget =
        Math.abs(targetRoll) < 0.003 ? 0 : targetRoll;

    const rollAlpha = 1 - Math.exp(-config.rollSmoothing * dt);
    physics.rollAngle +=
        (effectiveTarget - physics.rollAngle) * rollAlpha;

    // Force to zero when very close to prevent float drift
    if (Math.abs(physics.rollAngle) < 0.001 && Math.abs(effectiveTarget) < 0.001) {
        physics.rollAngle = 0;
    }

    // ── BODY PITCH ────────────────────────────────────────────
    const targetPitch = THREE.MathUtils.clamp(
        -longForce * config.pitchStiffness * 0.01,
        -THREE.MathUtils.degToRad(2),
        THREE.MathUtils.degToRad(2)
    );
    const pitchAlpha = 1 - Math.exp(-config.pitchSmoothing * dt);
    physics.pitchAngle +=
        (targetPitch - physics.pitchAngle) * pitchAlpha;
    if (Math.abs(physics.pitchAngle) < 0.001 && Math.abs(targetPitch) < 0.001) {
        physics.pitchAngle = 0;
    }

    // ── ALIASES ───────────────────────────────────────────────
    physics.speed = physics.forwardSpeed;
    physics.sidewaysSpeed = physics.lateralSpeed;

    return {
        forwardSpeed: physics.forwardSpeed,
        lateralSpeed: physics.lateralSpeed,
        slipAngle: rearSlipAngle,
        slipRatio:
            absForward > 1
                ? Math.abs(physics.lateralSpeed) / absForward
                : 0,
        isOversteer: physics.isOversteering,
        isUndersteer: physics.isUndersteering,
    };
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
            Math.abs(physics.lateralSpeed) > 1.5 &&
            Math.abs(physics.forwardSpeed) > 3,
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