import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { damp3 } from "maath/easing";
import CarModel from "./CarModel";
import Lighting from "./Lighting";

function TrackModel({ onCollidersLoaded }) {
  const { scene } = useGLTF("/models/drift_race_track_free.glb");
  const groupRef = useRef();

  useEffect(() => {
    if (scene && groupRef.current) {
      const colliders = [];
      // CRITICAL: Update world matrix AFTER the group transform is applied
      // The group has position=[0,-0.85,0] scale=0.7, so all child matrices
      // must incorporate that transform for raycasting to align correctly
      groupRef.current.updateMatrixWorld(true);
      scene.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = true;

          const mat = child.material;
          const name = (child.name || mat?.name || "").toLowerCase();

          if (mat) {
            const isRoad = name.includes("ground") ||
              name.includes("asphalt") ||
              name.includes("road") ||
              name.includes("floor") ||
              name.includes("plane") ||
              name.includes("track");

            if (isRoad) {
              child.castShadow = false; // Fix: Ground planes shouldn't cast shadows onto themselves! (no drag lines)
              mat.roughness = Math.min(mat.roughness ?? 1, 0.15);
              mat.metalness = Math.max(mat.metalness ?? 0, 0.1);
              mat.envMapIntensity = 1.8;
              mat.needsUpdate = true;
            } else {
              child.castShadow = true; // Fix: Only obstacles should cast shadows
              mat.envMapIntensity = Math.max(
                mat.envMapIntensity ?? 1,
                1.2,
              );
              mat.needsUpdate = true;

              // Only push obstacles with noticeable vertical height using pure geometry bounds
              child.geometry.computeBoundingBox();
              const worldBox = new THREE.Box3().copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
              const height = worldBox.max.y - worldBox.min.y;
              if (height > 0.25) {
                child.geometry.computeBoundingSphere(); // Precompute to stop 1st frame stutter
                colliders.push(child); // Push genuine collidable mesh!
              }
            }
          }
        }
      });
      console.log('[TrackModel] Colliders found:', colliders.length);
      if (onCollidersLoaded) onCollidersLoaded(colliders);
    }
  }, [scene, onCollidersLoaded]);

  return (
    <group ref={groupRef} position={[0, -0.85, 0]} scale={0.7}>
      <primitive object={scene} />
    </group>
  );
}

function RacetrackCamera({ carPositionRef, driveDirectionRef }) {
  const { camera } = useThree();
  const orbitRef = useRef();
  const smoothedPosition = useRef(new THREE.Vector3());
  const smoothedTarget = useRef(new THREE.Vector3());
  const wasDrivingRef = useRef(false);
  // Pre-allocate reusable vectors to eliminate GC jitter
  const _targetCamPos = useRef(new THREE.Vector3());
  const _targetLookAt = useRef(new THREE.Vector3());
  const _targetCenter = useRef(new THREE.Vector3());

  useEffect(() => {
    if (carPositionRef?.current) {
      smoothedTarget.current.set(
        carPositionRef.current.x,
        0.3,
        carPositionRef.current.z,
      );
    }
  }, [carPositionRef]);

  useFrame((state, delta) => {
    if (!carPositionRef?.current) return;

    const car = carPositionRef.current;
    const dir = driveDirectionRef?.current || {
      throttle: null,
      steering: null,
    };
    const hasInput = dir.throttle || dir.steering;
    const carSpeed = Math.abs(car.speed || 0);

    const speedThreshold = 0.3;
    const isDriving = hasInput || carSpeed > speedThreshold;

    if (orbitRef.current) {
      orbitRef.current.enabled = !isDriving;
    }

    if (isDriving) {
      const followDistance = 9;
      const followHeight = 2.2;
      const lookAheadDistance = 5;

      const speedRatio = THREE.MathUtils.clamp(carSpeed / 15, 0, 1);
      const baseLerpSpeed = 2.5;
      const fastLerpSpeed = 8.0;
      const lerpSpeed = THREE.MathUtils.lerp(
        baseLerpSpeed,
        fastLerpSpeed,
        speedRatio,
      );
      // Ensure delta spikes do not cause snap effect rubberbanding
      const safeDelta = Math.min(delta, 0.05);
      const lerpFactor = 1 - Math.exp(-lerpSpeed * safeDelta);

      const behindX =
        car.x - Math.sin(car.rotation) * followDistance;
      const behindZ =
        car.z - Math.cos(car.rotation) * followDistance;

      const steerInput =
        dir.steering === "left"
          ? 0.1
          : dir.steering === "right"
            ? -0.1
            : 0;
      const lookRot = car.rotation + steerInput * 0.1;

      const aheadX =
        car.x + Math.sin(lookRot) * lookAheadDistance;
      const aheadZ =
        car.z + Math.cos(lookRot) * lookAheadDistance;

      _targetCamPos.current.set(behindX, followHeight, behindZ);
      _targetLookAt.current.set(aheadX, 0.3, aheadZ);

      if (!wasDrivingRef.current) {
        smoothedPosition.current.copy(camera.position);
        if (orbitRef.current) {
          smoothedTarget.current.copy(orbitRef.current.target);
        }
      }

      smoothedPosition.current.lerp(_targetCamPos.current, lerpFactor);
      smoothedTarget.current.lerp(_targetLookAt.current, lerpFactor);

      camera.position.copy(smoothedPosition.current);
      camera.lookAt(smoothedTarget.current);
    } else {
      const safeDelta = Math.min(delta, 0.05);
      const photoLerp = 1 - Math.exp(-3 * safeDelta);
      _targetCenter.current.set(car.x, 0.3, car.z);
      smoothedTarget.current.lerp(_targetCenter.current, photoLerp);

      if (orbitRef.current) {
        orbitRef.current.target.copy(smoothedTarget.current);
        orbitRef.current.update();
      }

      smoothedPosition.current.copy(camera.position);
    }

    wasDrivingRef.current = !!isDriving;
  });

  return (
    <OrbitControls
      ref={orbitRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={3}
      maxDistance={15}
      minPolarAngle={Math.PI * 0.05}
      maxPolarAngle={Math.PI * 0.52}
      enableDamping={true}
      dampingFactor={0.95}
    />
  );
}

function RendererConfig() {
  const { gl } = useThree();

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.85;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  return null;
}

export default function RacetrackScene({
  carColor,
  headlightsOn,
  driveDirectionRef,
  driveMode = 'dynamic',
  carPositionRef,
}) {
  const [colliders, setColliders] = useState([]);

  // Set initial position for Racetrack
  useEffect(() => {
    if (carPositionRef) {
      carPositionRef.current = {
        x: 20,
        y: -0.8,
        z: 16,
        rotation: Math.PI * 0.5,
        speed: 0
      };
    }
  }, [carPositionRef]);

  return (
    <>
      <RendererConfig />
      <Lighting carPositionRef={carPositionRef} />

      <Environment
        files="/textures/HdrSkyEvening006_HDR_4K.hdr"
        background
        blur={0.0}
        environmentIntensity={0.65}
      />

      <TrackModel onCollidersLoaded={setColliders} />

      <CarModel
        carPosition={[20, -0.8, 16]}
        carRotation={Math.PI * 0.5}
        carColor={carColor}
        headlightsOn={headlightsOn}
        freeRoamActive={true}
        hoodOpen={false}
        driveDirectionRef={driveDirectionRef}
        carPositionRef={carPositionRef}
        trackColliders={colliders}
        driveMode={driveMode}
      />

      <RacetrackCamera
        carPositionRef={carPositionRef}
        driveDirectionRef={driveDirectionRef}
      />

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.5}
          intensity={0.8}
          radius={0.75}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.15} darkness={0.45} />
        <Noise premultiply opacity={0.015} />
      </EffectComposer>
    </>
  );
}