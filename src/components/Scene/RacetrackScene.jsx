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

  useEffect(() => {
    if (scene) {
      const colliders = [];
      scene.updateMatrixWorld(true);
      scene.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = true;
          child.castShadow = true;

          const mat = child.material;
          const name = (child.name || mat?.name || "").toLowerCase();

          // Collect collision meshes
          if (
            name.includes("wall") ||
            name.includes("fence") ||
            name.includes("barrier") ||
            name.includes("tire") ||
            name.includes("curb") ||
            name.includes("guard") ||
            name.includes("cube") ||
            name.includes("cylinder")
          ) {
            colliders.push(child);
          }

          if (mat) {
            if (
              name.includes("ground") ||
              name.includes("asphalt") ||
              name.includes("road") ||
              name.includes("floor") ||
              name.includes("plane") ||
              name.includes("track")
            ) {
              mat.roughness = Math.min(mat.roughness ?? 1, 0.15);
              mat.metalness = Math.max(mat.metalness ?? 0, 0.1);
              mat.envMapIntensity = 1.8;
              mat.needsUpdate = true;
            } else {
              mat.envMapIntensity = Math.max(
                mat.envMapIntensity ?? 1,
                1.2,
              );
              mat.needsUpdate = true;
            }
          }
        }
      });
      if (onCollidersLoaded) onCollidersLoaded(colliders);
    }
  }, [scene, onCollidersLoaded]);

  return (
    <group position={[0, -0.85, 0]} scale={0.7}>
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
      const baseSmoothTime = 0.4;
      const fastSmoothTime = 0.15;
      const smoothTime = THREE.MathUtils.lerp(
        baseSmoothTime,
        fastSmoothTime,
        speedRatio,
      );

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

      const targetCamPos = new THREE.Vector3(
        behindX,
        followHeight,
        behindZ,
      );
      const targetLookAt = new THREE.Vector3(
        aheadX,
        0.3,
        aheadZ,
      );

      if (!wasDrivingRef.current) {
        smoothedPosition.current.copy(camera.position);
        if (orbitRef.current) {
          smoothedTarget.current.copy(orbitRef.current.target);
        }
      }

      damp3(smoothedPosition.current, targetCamPos, smoothTime, delta);
      damp3(smoothedTarget.current, targetLookAt, smoothTime, delta);

      camera.position.copy(smoothedPosition.current);
      camera.lookAt(smoothedTarget.current);
    } else {
      const targetCenter = new THREE.Vector3(car.x, 0.3, car.z);
      damp3(smoothedTarget.current, targetCenter, 0.35, delta);

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
}) {
  const [colliders, setColliders] = useState([]);
  const carPositionRef = useRef({
    x: 0,
    y: -0.8,
    z: 0,
    rotation: 0,
  });

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
        carPosition={[0, -0.8, 0]}
        carRotation={Math.PI * 0.5}
        carColor={carColor}
        headlightsOn={headlightsOn}
        freeRoamActive={true}
        hoodOpen={false}
        driveDirectionRef={driveDirectionRef}
        carPositionRef={carPositionRef}
        trackColliders={colliders}
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