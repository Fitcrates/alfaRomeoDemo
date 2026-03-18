import { useRef, useEffect, useState, Suspense, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress, Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import styled from 'styled-components'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'

import CarModel from './Scene/CarModel'
import Lighting from './Scene/Lighting'
import Floor from './Scene/Floor'
import CameraController from './Scene/CameraController'
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
 * - When driving: follows car from behind
 * - When not driving: OrbitControls for photo mode
 */
function FreeRoamCamera({ carPositionRef, driveDirection }) {
  const { camera } = useThree()
  const orbitRef = useRef()
  const smoothedPosition = useRef(new THREE.Vector3(5, 3, 8))
  const smoothedTarget = useRef(new THREE.Vector3(0, 0, 0))
  
  // Check if actively driving
  const isDriving = driveDirection?.throttle || driveDirection?.steering
  
  useFrame((state, delta) => {
    if (!carPositionRef?.current) return
    
    const car = carPositionRef.current
    
    // Update OrbitControls target to follow car position (for photo mode)
    if (orbitRef.current && !isDriving) {
      orbitRef.current.target.set(car.x, 0, car.z)
      orbitRef.current.update()
    }
    
    // Camera follow when driving
    if (isDriving) {
      const followDistance = 10 // Distance behind car
      const followHeight = 4.5 // Height above car (to see over control panel)
      const followOffset = 1.5 // Offset to the right to avoid center UI
      const lookAheadDistance = 4 // How far ahead to look
      
      // Calculate camera position behind and slightly to the side of the car
      const behindX = car.x - Math.sin(car.rotation) * followDistance + Math.cos(car.rotation) * followOffset
      const behindZ = car.z - Math.cos(car.rotation) * followDistance - Math.sin(car.rotation) * followOffset
      
      // Calculate look-at point ahead of the car
      const aheadX = car.x + Math.sin(car.rotation) * lookAheadDistance
      const aheadZ = car.z + Math.cos(car.rotation) * lookAheadDistance
      
      // Target positions
      const targetCamPos = new THREE.Vector3(behindX, followHeight, behindZ)
      const targetLookAt = new THREE.Vector3(aheadX, 0.3, aheadZ)
      
      // Smooth interpolation (frame-rate independent)
      const lerpSpeed = 3.5
      const lerpFactor = 1 - Math.exp(-lerpSpeed * delta)
      
      smoothedPosition.current.lerp(targetCamPos, lerpFactor)
      smoothedTarget.current.lerp(targetLookAt, lerpFactor)
      
      // Apply to camera
      camera.position.copy(smoothedPosition.current)
      camera.lookAt(smoothedTarget.current)
    }
  })
  
  return (
    <OrbitControls
      ref={orbitRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enabled={!isDriving} // Disable when driving
      minDistance={3}
      maxDistance={20}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.6}
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

function Scene({ scrollProgressRef, dnaMode, carColor, headlightsOn, freeRoamActive, hoodOpen, driveDirection }) {
  // Ref to track car position for camera follow
  const carPositionRef = useRef({ x: 0, y: -0.8, z: 0, rotation: 0 })
  
  return (
    <>
      <fog attach="fog" args={['#07090c', 20, 68]} /> {/* Soft distance blend so floor transitions smoothly into background */}
      <Environment preset="sunset" background={false} blur={0.8} environmentIntensity={0.35} /> {/* Keep IBL constant so engine ON does not darken the whole scene */}
      <Lighting /> {/* Static studio rig; no lights-on dimming here */}
      <Floor />
      <ContactShadows position={[0, -0.82, 0]} opacity={0.35} scale={14} blur={2.2} far={4} resolution={1024} color="#000000" />
      
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
        driveDirection={driveDirection}
        carPositionRef={carPositionRef}
      />
      
      {/* Camera system for free roam */}
      {freeRoamActive && (
        <FreeRoamCamera 
          carPositionRef={carPositionRef} 
          driveDirection={driveDirection}
        />
      )}
      
      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom 
          luminanceThreshold={headlightsOn ? 0.8 : 1.2}
          luminanceSmoothing={0.3}
          intensity={headlightsOn ? 1.2 : 0.05}
          radius={0.6}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.3} />
        <Noise premultiply opacity={0.012} />
      </EffectComposer>
    </>
  )
}

function LoadingProgress({ onProgress }) {
  const { progress } = useProgress()
  
  useEffect(() => {
    onProgress(progress)
  }, [progress, onProgress])
  
  return null
}

export default function ScrollExperience() {
  const containerRef = useRef(null)
  const scrollProgressRef = useRef(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [dnaMode, setDnaMode] = useState('dynamic')
  const [carColor, setCarColor] = useState(null)
  const [headlightsOn, setHeadlightsOn] = useState(false)
  const [engineOn, setEngineOn] = useState(false)
  const [freeRoamActive, setFreeRoamActive] = useState(false)
  const [hoodOpen, setHoodOpen] = useState(false)
  const [driveDirection, setDriveDirection] = useState({ throttle: null, steering: null })

  useEffect(() => {
    if (loadingProgress >= 100) {
      setTimeout(() => setIsLoaded(true), 500)
    }
  }, [loadingProgress])

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
    if (engineOn) {
      setDriveDirection(prev => ({
        ...prev,
        [type]: isActive ? direction : null
      }))
    }
  }

  return (
    <>
      <LoadingScreen progress={loadingProgress} isLoaded={isLoaded} />
      
      <Container ref={containerRef}>
        <Navbar />
        
        <CanvasContainer $freeRoamActive={freeRoamActive}>
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
            <color attach="background" args={['#0a0a0a']} />
            <Suspense fallback={null}>
              <LoadingProgress onProgress={setLoadingProgress} />
              <Scene 
                scrollProgressRef={scrollProgressRef}
                dnaMode={dnaMode}
                carColor={carColor}
                headlightsOn={headlightsOn}
                freeRoamActive={freeRoamActive}
                hoodOpen={hoodOpen}
                driveDirection={driveDirection}
              />
            </Suspense>
          </Canvas>
        </CanvasContainer>
        
        <SectionsContainer>
          <HeroSection id="hero" />
          <EngineSection id="engine" scrollProgressRef={scrollProgressRef} onEngineStart={handleEngineStart} headlightsOn={headlightsOn} />
          <SuspensionSection id="suspension" onModeChange={handleModeChange} />
          <WheelsSection id="wheels" />
          <InteriorSection id="interior" />
          <EngineBaySection id="enginebay" onHoodToggle={handleHoodToggle} hoodOpen={hoodOpen} />
          <GallerySection id="gallery" onColorChange={handleColorChange} />
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
          <ContactSection id="contact" />
          <FooterSection id="footer" />
        </SectionsContainer>
      </Container>
    </>
  )
}
