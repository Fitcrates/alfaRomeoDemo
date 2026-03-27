import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { 
  getCarConfig, 
  createPhysicsState, 
  updateCarPhysics, 
  exportCarState 
} from '../CarModel/carPhysics'
import { 
  configureCarMaterials, 
  applyCarColor, 
  updateHoodTransparency, 
  updateWheelVisuals, 
  resetWheels,
  updateIdleWheels 
} from '../CarModel/carMaterials'

/**
 * CarModel Component
 *
 * Renders the Alfa Romeo Giulia 3D model with lighting effects.
 * Physics logic separated to carPhysics.js
 * Material configuration separated to carMaterials.js
 */
export default function CarModel({
  carPosition = [0, -0.8, 0],
  carRotation = 0,
  carColor = null,
  headlightsOn = false,
  freeRoamActive = false,
  hoodOpen = false,
  driveDirectionRef = null,
  carPositionRef = null,
  trackColliders = [],
  terrainMeshes = [],
  terrainTuning = null,
  driveMode = 'dynamic',
}) {
  const groupRef = useRef()
  const modelRef = useRef()
  const lightsRef = useRef({ front: [], rear: [], emissiveMaterials: [] })
  const hoodMaterialsRef = useRef([])
  const vehicleLightsRef = useRef()
  // Light refs (for intensity)
  const leftHeadlightRef = useRef()
  const rightHeadlightRef = useRef()
  const leftFrontSpillRef = useRef()
  const rightFrontSpillRef = useRef()
  const leftTaillightRef = useRef()
  const rightTaillightRef = useRef()
  const leftRearSpillRef = useRef()
  const rightRearSpillRef = useRef()
  
  // Light target refs (for direction)
  const leftHeadlightTargetRef = useRef()
  const rightHeadlightTargetRef = useRef()
  const leftFrontSpillTargetRef = useRef()
  const rightFrontSpillTargetRef = useRef()
  const leftRearSpillTargetRef = useRef()
  const rightRearSpillTargetRef = useRef()
  
  // Emissive mesh refs (for bloom)
  const leftLensFlareRef = useRef()
  const rightLensFlareRef = useRef()
  const leftRearFlareRef = useRef()
  const rightRearFlareRef = useRef()
  const leftRearFlare2Ref = useRef()
  const rightRearFlare2Ref = useRef()
  const wheelsRef = useRef([])
  const wheelRotationRef = useRef(0)
  const FLOOR_Y = -0.78
  const raycasterRef = useRef(new THREE.Raycaster())
  const terrainRaycasterRef = useRef(new THREE.Raycaster())
  const collisionFrameRef = useRef(0)

  // Terrain raycasting vectors
  const _terrainRayOrigin = useRef(new THREE.Vector3())
  const _terrainRayDown = useRef(new THREE.Vector3(0, -1, 0))
  const _terrainNormal = useRef(new THREE.Vector3())
  const terrainFrameRef = useRef(0)
  const _smoothedTerrainY = useRef(null)
  const _smoothedPitch = useRef(0)
  const _slopeFrame = useRef(0)

  // Multi-ray terrain vectors
  const _cornerResults = useRef([null, null, null, null])

  // Physics state
  const carPhysicsRef = useRef(createPhysicsState())

  // Light level refs (moved outside useFrame to fix hook error)
  const headlightLevelRef = useRef(0)
  const brakeLightLevelRef = useRef(0)

  // Key state
  const spacePressed = useRef(false)
  const wPressed = useRef(false)
  const sPressed = useRef(false)

  // Get config with drive mode
  const config = getCarConfig(driveMode)

  // Terrain config
  const TERRAIN_DEFAULTS = {
    terrainRaycastModulo: 2,
    collisionRaycastModulo: 3,
    slopeRaycastModulo: 2,
    maxStepUp: 4.0,
    maxPitchDeg: 0,
    minTerrainNormalY: 0.5,
    enableSlopePitch: false,
    maxSurfaceDeltaFromExpected: Infinity,
    maxRisePerSecond: Infinity,
    maxFallPerSecond: Infinity,
    minYClamp: -6,
    maxYClamp: 8,
    disableTerrainFollow: false,
    fixedRideY: null,
    enableHeadlightShadows: true,
  }
  const terrainConfig = { ...TERRAIN_DEFAULTS, ...(terrainTuning || {}) }

  // Load GLTF
  const { scene, animations } = useGLTF('/models/giulia.glb')

  // Key handlers
  useEffect(() => {
    const onD = (e) => {
      // Prevent Space from triggering browser shortcuts and don't let it bubble
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        spacePressed.current = true
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') wPressed.current = true
      if (e.code === 'KeyS' || e.code === 'ArrowDown') sPressed.current = true
    }
    const onU = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        spacePressed.current = false
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') wPressed.current = false
      if (e.code === 'KeyS' || e.code === 'ArrowDown') sPressed.current = false
    }
    // Only reset keys on actual tab switch, not window blur (which fires randomly during gameplay)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        spacePressed.current = false
        wPressed.current = false
        sPressed.current = false
      }
    }

    window.addEventListener('keydown', onD)
    window.addEventListener('keyup', onU)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('keydown', onD)
      window.removeEventListener('keyup', onU)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Current values for interpolation
  const currentValues = useRef({
    rotationY: carRotation,
    positionX: carPosition[0],
    positionY: carPosition[1],
    positionZ: carPosition[2],
  })
  const basePositionRef = useRef(carPosition)
  const baseRotationRef = useRef(carRotation)

  useEffect(() => {
    basePositionRef.current = carPosition
    baseRotationRef.current = carRotation
  }, [carPosition, carRotation])

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(carPosition[0], carPosition[1], carPosition[2])
      groupRef.current.rotation.order = 'YXZ'
      groupRef.current.rotation.y = carRotation
    }
  }, [])

  // Setup model
  useEffect(() => {
    if (!scene || !modelRef.current) return

    while (modelRef.current.children.length > 0) {
      modelRef.current.remove(modelRef.current.children[0])
    }
    lightsRef.current = { front: [], rear: [], emissiveMaterials: [] }
    hoodMaterialsRef.current = []
    wheelsRef.current = []

    const model = scene.clone(true)
    const { hoodMaterialsRef: hoodMats, wheelsRef: wheelMeshes } = configureCarMaterials(model)
    hoodMaterialsRef.current = hoodMats
    wheelsRef.current = wheelMeshes

    // Scale and position
    model.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? 5.2 / maxDim : 1

    const wrapper = new THREE.Group()
    wrapper.add(model)
    wrapper.scale.setScalar(scale)
    wrapper.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    modelRef.current.add(wrapper)

    lightsRef.current.scale = scale
    lightsRef.current.wrapper = wrapper
  }, [scene])

  // Hood open ref
  const hoodOpenRef = useRef(hoodOpen)
  useEffect(() => { hoodOpenRef.current = hoodOpen }, [hoodOpen])

  // Setup light targets - run after render when refs are available
  useEffect(() => {
    // Use setTimeout to ensure all refs are populated after render
    const timer = setTimeout(() => {
      if (leftHeadlightRef.current && leftHeadlightTargetRef.current) {
        leftHeadlightRef.current.target = leftHeadlightTargetRef.current
      }
      if (rightHeadlightRef.current && rightHeadlightTargetRef.current) {
        rightHeadlightRef.current.target = rightHeadlightTargetRef.current
      }
      if (leftFrontSpillRef.current && leftFrontSpillTargetRef.current) {
        leftFrontSpillRef.current.target = leftFrontSpillTargetRef.current
      }
      if (rightFrontSpillRef.current && rightFrontSpillTargetRef.current) {
        rightFrontSpillRef.current.target = rightFrontSpillTargetRef.current
      }
      if (leftRearSpillRef.current && leftRearSpillTargetRef.current) {
        leftRearSpillRef.current.target = leftRearSpillTargetRef.current
      }
      if (rightRearSpillRef.current && rightRearSpillTargetRef.current) {
        rightRearSpillRef.current.target = rightRearSpillTargetRef.current
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Apply car color
  useEffect(() => {
    if (!carColor || !modelRef.current) return
    applyCarColor(modelRef.current, carColor)
  }, [carColor])

  // Main update loop
  useFrame((state, dt) => {
    if (!groupRef.current) return

    const delta = Math.min(dt, 0.05)
    const current = currentValues.current
    const lerpSpeed = 6
    const lerpFactor = 1 - Math.exp(-lerpSpeed * delta)

    // Return to base position when not in free roam
    if (!freeRoamActive) {
      current.rotationY += (baseRotationRef.current - current.rotationY) * lerpFactor
      current.positionX += (basePositionRef.current[0] - current.positionX) * lerpFactor
      current.positionY += (basePositionRef.current[1] - current.positionY) * lerpFactor
      current.positionZ += (basePositionRef.current[2] - current.positionZ) * lerpFactor
    }

    // Light transitions
    const targetHeadlightLevel = headlightsOn ? 1 : 0
    headlightLevelRef.current += (targetHeadlightLevel - headlightLevelRef.current) * lerpFactor

    const throttleInputLocal = driveDirectionRef?.current?.throttle === 'backward' ? -1 : 
                               driveDirectionRef?.current?.throttle === 'forward' ? 1 : 0
    const isBraking = throttleInputLocal === -1 && (carPhysicsRef.current?.speed || 0) > -0.1
    const targetBrakeLevel = isBraking ? 1 : 0
    brakeLightLevelRef.current += (targetBrakeLevel - brakeLightLevelRef.current) * (lerpFactor * 2.5)

    // Update lights - both actual lights and emissive mesh materials for bloom
    const frontGlowIntensity = headlightLevelRef.current * 8
    const baseRearGlow = headlightLevelRef.current * 12
    const brakeGlow = brakeLightLevelRef.current * 30
    const rearGlowIntensity = Math.max(baseRearGlow, brakeGlow)
    const frontGlowOpacity = headlightLevelRef.current
    const rearGlowOpacity = Math.max(headlightLevelRef.current, brakeLightLevelRef.current)

    // Update spotLight intensities (headlights)
    if (leftHeadlightRef.current) {
      leftHeadlightRef.current.intensity = 22 * headlightLevelRef.current
    }
    if (rightHeadlightRef.current) {
      rightHeadlightRef.current.intensity = 22 * headlightLevelRef.current
    }

    // Update front spill lights
    if (leftFrontSpillRef.current) {
      leftFrontSpillRef.current.intensity = 15 * headlightLevelRef.current
    }
    if (rightFrontSpillRef.current) {
      rightFrontSpillRef.current.intensity = 15 * headlightLevelRef.current
    }

    // Update pointLight intensities (taillights)
    if (leftTaillightRef.current) {
      leftTaillightRef.current.intensity = Math.max(0.4 * headlightLevelRef.current, 2.0 * brakeLightLevelRef.current)
    }
    if (rightTaillightRef.current) {
      rightTaillightRef.current.intensity = Math.max(0.4 * headlightLevelRef.current, 2.0 * brakeLightLevelRef.current)
    }

    // Update rear spill spotLight intensities
    if (leftRearSpillRef.current) {
      leftRearSpillRef.current.intensity = Math.max(9.8 * headlightLevelRef.current, 20.0 * brakeLightLevelRef.current)
    }
    if (rightRearSpillRef.current) {
      rightRearSpillRef.current.intensity = Math.max(9.8 * headlightLevelRef.current, 20.0 * brakeLightLevelRef.current)
    }

    // Update light targets to follow car movement
    if (leftFrontSpillTargetRef.current && rightFrontSpillTargetRef.current) {
      leftFrontSpillTargetRef.current.updateMatrixWorld()
      rightFrontSpillTargetRef.current.updateMatrixWorld()
    }
    if (leftRearSpillTargetRef.current && rightRearSpillTargetRef.current) {
      leftRearSpillTargetRef.current.updateMatrixWorld()
      rightRearSpillTargetRef.current.updateMatrixWorld()
    }

    // Update emissive mesh materials for bloom effect
    if (leftLensFlareRef.current?.material) {
      leftLensFlareRef.current.material.emissiveIntensity = frontGlowIntensity
      leftLensFlareRef.current.material.opacity = frontGlowOpacity
    }
    if (rightLensFlareRef.current?.material) {
      rightLensFlareRef.current.material.emissiveIntensity = frontGlowIntensity
      rightLensFlareRef.current.material.opacity = frontGlowOpacity
    }
    if (leftRearFlareRef.current?.material) {
      leftRearFlareRef.current.material.emissiveIntensity = rearGlowIntensity
      leftRearFlareRef.current.material.opacity = rearGlowOpacity
    }
    if (rightRearFlareRef.current?.material) {
      rightRearFlareRef.current.material.emissiveIntensity = rearGlowIntensity
      rightRearFlareRef.current.material.opacity = rearGlowOpacity
    }
    if (leftRearFlare2Ref.current?.material) {
      leftRearFlare2Ref.current.material.emissiveIntensity = rearGlowIntensity
      leftRearFlare2Ref.current.material.opacity = rearGlowOpacity
    }
    if (rightRearFlare2Ref.current?.material) {
      rightRearFlare2Ref.current.material.emissiveIntensity = rearGlowIntensity
      rightRearFlare2Ref.current.material.opacity = rearGlowOpacity
    }

    // Hood transparency
    const targetOpacity = hoodOpenRef.current ? 0.05 : 1.0
    updateHoodTransparency(hoodMaterialsRef.current, targetOpacity, delta)

    // Physics update
    if (wheelsRef.current.length > 0 && freeRoamActive) {
      const group = groupRef.current
      const physics = carPhysicsRef.current

      // Input
      let throttleInput = 0
      let steeringInput = 0
      const driveDir = driveDirectionRef?.current || { throttle: null, steering: null }
      if (driveDir.throttle === 'forward') throttleInput = 1
      else if (driveDir.throttle === 'backward') throttleInput = -1
      if (driveDir.steering === 'left') steeringInput = 1
      else if (driveDir.steering === 'right') steeringInput = -1

      const isBurnout = wPressed.current && sPressed.current
      if (isBurnout) throttleInput = 0

      const handbrakeActive = spacePressed.current

      // Update physics
      const physicsResult = updateCarPhysics({
        physics,
        config,
        group,
        delta,
        throttleInput,
        steeringInput,
        handbrakeActive,
        isBurnout,
        terrainConfig,
        carPosition,
      })

      // Collision detection - check for barriers
      if (Math.abs(physics.velX) > 0.001 || Math.abs(physics.velZ) > 0.001) {
        const dx = physics.velX * delta
        const dz = physics.velZ * delta
        let collision = false

        collisionFrameRef.current++
        const collisionModulo = terrainConfig.collisionRaycastModulo || 6
        const collisionDistance = terrainConfig.collisionDistance || 1.5
        const collisionBounce = terrainConfig.collisionBounce || 0.6
        
        if (trackColliders?.length > 0 && Math.abs(physics.speed) > 0.5 && 
            collisionFrameRef.current % collisionModulo === 0) {
          const forwardDir = new THREE.Vector3(dx, 0, dz).normalize()
          const rayOrigin = new THREE.Vector3(group.position.x, group.position.y + 0.5, group.position.z)
          
          raycasterRef.current.set(rayOrigin, forwardDir)
          raycasterRef.current.far = collisionDistance
          const intersects = raycasterRef.current.intersectObjects(trackColliders, false)
          
          if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
            collision = true
            // Bounce back with configurable strength
            physics.velX *= -collisionBounce
            physics.velZ *= -collisionBounce
            physics.forwardSpeed *= collisionBounce
            physics.lateralSpeed *= collisionBounce
            // Push car back from barrier
            const pushBack = Math.min(0.2, intersects[0].distance * 0.5)
            group.position.x -= forwardDir.x * pushBack
            group.position.z -= forwardDir.z * pushBack
          }
        }

        if (!collision) {
          group.position.x += dx
          group.position.z += dz
        }
      }

      // Terrain following
      const terrainTargets = terrainMeshes?.length > 0 ? terrainMeshes : 
                            trackColliders?.length > 0 ? trackColliders : null
      const FALLBACK_Y = -0.8
      // Use terrain config ride height if provided, otherwise default to 5cm clearance
      const CAR_RIDE_HEIGHT = terrainConfig.carRideHeight ?? 0.05

      if (terrainConfig.disableTerrainFollow) {
        group.position.y = terrainConfig.fixedRideY ?? carPosition?.[1] ?? FALLBACK_Y
        _smoothedTerrainY.current = group.position.y - CAR_RIDE_HEIGHT
      } else if (terrainTargets) {
        terrainFrameRef.current++
        const shouldSample = _smoothedTerrainY.current === null || 
                            terrainFrameRef.current % terrainConfig.terrainRaycastModulo === 0

        if (!shouldSample) {
          group.position.y = _smoothedTerrainY.current + CAR_RIDE_HEIGHT
        } else {
          // Multi-ray terrain
          if (terrainConfig.useMultiRayTerrain) {
            const carWidth = 1.8
            const carLength = 2.4
            const sinY = Math.sin(group.rotation.y)
            const cosY = Math.cos(group.rotation.y)
            const corners = [
              { x: carWidth, z: carLength },
              { x: -carWidth, z: carLength },
              { x: carWidth, z: -carLength },
              { x: -carWidth, z: -carLength },
            ]
            let minY = Infinity
            let hitCount = 0

            for (let i = 0; i < 4; i++) {
              const corner = corners[i]
              const worldX = group.position.x + corner.x * cosY - corner.z * sinY
              const worldZ = group.position.z + corner.x * sinY + corner.z * cosY
              _terrainRayOrigin.current.set(worldX, group.position.y + 5, worldZ)
              terrainRaycasterRef.current.set(_terrainRayOrigin.current, _terrainRayDown.current)
              terrainRaycasterRef.current.far = 15
              const hits = terrainRaycasterRef.current.intersectObjects(terrainTargets, false)
              _cornerResults.current[i] = hits.length > 0 ? hits[0] : null
              if (hits.length > 0 && hits[0].point.y < minY) {
                minY = hits[0].point.y
                hitCount++
              }
            }

            if (hitCount > 0 && minY < Infinity) {
              const expectedY = _smoothedTerrainY.current ?? group.position.y
              if (minY - expectedY < (terrainConfig.maxStepUp || 1.5)) {
                _smoothedTerrainY.current = minY
                group.position.y = minY + CAR_RIDE_HEIGHT
              }
            }
          }

          // Single ray fallback
          _terrainRayOrigin.current.set(group.position.x, group.position.y + 5, group.position.z)
          terrainRaycasterRef.current.set(_terrainRayOrigin.current, _terrainRayDown.current)
          terrainRaycasterRef.current.far = 15
          const terrainHits = terrainRaycasterRef.current.intersectObjects(terrainTargets, false)

          if (terrainHits.length > 0) {
            const MAX_STEP_UP = terrainConfig.maxStepUp
            const expectedY = _smoothedTerrainY.current ?? (group.position.y - CAR_RIDE_HEIGHT)

            let bestHit = null
            let bestDist = Infinity
            for (let i = 0; i < terrainHits.length; i++) {
              const hit = terrainHits[i]
              if (hit.face) {
                _terrainNormal.current.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
                if (_terrainNormal.current.y < 0.2) continue
              }
              const hy = hit.point.y
              if (hy > expectedY + MAX_STEP_UP) continue
              const d = Math.abs(hy - expectedY)
              if (d > terrainConfig.maxSurfaceDeltaFromExpected) continue
              if (d < bestDist) {
                bestDist = d
                bestHit = hit
              }
            }

            if (bestHit) {
              const surfaceY = bestHit.point.y
              if (_smoothedTerrainY.current === null) _smoothedTerrainY.current = surfaceY

              // Ignore tiny surface variations to prevent micro-oscillations
              // But don't ignore if car is below surface (negative delta)
              const minDeltaThreshold = 0.01 // 1cm minimum change to react
              const heightDelta = surfaceY - _smoothedTerrainY.current
              
              // Only skip update if change is tiny positive (car is above surface and barely moving)
              // Always update if car is below surface (heightDelta < 0)
              if (heightDelta > 0 && heightDelta < minDeltaThreshold) {
                // Keep current Y, don't react to tiny variations
                group.position.y = _smoothedTerrainY.current + CAR_RIDE_HEIGHT
              } else {
                // Curb handling
                const curbThreshold = terrainConfig.curbHeightThreshold || 0.35
                const isCurb = heightDelta > 0 && heightDelta <= curbThreshold
                const goingDown = surfaceY < _smoothedTerrainY.current
                // Much slower lerp for smooth terrain following - prevents micro oscillations
                const terrainLerpSpeed = isCurb ? (goingDown ? 8 : 6) : goingDown ? 12 : 8
                const terrainLerpFactor = 1 - Math.exp(-terrainLerpSpeed * delta)
                let nextTerrainY = THREE.MathUtils.lerp(_smoothedTerrainY.current, surfaceY, terrainLerpFactor)

                const maxRise = terrainConfig.maxRisePerSecond * delta
                const maxFall = terrainConfig.maxFallPerSecond * delta
                const deltaY = nextTerrainY - _smoothedTerrainY.current
                if (deltaY > maxRise) nextTerrainY = _smoothedTerrainY.current + maxRise
                else if (deltaY < -maxFall) nextTerrainY = _smoothedTerrainY.current - maxFall

                _smoothedTerrainY.current = nextTerrainY
                // Ensure car stays at or above surface (never below)
                const targetY = _smoothedTerrainY.current + CAR_RIDE_HEIGHT
                group.position.y = Math.max(group.position.y, targetY)
              }
            }
          } else {
            _smoothedTerrainY.current = null
            group.position.y = FALLBACK_Y
          }
        }
      } else {
        _smoothedTerrainY.current = null
        group.position.y = FALLBACK_Y
      }

      // Terrain pitch
      _slopeFrame.current++
      if (!terrainConfig.disableTerrainFollow && terrainConfig.enableSlopePitch && terrainTargets && 
          _smoothedTerrainY.current !== null && _slopeFrame.current % terrainConfig.slopeRaycastModulo === 0) {
        const AXLE_DIST = 2.2
        const sinY = Math.sin(group.rotation.y)
        const cosY = Math.cos(group.rotation.y)
        const slopeFar = 16

        _terrainRayOrigin.current.set(group.position.x + sinY * AXLE_DIST, group.position.y + 8, group.position.z + cosY * AXLE_DIST)
        terrainRaycasterRef.current.set(_terrainRayOrigin.current, _terrainRayDown.current)
        terrainRaycasterRef.current.far = slopeFar
        const fHits = terrainRaycasterRef.current.intersectObjects(terrainTargets, false)

        _terrainRayOrigin.current.set(group.position.x - sinY * AXLE_DIST, group.position.y + 8, group.position.z - cosY * AXLE_DIST)
        terrainRaycasterRef.current.set(_terrainRayOrigin.current, _terrainRayDown.current)
        const rHits = terrainRaycasterRef.current.intersectObjects(terrainTargets, false)

        const cY = _smoothedTerrainY.current
        const pickY = (hits) => {
          for (let i = 0; i < hits.length; i++) {
            if (!hits[i].face) return hits[i].point.y
            _terrainNormal.current.copy(hits[i].face.normal).transformDirection(hits[i].object.matrixWorld)
            if (_terrainNormal.current.y >= terrainConfig.minTerrainNormalY) return hits[i].point.y
          }
          return cY
        }
        const fY = pickY(fHits)
        const rY = pickY(rHits)
        const targetPitch = Math.atan2(fY - rY, AXLE_DIST * 2)
        const pitchLerp = 1 - Math.exp(-10 * delta)
        _smoothedPitch.current = THREE.MathUtils.lerp(_smoothedPitch.current, targetPitch, pitchLerp)
      }

      const MAX_PITCH = THREE.MathUtils.degToRad(terrainConfig.maxPitchDeg)
      group.rotation.x = THREE.MathUtils.clamp(-_smoothedPitch.current, -MAX_PITCH, MAX_PITCH)

      // Body roll
      const MAX_ROLL = THREE.MathUtils.degToRad(3)
      const currentRoll = physics.rollAngle || 0
      group.rotation.z = THREE.MathUtils.clamp(currentRoll, -MAX_ROLL, MAX_ROLL)

      // Safety clamp
      if (!Number.isFinite(group.position.x) || !Number.isFinite(group.position.y) || !Number.isFinite(group.position.z) ||
          !Number.isFinite(physics.velX) || !Number.isFinite(physics.velZ) ||
          group.position.y < terrainConfig.minYClamp || group.position.y > terrainConfig.maxYClamp) {
        group.position.set(carPosition?.[0] ?? 0, carPosition?.[1] ?? FALLBACK_Y, carPosition?.[2] ?? 0)
        _smoothedTerrainY.current = group.position.y
        physics.velX = 0
        physics.velZ = 0
        physics.speed = 0
        _smoothedPitch.current = 0
        group.rotation.x = 0
      }

      // Export state
      if (carPositionRef) {
        carPositionRef.current = exportCarState({
          physics,
          group,
          handbrakeActive,
          isBurnout,
          config,
          slipAngle: physicsResult?.slipAngle,
        })
      }

      // Wheel visuals
      updateWheelVisuals(wheelsRef.current, physics, isBurnout, delta)

    } else if (headlightsOn && wheelsRef.current.length > 0) {
      // Idle wheels
      updateIdleWheels(wheelsRef.current, delta)
    } else {
      resetWheels(wheelsRef.current)
    }

    // Floor fallback
    if (freeRoamActive && groupRef.current && (!trackColliders?.length) && (!terrainMeshes?.length)) {
      groupRef.current.position.y = -0.8
    }

    // Apply position/rotation when not in free roam
    if (!freeRoamActive) {
      groupRef.current.rotation.y = current.rotationY
      groupRef.current.position.set(current.positionX, current.positionY, current.positionZ)
    }
  })

  const handleMeshClick = (e) => {
    e.stopPropagation()
  }

  return (
    <group ref={groupRef}>
      {/* Light targets */}
      <group ref={vehicleLightsRef}>
        <object3D ref={leftHeadlightTargetRef} position={[-1.18, -1.05, 14]} />
        <object3D ref={rightHeadlightTargetRef} position={[1.18, -1.05, 14]} />
        <object3D ref={leftFrontSpillTargetRef} position={[-0.9, FLOOR_Y, 6.2]} />
        <object3D ref={rightFrontSpillTargetRef} position={[0.9, FLOOR_Y, 6.2]} />
        <object3D ref={leftRearSpillTargetRef} position={[-1.9, FLOOR_Y, -4.6]} />
        <object3D ref={rightRearSpillTargetRef} position={[1.9, FLOOR_Y, -4.6]} />
      </group>

      {/* Headlights - spot lights */}
      <spotLight
        ref={leftHeadlightRef}
        position={[-0.86, 0.74, 2.32]}
        angle={0.17}
        penumbra={0.92}
        distance={34}
        decay={1}
        color="#e7edf8"
        castShadow={terrainConfig.enableHeadlightShadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00012}
      />
      <spotLight
        ref={rightHeadlightRef}
        position={[0.86, 0.74, 2.32]}
        angle={0.17}
        penumbra={0.42}
        distance={34}
        decay={0.5}
        color="#f3f0e6"
        castShadow={terrainConfig.enableHeadlightShadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00012}
      />

      {/* Front spill lights */}
      <spotLight
        ref={leftFrontSpillRef}
        position={[-0.86, 0.74, 2.34]}
        angle={0.42}
        penumbra={1}
        distance={15}
        decay={1}
        color="#e7edf8"
      />
      <spotLight
        ref={rightFrontSpillRef}
        position={[0.86, 0.74, 2.34]}
        angle={0.42}
        penumbra={1}
        distance={15}
        decay={0.5}
        color="#e7edf8"
      />

      {/* Taillights - point lights */}
      <pointLight
        ref={leftTaillightRef}
        position={[-1.74, 1.92, -2.22]}
        distance={1.8}
        decay={2}
        color="#ff2316"
      />
      <pointLight
        ref={rightTaillightRef}
        position={[1.74, 1.92, -2.22]}
        distance={1.8}
        decay={2}
        color="#ff2316"
      />

      {/* Rear spill spot lights */}
      <spotLight
        ref={leftRearSpillRef}
        target={leftRearSpillTargetRef.current}
        position={[-0.64, 0.96, -2.32]}
        angle={0.72}
        penumbra={1}
        distance={11}
        decay={0.8}
        color="#ff2a1c"
      />
      <spotLight
        ref={rightRearSpillRef}
        target={rightRearSpillTargetRef.current}
        position={[0.64, 0.96, -2.32]}
        angle={0.72}
        penumbra={1}
        distance={11}
        decay={0.8}
        color="#ff2a1c"
      />

      {/* Bloom Glow Spheres - emissive meshes that trigger bloom post-processing */}
      {/* Front Left Headlight */}
      <mesh ref={leftLensFlareRef} position={[-0.78, 0.72, 2.28]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#e8f4ff"
          emissiveIntensity={0}
          toneMapped={false}
          transparent={true}
          opacity={0}
        />
      </mesh>

      {/* Front Right Headlight */}
      <mesh ref={rightLensFlareRef} position={[0.78, 0.72, 2.28]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#e8f4ff"
          emissiveIntensity={0}
          toneMapped={false}
          transparent={true}
          opacity={0}
        />
      </mesh>

      {/* Rear Left Taillight - LED strip shape */}
      <mesh ref={leftRearFlareRef} position={[-0.54, 1, -2.45]} rotation={[0, 0.39, -0.02]}>
        <boxGeometry args={[0.3, 0.01, 0.02]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#ff2010"
          emissiveIntensity={0}
          toneMapped={false}
          transparent={true}
          opacity={0}
        />
      </mesh>

      {/* Rear Right Taillight - LED strip shape */}
      <mesh ref={rightRearFlareRef} position={[0.54, 1, -2.45]} rotation={[0, -0.39, 0.02]}>
        <boxGeometry args={[0.3, 0.01, 0.02]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#ff2010"
          emissiveIntensity={0}
          toneMapped={false}
          transparent={true}
          opacity={0}
        />
      </mesh>

      {/* Rear Left Taillight - Curved side strip */}
      <mesh ref={leftRearFlare2Ref} position={[-0.8, 1, -2.278]} rotation={[0, 0.72, 0]}>
        <boxGeometry args={[0.27, 0.01, 0.02]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#ff2010"
          emissiveIntensity={0}
          toneMapped={false}
          transparent={true}
          opacity={0}
        />
      </mesh>

      {/* Rear Right Taillight - Curved side strip */}
      <mesh ref={rightRearFlare2Ref} position={[0.8, 1, -2.278]} rotation={[0, -0.72, 0]}>
        <boxGeometry args={[0.27, 0.01, 0.02]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#ff2010"
          emissiveIntensity={0}
          toneMapped={false}
          transparent={true}
          opacity={0}
        />
      </mesh>

      <group ref={modelRef} onClick={handleMeshClick} />
    </group>
  )
}