import * as THREE from "three";

// DNA drive mode profiles
export const DRIVE_MODES = {
    efficient: {
        maxSpeed: 66,
        acceleration: 7,
        braking: 18,
        engineBraking: 3,
        label: "All Weather",
    },
    natural: {
        maxSpeed: 66,
        acceleration: 10,
        braking: 22,
        engineBraking: 4,
        label: "Natural",
    },
    dynamic: {
        maxSpeed: 66,
        acceleration: 14,
        braking: 26,
        engineBraking: 5,
        label: "Dynamic",
    },
    race: {
        maxSpeed: 66,
        acceleration: 18,
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
    maxSteeringAngle: Math.PI / 3.5,
    minSteeringAngle: Math.PI / 25,
    steeringSpeed: 1.5,
    steeringReturnSpeed: 2.0,
    // Speed at which steering is halfway between max and min (km/h)
    steeringHalfSpeed: 55,

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

// ─── Tire curve (Smooth Nonlinear) ────────────────────────────
function tireForce(absSlip, mu, peakSlip) {
    const x = absSlip / peakSlip;
    return mu * (x / (1 + Math.abs(x)));
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

    const mass = config.mass || 1520;

    // ── STEERING (progressive with speed) ─────────────────────
    const speedKmh = Math.abs(physics.forwardSpeed) * 3.6;
    const topSpeedKmh = config.maxSpeed * 3.6;

    // Linear scale representing how fast we are compared to absolute top speed
    const linearScale = Math.min(1, speedKmh / topSpeedKmh);

    // Steering angle gracefully drops as speed linearly increases
    const steerFactor = 1.0 - linearScale * 0.95;

    const currentMaxSteer = THREE.MathUtils.lerp(
        config.minSteeringAngle,
        config.maxSteeringAngle * 1.2, // Small baseline steering multiplier
        steerFactor
    );
    const targetSteering = steeringInput * currentMaxSteer;

    // Steering progression simulates tire force resistance.
    // It's easy to turn up to 30-50%, but gets progressively harder (slower) to reach 100% lock.
    const steerProgress = Math.abs(physics.steeringAngle) / (currentMaxSteer || 0.001);
    const steeringResistance = THREE.MathUtils.lerp(1.0, 0.15, Math.pow(steerProgress, 2.0));

    if (Math.abs(steeringInput) > 0.01) {
        physics.steeringAngle +=
            (targetSteering - physics.steeringAngle) *
            Math.min(1, config.steeringSpeed * dt * 4 * steeringResistance);
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
        0.35,
        0.75
    );
    const rearLoad = 1.0 - frontLoad;
    physics.loadOnFront = frontLoad;
    physics.loadOnRear = rearLoad;

    // ── SLIP ANGLES ───────────────────────────────────────────
    const absForward = Math.abs(physics.forwardSpeed);

    // Dynamic wheelbase reduces turning radius. Uses linear scale to top speed!
    // At 0km/h we use 50% wheelbase (no longer 20%) to prevent "360 on the spot" tank-turn feel
    const dynamicWheelbase = THREE.MathUtils.lerp(config.wheelbase * 0.70, config.wheelbase, linearScale);
    const halfWB = dynamicWheelbase * 0.5;

    const vLatFront = physics.lateralSpeed + physics.yawRate * halfWB;
    const vLatRear = physics.lateralSpeed - physics.yawRate * halfWB;

    let targetFrontSlip = 0;
    let targetRearSlip = 0;

    // Track slip target with kinematics
    if (absForward > 0.1) {
        targetFrontSlip =
            Math.atan2(vLatFront, absForward) -
            physics.steeringAngle * Math.sign(physics.forwardSpeed);
        targetRearSlip = Math.atan2(vLatRear, absForward);
    }

    // Smooth slip angle evolution (Tire Relaxation Length)
    const slipRelaxationAlpha = 1 - Math.exp(-8 * dt);
    physics.frontSlipAngle += (targetFrontSlip - physics.frontSlipAngle) * slipRelaxationAlpha;
    physics.rearSlipAngle += (targetRearSlip - physics.rearSlipAngle) * slipRelaxationAlpha;

    const frontSlipAngle = physics.frontSlipAngle;
    const rearSlipAngle = physics.rearSlipAngle;

    // ── TRACTION CIRCLE & TIRE FORCES ─────────────────────────
    // Tires have a fixed budget of grip (100%). If you accelerate or brake,
    // that consumes grip budget, leaving less for cornering.
    // When coasting (0 accel/brake), you have 100% grip budget available for cornering!
    const accelUsage = Math.max(0, throttleInput);
    const brakeUsage = Math.max(0, -throttleInput);

    // Assuming rear-wheel biased dynamics
    const frontLongUsage = brakeUsage;
    const rearLongUsage = Math.max(accelUsage, brakeUsage);

    // True friction circle multiplier (No artificial minimum grip floor)
    const frontLatAvailable = Math.sqrt(Math.max(0, 1.0 - frontLongUsage * frontLongUsage));
    const rearLatAvailable = Math.sqrt(Math.max(0, 1.0 - rearLongUsage * rearLongUsage));

    const frontMu =
        config.frontGripMu *
        surfaceMu *
        (0.7 + (0.3 * frontLoad) / baseFront) * frontLatAvailable;

    let rearMu =
        config.rearGripMu *
        surfaceMu *
        (0.7 + (0.3 * rearLoad) / (1 - baseFront)) * rearLatAvailable;

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
        effectivePeakSlip
    );

    const rearForceCoeff = tireForce(
        absRearSlip,
        rearMu + downforce,
        effectivePeakSlip
    );

    const gravity = 9.81;
    const frontLatForce =
        -Math.sign(frontSlipAngle) * frontForceCoeff * frontLoad * gravity * mass;
    const rearLatForce =
        -Math.sign(rearSlipAngle) * rearForceCoeff * rearLoad * gravity * mass;

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
        absForward > 5 &&
        throttleInput > 0.05; // Coasting should not trigger the understeer visual squeals/smoke

    physics.isOversteering =
        (absRearSlip > absFrontSlip * 1.05 && absRearSlip > effectivePeakSlip * 0.6 && absForward > 1.5) ||
        handbrakeActive;

    // ── LONGITUDINAL FORCES & BICYCLE ODE SIMULATION ──────────
    let FxFront = 0;
    let FxRear = 0;

    const maxEngineForce = config.acceleration * mass;
    const maxBrakeForce = config.braking * mass;

    if (isBurnout) {
        FxRear = maxEngineForce * 0.4;
    } else if (throttleInput > 0) {
        FxRear = maxEngineForce * throttleInput;
    } else if (throttleInput < 0) {
        if (physics.forwardSpeed > 1.0) {
            FxFront = -maxBrakeForce * 0.7 * Math.abs(throttleInput);
            FxRear = -maxBrakeForce * 0.3 * Math.abs(throttleInput);
        } else {
            FxRear = maxEngineForce * throttleInput * 0.5; // reverse
        }
    } else {
        FxRear = -Math.sign(physics.forwardSpeed) * config.engineBraking * mass;
    }

    // Aero drag
    const dragForce =
        0.5 * 1.225 * config.dragCoefficient * 2.0 * physics.forwardSpeed * physics.forwardSpeed;
    FxFront -= Math.sign(physics.forwardSpeed) * dragForce * 0.5;
    FxRear -= Math.sign(physics.forwardSpeed) * dragForce * 0.5;

    if (handbrakeActive && absForward > 0.1) {
        FxRear = -Math.sign(physics.forwardSpeed) * config.braking * mass * 1.5;
    }

    // ── LOCAL DYNAMICS INTEGRATION ────────────────────────────
    const cosSteer = Math.cos(physics.steeringAngle);
    const sinSteer = Math.sin(physics.steeringAngle);

    // frontLatForce is lateral to the FRONT WHEEL (+X is Left). Project it to chassis frame:
    // Dampen Fx longitudinal interference across steering so breaking doesn't physically countersteer out
    const FxFrontWorld = FxFront * cosSteer - frontLatForce * sinSteer * 0.15;
    const FyFrontWorld = FxFront * sinSteer * 0.15 + frontLatForce * cosSteer;

    const FxTotal = FxFrontWorld + FxRear;
    const FyTotal = FyFrontWorld + rearLatForce;

    // Newton's Equations of Motion!
    const ax = FxTotal / mass + physics.lateralSpeed * physics.yawRate;
    const ay = FyTotal / mass - physics.forwardSpeed * physics.yawRate;

    // Yaw Torque Integration
    const aDist = dynamicWheelbase * config.weightDistribution;       // Front axle dist
    const bDist = dynamicWheelbase * (1 - config.weightDistribution); // Rear axle dist

    // Real world Iz evaluation logic 
    const Iz = mass * (aDist * aDist + bDist * bDist);
    const yawAcc = (aDist * FyFrontWorld - bDist * rearLatForce) / Iz;

    physics.forwardSpeed += ax * dt;
    physics.lateralSpeed += ay * dt;
    physics.yawRate += yawAcc * dt;

    // Physics driven dampeners
    const yawDamp = physics.isOversteering && throttleInput > 0 ? 0.4 : 1.2;
    physics.yawRate *= Math.max(0, 1 - yawDamp * dt);

    physics.lateralSpeed *= Math.max(0, 1 - 0.5 * dt);

    physics.forwardSpeed = THREE.MathUtils.clamp(
        physics.forwardSpeed,
        -config.maxSpeed * 0.35,
        config.maxSpeed
    );

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
    const actualLateralG = physics.forwardSpeed * physics.yawRate;
    const steeringAnticipation = physics.steeringAngle * absForward * 0.15;
    const combinedLateralG = actualLateralG * 0.3 + steeringAnticipation * 0.3;

    // Scale body roll down to nothing at very low speeds
    const speedRollScale = THREE.MathUtils.clamp((speedKmh - 10) / 40, 0, 1);
    // Massively reduce body roll when the car is coasting (no acceleration to shift weight)
    const powerRollMultiplier = Math.abs(throttleInput) > 0.05 ? 1.0 : 0.4;

    const maxRollRad = THREE.MathUtils.degToRad(3.5);
    const targetRoll = THREE.MathUtils.clamp(
        combinedLateralG * config.rollStiffness * speedRollScale * powerRollMultiplier,
        -maxRollRad,
        maxRollRad
    );

    const effectiveTarget = Math.abs(targetRoll) < 0.003 ? 0 : targetRoll;

    // Immediately recover body roll if going straight or steering neutral
    const isRecovering = Math.abs(effectiveTarget) < 0.005 || Math.abs(steeringInput) < 0.05;
    const activeRollSmoothing = isRecovering ? 8.0 : config.rollSmoothing * 2.5;
    const rollAlpha = 1 - Math.exp(-activeRollSmoothing * dt);
    physics.rollAngle += (effectiveTarget - physics.rollAngle) * rollAlpha;

    if (Math.abs(physics.rollAngle) < 0.001 && Math.abs(effectiveTarget) < 0.001) {
        physics.rollAngle = 0;
    }

    // ── BODY PITCH ────────────────────────────────────────────
    // FxTotal is mass-scaled longitudinal force
    const targetPitch = THREE.MathUtils.clamp(
        -FxTotal * config.pitchStiffness * 0.01,
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
            (physics.isOversteering || handbrakeActive) &&
            (Math.abs(physics.lateralSpeed) > 1.0 || Math.abs(physics.yawRate) > 0.4 || handbrakeActive) &&
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