import { useRef, useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import CarModel from './CarModel'
import Lighting from './Lighting'

function TrackModel() {
  const { scene } = useGLTF('/models/drift_race_track_free.glb')
  // Give shadows to all elements in the track GLB
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = true
          child.castShadow = true
        }
      })
    }
  }, [scene])
  // Position track correctly - scale to fit the car appropriately
  return (
    <group position={[0, -0.85, 0]} scale={0.7}>
      <primitive object={scene} />
    </group>
  )
}

function RacetrackCamera({ carPositionRef, driveDirectionRef }) {
  const { camera } = useThree()
  const orbitRef = useRef()
  const smoothedPosition = useRef(new THREE.Vector3())
  const smoothedTarget = useRef(new THREE.Vector3())
  const wasDrivingRef = useRef(false)

  useEffect(() => {
    if (carPositionRef?.current) {
      smoothedTarget.current.set(
        carPositionRef.current.x,
        0.3,
        carPositionRef.current.z
      )
    }
  }, [carPositionRef])

  useFrame((state, delta) => {
    if (!carPositionRef?.current) return

    const car = carPositionRef.current
    const dir = driveDirectionRef?.current || {
      throttle: null,
      steering: null,
    }
    const hasInput = dir.throttle || dir.steering
    const carSpeed = Math.abs(car.speed || 0)

    // ── KEY FIX: Camera follows until the car actually stops ──────
    // Chase if player is giving input OR car is still moving
    const speedThreshold = 0.3 // Below this speed, switch to orbit
    const isDriving = hasInput || carSpeed > speedThreshold

    // Dynamically toggle controls without triggering react renders
    if (orbitRef.current) {
      orbitRef.current.enabled = !isDriving
    }

    if (isDriving) {
      // ── CHASE CAM TUNING ──────────────────────────────────────────
      const followDistance = 9 // Distance behind car
      const followHeight = 2.2 // Height above car
      const lookAheadDistance = 5 // How far ahead the camera looks

      // ── KEY FIX: Speed-adaptive lerp ──────────────────────────────
      // Faster car = tighter follow so camera stays behind, not beside
      const speedRatio = THREE.MathUtils.clamp(carSpeed / 15, 0, 1)
      const baseLerpSpeed = 2.5 // Gentle at low speed
      const fastLerpSpeed = 8.0 // Snappy at high speed
      const lerpSpeed = THREE.MathUtils.lerp(
        baseLerpSpeed,
        fastLerpSpeed,
        speedRatio
      )
      const lerpFactor = 1 - Math.exp(-lerpSpeed * delta)

      // ── Camera position: directly behind the car ──────────────────
      const behindX =
        car.x - Math.sin(car.rotation) * followDistance
      const behindZ =
        car.z - Math.cos(car.rotation) * followDistance

      // ── Subtle "look into the corner" offset ──────────────────────
      const steerInput =
        dir.steering === 'left'
          ? 0.1
          : dir.steering === 'right'
            ? -0.1
            : 0
      // Only offset the LOOK target, not the camera position
      const lookRot = car.rotation + steerInput * 0.1

      const aheadX =
        car.x + Math.sin(lookRot) * lookAheadDistance
      const aheadZ =
        car.z + Math.cos(lookRot) * lookAheadDistance

      const targetCamPos = new THREE.Vector3(
        behindX,
        followHeight,
        behindZ
      )
      const targetLookAt = new THREE.Vector3(aheadX, 0.3, aheadZ)

      // ── Smooth start: seed from current camera on first drive frame
      if (!wasDrivingRef.current) {
        smoothedPosition.current.copy(camera.position)
        if (orbitRef.current) {
          smoothedTarget.current.copy(orbitRef.current.target)
        }
      }

      // ── POSITION follows tightly (same lerp for both) ────────────
      smoothedPosition.current.lerp(targetCamPos, lerpFactor)
      smoothedTarget.current.lerp(targetLookAt, lerpFactor)

      camera.position.copy(smoothedPosition.current)
      camera.lookAt(smoothedTarget.current)
    } else {
      // ── ORBIT / PHOTO MODE ────────────────────────────────────────
      const photoLerp = 1 - Math.exp(-3 * delta)
      const targetCenter = new THREE.Vector3(car.x, 0.3, car.z)

      smoothedTarget.current.lerp(targetCenter, photoLerp)

      if (orbitRef.current) {
        orbitRef.current.target.copy(smoothedTarget.current)
        orbitRef.current.update()
      }

      // Keep smoothed cam in sync so chase doesn't snap on resume
      smoothedPosition.current.copy(camera.position)
    }

    wasDrivingRef.current = !!isDriving
  })

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
  )
}

export default function RacetrackScene({ carColor, headlightsOn, driveDirectionRef }) {
  const carPositionRef = useRef({ x: 0, y: -0.8, z: 0, rotation: 0 })

  return (
    <>
      <Lighting />
      <Environment files="/textures/HdrSkyEvening006_HDR_4K.hdr" background blur={0.0} environmentIntensity={0.65} />

      <TrackModel />

      <CarModel
        carPosition={[0, -0.8, 0]}
        carRotation={Math.PI * 0.5} // Facing down track
        carColor={carColor}
        headlightsOn={headlightsOn}
        freeRoamActive={true}
        hoodOpen={false}
        driveDirectionRef={driveDirectionRef}
        carPositionRef={carPositionRef}
      />

      <RacetrackCamera
        carPositionRef={carPositionRef}
        driveDirectionRef={driveDirectionRef}
      />

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom
          luminanceThreshold={1.0}
          luminanceSmoothing={0.4}
          intensity={0.6}
          radius={0.6}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.3} />
        <Noise premultiply opacity={0.012} />
      </EffectComposer>
    </>
  )
}
