import { useRef, useEffect, useState, Suspense, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress, Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import styled from 'styled-components'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'

import CarModel from './Scene/CarModel'
import Lighting from './Scene/Lighting'
import Floor from './Scene/Floor'
import CameraController from './Scene/CameraController'
import RacetrackScene from './Scene/RacetrackScene'
import LoadingScreen from './Layout/LoadingScreen'
import Navbar from './Layout/Navbar'

import HeroSection from './Sections/HeroSection'
import EngineSection from './Sections/EngineSection'
import SuspensionSection from './Sections/SuspensionSection'
import WheelsSection from './Sections/WheelsSection'
import InteriorSection from './Sections/InteriorSection'
import EngineBaySection from './Sections/EngineBaySection'
import GallerySection from './Sections/GallerySection'
import FreeRoamSection from './Sections/FreeRoamSection'
import ContactSection from './Sections/ContactSection'
import FooterSection from './Sections/FooterSection'

gsap.registerPlugin(ScrollTrigger)

/**
 * FreeRoamCamera - Handles camera in free roam mode
 * - When driving: follows car from behind (smooth transition)
 * - When not driving: OrbitControls for photo mode
 */
function FreeRoamCamera({ carPositionRef, driveDirectionRef }) {
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

const Container = styled.div`
  position: relative;
  width: 100%;
  background: #0a0a0a;
`

const CanvasContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: ${props => props.$freeRoamActive ? 10 : 1};
  pointer-events: ${props => props.$freeRoamActive ? 'auto' : 'none'};
`

const SectionsContainer = styled.div`
  position: relative;
  z-index: 2;
  pointer-events: none;
  
  & > section {
    pointer-events: auto;
  }
`

/**
 * CAR POSITION CONFIGURATION
 * 
 * The car stays FIXED at this position. Camera moves around it.
 * Adjust these values to change the car's base position in the scene.
 * 
 * CAR_POSITION: [x, y, z]
 * - x: Left/Right offset (0 = centered)
 * - y: Height (-0.8 places wheels on floor)
 * - z: Forward/Back offset (0 = centered)
 * 
 * CAR_ROTATION: Rotation around Y-axis in radians
 * - 0 = facing +Z (towards camera default)
 * - Math.PI * 0.5 = facing +X (right)
 * - Math.PI = facing -Z (away from camera)
 * - Math.PI * 1.5 = facing -X (left)
 */
const CAR_POSITION = [0, -0.8, 0]
const CAR_ROTATION = Math.PI * 0.05 // Slight angle for visual interest

function Scene({ scrollProgressRef, dnaMode, carColor, headlightsOn, freeRoamActive, hoodOpen, driveDirectionRef }) {
  // Ref to track car position for camera follow
  const carPositionRef = useRef({ x: 0, y: -0.8, z: 0, rotation: 0 })

  return (
    <>
      <Environment files="/textures/HdrSkyEvening006_HDR_4K.hdr" background={true} blur={0} environmentIntensity={0.9} />
      <Lighting /> {/* Static studio rig; no lights-on dimming here */}
      {/* <Sky /> */} {/* Commented out - procedural sky too heavy, need texture-based solution */}
      <Floor />

      {/* Camera Controller - moves camera based on scroll, car stays fixed */}
      <CameraController
        scrollProgressRef={scrollProgressRef}
        freeRoamActive={freeRoamActive}
      />

      <CarModel
        carPosition={CAR_POSITION}
        carRotation={CAR_ROTATION}
        carColor={carColor}
        headlightsOn={headlightsOn}
        freeRoamActive={freeRoamActive}
        hoodOpen={hoodOpen}
        driveDirectionRef={driveDirectionRef}
        carPositionRef={carPositionRef}
      />

      {/* Camera system for free roam */}
      {freeRoamActive && (
        <FreeRoamCamera
          carPositionRef={carPositionRef}
          driveDirectionRef={driveDirectionRef}
        />
      )}

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom
          luminanceThreshold={0.9}
          luminanceSmoothing={0.4}
          intensity={0.9}
          radius={0.2}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
        <Noise premultiply opacity={0.2} />
      </EffectComposer>
    </>
  )
}

// Removed LoadingProgress component as it causes setState-in-render warning

export default function ScrollExperience() {
  const containerRef = useRef(null)
  const scrollProgressRef = useRef(0)
  const { progress } = useProgress()
  const [isLoaded, setIsLoaded] = useState(false)
  const [dnaMode, setDnaMode] = useState('dynamic')
  const [carColor, setCarColor] = useState(null)
  const [headlightsOn, setHeadlightsOn] = useState(false)
  const [engineOn, setEngineOn] = useState(false)
  const [freeRoamActive, setFreeRoamActive] = useState(false)
  const [showRacetrack, setShowRacetrack] = useState(false)
  const [hoodOpen, setHoodOpen] = useState(false)

  // Use a ref for drive direction to prevent expensive React re-renders on every keystroke
  const driveDirectionRef = useRef({ throttle: null, steering: null })

  useEffect(() => {
    if (progress >= 100 && !isLoaded) {
      const timer = setTimeout(() => setIsLoaded(true), 500)
      return () => clearTimeout(timer)
    }
  }, [progress, isLoaded])

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress
        }
      })
    })

    return () => ctx.revert()
  }, [])

  const handleModeChange = (mode) => {
    setDnaMode(mode.id)
  }

  const handleColorChange = (color) => {
    setCarColor(color)
  }

  const handleEngineStart = () => {
    setHeadlightsOn(prev => !prev)
  }

  const handleFreeRoamEnter = () => {
    setFreeRoamActive(true)
  }

  const handleFreeRoamLeave = () => {
    setFreeRoamActive(false)
  }

  const handleToggleRacetrack = () => {
    setShowRacetrack(prev => {
      const isEntering = !prev
      if (isEntering) {
        document.body.style.overflow = 'hidden'
        setIsLoaded(false) // Trigger loading screen for the transition
        setEngineOn(true) // Automatically start the engine for the track
      } else {
        document.body.style.overflow = ''
      }
      return isEntering
    })
  }

  const handleHoodToggle = (open) => {
    setHoodOpen(open)
  }

  const handleToggleLights = () => {
    setHeadlightsOn(prev => !prev)
  }

  const handleToggleEngine = () => {
    setEngineOn(prev => !prev)
  }

  const handleDrive = (type, direction, isActive) => {
    // Only allow driving when engine is on
    if (!engineOn) return

    if (type === 'combined') {
      // Direct ref update avoids re-rendering the whole page
      driveDirectionRef.current = direction
    } else {
      // Legacy single input fallback
      driveDirectionRef.current = {
        ...driveDirectionRef.current,
        [type]: isActive ? direction : null
      }
    }
  }

  return (
    <>
      <LoadingScreen progress={progress} isLoaded={isLoaded} />

      <Container ref={containerRef}>
        <Navbar onTakeToRacetrack={handleToggleRacetrack} inRacetrack={showRacetrack} />

        <CanvasContainer $freeRoamActive={freeRoamActive || showRacetrack}>
          <Canvas
            camera={{ position: [0, 1, 8], fov: 45 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace
              gl.toneMapping = THREE.ACESFilmicToneMapping
              gl.toneMappingExposure = 1.0
              gl.physicallyCorrectLights = true
            }}
            shadows={{ type: THREE.PCFShadowMap }}
            frameloop="always"
          >
            {/* Soft atmospheric fog to blend the massive infinite floor into the evening HDRI horizon */}
            <fog attach="fog" args={['#201c18', 40, 400]} />

            {/* Use the sky environment as the background instead of forcing black void */}
            <Suspense fallback={null}>
              {showRacetrack ? (
                <RacetrackScene
                  carColor={carColor}
                  headlightsOn={headlightsOn}
                  driveDirectionRef={driveDirectionRef}
                />
              ) : (
                <Scene
                  scrollProgressRef={scrollProgressRef}
                  dnaMode={dnaMode}
                  carColor={carColor}
                  headlightsOn={headlightsOn}
                  freeRoamActive={freeRoamActive}
                  hoodOpen={hoodOpen}
                  driveDirectionRef={driveDirectionRef}
                />
              )}
            </Suspense>
          </Canvas>
        </CanvasContainer>

        <SectionsContainer style={{ display: showRacetrack ? 'none' : 'block' }}>
          <HeroSection id="hero" />
          <EngineSection id="engine" scrollProgressRef={scrollProgressRef} onEngineStart={handleEngineStart} headlightsOn={headlightsOn} />
          <SuspensionSection id="suspension" onModeChange={handleModeChange} />
          <WheelsSection id="wheels" />
          <InteriorSection id="interior" />
          <EngineBaySection id="enginebay" onHoodToggle={handleHoodToggle} hoodOpen={hoodOpen} />
          <GallerySection id="gallery" onColorChange={handleColorChange} />
          <ContactSection id="contact" />
          <FooterSection id="footer" />
          <FreeRoamSection
            id="freeroam"
            onFreeRoamEnter={handleFreeRoamEnter}
            onFreeRoamLeave={handleFreeRoamLeave}
            headlightsOn={headlightsOn}
            engineOn={engineOn}
            onToggleLights={handleToggleLights}
            onToggleEngine={handleToggleEngine}
            onDrive={handleDrive}
          />

        </SectionsContainer>

        {(showRacetrack && isLoaded) && (
          <FreeRoamSection
            id="racetrack-controls"
            headlightsOn={headlightsOn}
            engineOn={engineOn} // Use the actual state
            onToggleLights={handleToggleLights}
            onToggleEngine={handleToggleEngine} // Allow user to turn it off on the track
            onDrive={handleDrive}
            onFreeRoamEnter={() => { }}
            onFreeRoamLeave={() => { }}
            forceActive={true}
          />
        )}
      </Container>
    </>
  )
}
