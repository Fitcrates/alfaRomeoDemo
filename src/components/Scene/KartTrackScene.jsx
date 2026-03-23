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

// Track configurations
const TRACK_CONFIGS = {
  drift: {
    model: '/models/drift_race_track_free.glb',
    position: [0, -0.85, 0],
    scale: 0.7,
    spawnPosition: [20, -0.8, 16],
    spawnRotation: Math.PI * 0.5,
  },
  karting: {
    model: '/models/karting_club_lider__karting_race_track_early.glb',
    position: [24, -0.1, -12],
    scale: 2.5,
    spawnPosition: [24, -0.1, -12],
    spawnRotation: 0,
  },
};

const TRACK_TUNING = {
  drift: {
    terrainRaycastModulo: 3,
    collisionRaycastModulo: 3,
    slopeRaycastModulo: 99,
    maxStepUp: 4.0,
    maxPitchDeg: 0,
    minTerrainNormalY: 0.2,
    enableSlopePitch: false,
    maxSurfaceDeltaFromExpected: 4.0,
    maxRisePerSecond: 10.0,
    maxFallPerSecond: 15.0,
    minYClamp: -100,
    maxYClamp: 100,
    disableTerrainFollow: false,
  },
  karting: {
    terrainRaycastModulo: 2,
    collisionRaycastModulo: 6,
    slopeRaycastModulo: 99,
    maxStepUp: 4.0,
    maxPitchDeg: 0,
    minTerrainNormalY: 0.2,
    enableSlopePitch: false,
    maxSurfaceDeltaFromExpected: 4.0,
    maxRisePerSecond: 15.0,
    maxFallPerSecond: 20.0,
    minYClamp: -100,
    maxYClamp: 100,
    disableTerrainFollow: false,
    enableHeadlightShadows: false,
  },
};

function TrackModel({ onCollidersLoaded, onTerrainLoaded }) {
  const config = TRACK_CONFIGS.karting;
  const isKarting = true;
  const { scene } = useGLTF(config.model);
  const groupRef = useRef();

  useEffect(() => {
    if (scene && groupRef.current) {
      const colliders = [];
      const terrainMeshes = [];

      groupRef.current.updateMatrixWorld(true);

      scene.traverse((child) => {
        if (child.isMesh) {
          
          child.receiveShadow = true;

          const mat = child.material;
          const name = (child.name || mat?.name || "").toLowerCase();

          let isCollider = false;

          if (
            name.includes("wall") ||
            name.includes("fence") ||
            name.includes("barrier") ||
            name.includes("tire") ||
            name.includes("guard") ||
            name.includes("cube") ||
            name.includes("cylinder")
          ) {
            isCollider = true;
          }

          if (mat) {
            const isRoad =
              name.includes("ground") ||
              name.includes("asphalt") ||
              name.includes("road") ||
              name.includes("floor") ||
              name.includes("plane") ||
              name.includes("track") ||
              name.includes("curb") ||
              name.includes("kerb") ||
              name.includes("concrete") ||
              name.includes("conc") ||
              name.includes("grass") ||
              name.includes("sand");

            if (isRoad && !isCollider) {
              child.castShadow = false;
              // Remove icy reflection, make it look like dry asphalt
              mat.roughness = Math.max(mat.roughness ?? 0.8, 0.8);
              mat.metalness = Math.min(mat.metalness ?? 0.1, 0.1);
              mat.envMapIntensity = 1.0;
              mat.needsUpdate = true;

              terrainMeshes.push(child);
              if (!child.geometry.boundsTree) child.geometry.computeBoundsTree();
            } else {
              child.castShadow = !isKarting;
              mat.envMapIntensity = Math.max(mat.envMapIntensity ?? 1, 1.2);
              mat.needsUpdate = true;

              child.geometry.computeBoundingBox();
              const worldBox = new THREE.Box3()
                .copy(child.geometry.boundingBox)
                .applyMatrix4(child.matrixWorld);
              const height = worldBox.max.y - worldBox.min.y;
              if (height > 0.25 || isCollider) {
                child.geometry.computeBoundingSphere();
                colliders.push(child);
                if (!child.geometry.boundsTree) child.geometry.computeBoundsTree();
              }
            }
          }
        }
      });

     
      console.log('[TrackModel:karting] Colliders:', colliders.length, '| Terrain meshes:', terrainMeshes.length);
      if (onCollidersLoaded) onCollidersLoaded(colliders);
      if (onTerrainLoaded) onTerrainLoaded(terrainMeshes);
    }
  }, [scene, onCollidersLoaded, onTerrainLoaded, ]);

  return (
    <group ref={groupRef} position={config.position} scale={config.scale}>
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
  const _targetCamPos = useRef(new THREE.Vector3());
  const _targetLookAt = useRef(new THREE.Vector3());
  const _targetCenter = useRef(new THREE.Vector3());
  const trackingDir = useRef(new THREE.Vector2(0, 1));

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
    const dir = driveDirectionRef?.current || { throttle: null, steering: null };
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
      const lerpSpeed = THREE.MathUtils.lerp(baseLerpSpeed, fastLerpSpeed, speedRatio);
      const safeDelta = Math.min(delta, 0.05);
      const lerpFactor = 1 - Math.exp(-lerpSpeed * safeDelta);

      const speed = car.speed || 0;
      const sidewaysSpeed = car.sidewaysSpeed || 0;
      let targetDx = Math.sin(car.rotation);
      let targetDz = Math.cos(car.rotation);

      if (speed > 1 || Math.abs(sidewaysSpeed) > 1) {
        targetDx = Math.sin(car.rotation) * speed + Math.cos(car.rotation) * sidewaysSpeed;
        targetDz = Math.cos(car.rotation) * speed - Math.sin(car.rotation) * sidewaysSpeed;
        const len = Math.sqrt(targetDx * targetDx + targetDz * targetDz);
        if (len > 0) {
          targetDx /= len;
          targetDz /= len;
        }
      } else if (speed < -0.1) {
        targetDx = Math.sin(car.rotation);
        targetDz = Math.cos(car.rotation);
      }

      const driftSmoothLerp = car.isDrifting
        ? 1 - Math.exp(-3.0 * safeDelta)
        : 1 - Math.exp(-8.0 * safeDelta);
      trackingDir.current.x = THREE.MathUtils.lerp(trackingDir.current.x, targetDx, driftSmoothLerp);
      trackingDir.current.y = THREE.MathUtils.lerp(trackingDir.current.y, targetDz, driftSmoothLerp);
      trackingDir.current.normalize();

      const behindX = car.x - trackingDir.current.x * followDistance;
      const behindZ = car.z - trackingDir.current.y * followDistance;

      const steerInput =
        dir.steering === "left" ? 0.1 : dir.steering === "right" ? -0.1 : 0;
      const lookRot = car.rotation + steerInput * 0.1;

      const aheadX = car.x + Math.sin(lookRot) * lookAheadDistance;
      const aheadZ = car.z + Math.cos(lookRot) * lookAheadDistance;

      // Camera height follows terrain too — offset above car's actual Y
      const camY = car.y + followHeight;

      _targetCamPos.current.set(behindX, camY, behindZ);
      _targetLookAt.current.set(aheadX, car.y + 0.3, aheadZ);

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
      const carY = carPositionRef.current?.y ?? 0;
      _targetCenter.current.set(car.x, carY + 0.3, car.z);
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

import DriftEffects from '../Effects/DriftEffects';

export default function KartTrackScene({
  carColor,
  headlightsOn,
  driveDirectionRef,
  driveMode = 'dynamic',
  carPositionRef
}) {
  const [colliders, setColliders] = useState([]);
  const [terrainMeshes, setTerrainMeshes] = useState([]);
  const isKarting = true;
  const config = TRACK_CONFIGS.karting;
  const terrainTuning = TRACK_TUNING.karting;

  useEffect(() => {
    if (carPositionRef) {
      carPositionRef.current = {
        x: config.spawnPosition[0],
        y: config.spawnPosition[1],
        z: config.spawnPosition[2],
        rotation: config.spawnRotation,
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

      <TrackModel
        onCollidersLoaded={setColliders}
        onTerrainLoaded={setTerrainMeshes}
      />

      <CarModel
        carPosition={config.spawnPosition}
        carRotation={config.spawnRotation}
        carColor={carColor}
        headlightsOn={headlightsOn}
        freeRoamActive={true}
        hoodOpen={false}
        driveDirectionRef={driveDirectionRef}
        carPositionRef={carPositionRef}
        trackColliders={colliders}
        terrainMeshes={terrainMeshes}
        terrainTuning={terrainTuning}
        driveMode={driveMode}
      />

      <DriftEffects carPositionRef={carPositionRef} />

      <RacetrackCamera
        carPositionRef={carPositionRef}
        driveDirectionRef={driveDirectionRef}
      />

      {!isKarting && (
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
      )}
    </>
  );
}