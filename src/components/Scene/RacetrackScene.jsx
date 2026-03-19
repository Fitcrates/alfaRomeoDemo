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
        smoothedTarget.current.set(carPositionRef.current.x, 0.3, carPositionRef.current.z)
    }
  }, [carPositionRef])

  useFrame((state, delta) => {
    if (!carPositionRef?.current) return
    
    const car = carPositionRef.current
    const dir = driveDirectionRef?.current || { throttle: null, steering: null }
    const isDriving = dir.throttle || dir.steering
    
    if (orbitRef.current) {
        orbitRef.current.enabled = !isDriving
    }
    
    const lerpSpeed = 3.5 
    const lerpFactor = 1 - Math.exp(-lerpSpeed * delta)
    
    if (isDriving) {
      const followDistance = 7.5
      const followHeight = 2.0 // Slightly higher for racetrack visibility
      const lookAheadDistance = 6
      
      const behindX = car.x - Math.sin(car.rotation) * followDistance
      const behindZ = car.z - Math.cos(car.rotation) * followDistance
      
      const steerFactor = dir.steering === 'left' ? 1.0 : (dir.steering === 'right' ? -1.0 : 0)
      const lookRot = car.rotation + steerFactor * 0.15
      
      const aheadX = car.x + Math.sin(lookRot) * lookAheadDistance
      const aheadZ = car.z + Math.cos(lookRot) * lookAheadDistance
      
      const targetCamPos = new THREE.Vector3(behindX, followHeight, behindZ)
      const targetLookAt = new THREE.Vector3(aheadX, 0.3, aheadZ)
      
      if (!wasDrivingRef.current) {
        smoothedPosition.current.copy(camera.position)
        if (orbitRef.current) {
          smoothedTarget.current.copy(orbitRef.current.target)
        }
      }
      
      smoothedPosition.current.lerp(targetCamPos, lerpFactor * 0.8) 
      smoothedTarget.current.lerp(targetLookAt, lerpFactor * 1.2)
      
      camera.position.copy(smoothedPosition.current)
      camera.lookAt(smoothedTarget.current)
      
    } else {
      const targetCenter = new THREE.Vector3(car.x, 0.3, car.z)
      smoothedTarget.current.lerp(targetCenter, lerpFactor * 1.5)
      
      if (orbitRef.current) {
        orbitRef.current.target.copy(smoothedTarget.current)
        orbitRef.current.update()
      }
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
      maxDistance={30}
      minPolarAngle={Math.PI * 0.05}
      maxPolarAngle={Math.PI * 0.48}
      enableDamping={true}
      dampingFactor={0.05}
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
