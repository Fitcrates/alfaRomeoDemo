import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { damp } from 'maath/easing'

/**
 * CarModel Component
 *
 * Renders the Alfa Romeo Giulia 3D model with lighting effects.
 *
 * @param {Array} carPosition - [x, y, z] Fixed position of the car
 * @param {number} carRotation - Y-axis rotation in radians
 * @param {string} carColor - Hex color for car paint
 * @param {boolean} headlightsOn - Whether headlights are on
 * @param {boolean} freeRoamActive - Whether free roam mode is active
 * @param {boolean} hoodOpen - Whether hood transparency is active
 * @param {object} driveDirectionRef - Ref with { throttle, steering } for drive input
 * @param {object} carPositionRef - Ref to share car position/speed with camera
 * @param {Array} trackColliders - Prop for wall/barrier collision meshes
 * @param {Array} terrainMeshes - Prop for road/ground meshes used for terrain-following raycast
 * @param {string} driveMode - DNA drive mode: 'efficient', 'natural', 'dynamic', 'race'
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
  const leftHeadlightRef = useRef()
  const rightHeadlightRef = useRef()
  const leftHeadlightTargetRef = useRef()
  const rightHeadlightTargetRef = useRef()
  const leftFrontSpillRef = useRef()
  const rightFrontSpillRef = useRef()
  const leftFrontSpillTargetRef = useRef()
  const rightFrontSpillTargetRef = useRef()
  const leftTaillightRef = useRef()
  const rightTaillightRef = useRef()
  const leftRearSpillRef = useRef()
  const rightRearSpillRef = useRef()
  const leftRearSpillTargetRef = useRef()
  const rightRearSpillTargetRef = useRef()
  const headlightLevelRef = useRef(0)
  const brakeLightLevelRef = useRef(0)
  const leftLensFlareRef = useRef()
  const rightLensFlareRef = useRef()
  const leftRearFlareRef = useRef()
  const rightRearFlareRef = useRef()
  const leftRearFlare2Ref = useRef()
  const rightRearFlare2Ref = useRef()
  const wheelsRef = useRef([]) // Store wheel mesh references
  const frontWheelsRef = useRef([]) // Front wheels (for steering)
  const rearWheelsRef = useRef([]) // Rear wheels
  const wheelRotationRef = useRef(0)
  const raycasterRef = useRef(new THREE.Raycaster())
  const terrainRaycasterRef = useRef(new THREE.Raycaster())
  const collisionFrameRef = useRef(0)

  // Pre-allocate reusable vectors to avoid GC pressure every frame
  const _forwardDir = useRef(new THREE.Vector3())
  const _rayDir = useRef(new THREE.Vector3())
  const _rayOrigin = useRef(new THREE.Vector3())

  // Terrain raycasting vectors
  const _terrainRayOrigin = useRef(new THREE.Vector3())
  const _terrainRayDown = useRef(new THREE.Vector3(0, -1, 0))
  const _terrainNormal = useRef(new THREE.Vector3())
  const terrainFrameRef = useRef(0)
  // Smoothed terrain Y to prevent jitter on mesh seams
  const _smoothedTerrainY = useRef(null)
  // Smoothed pitch (X rotation) to match terrain slope
  const _smoothedPitch = useRef(0)
  // Frame counter to throttle expensive slope raycasts
  const _slopeFrame = useRef(0)

  const carPhysicsRef = useRef({
    velX: 0,
    velZ: 0,
    speed: 0,
    steeringAngle: 0, // Current wheel angle in radians
    targetSteering: 0, // Target steering from input
  })

  // Handbrake + burnout key state
  const spacePressed = useRef(false)
  const wPressed = useRef(false)
  const sPressed = useRef(false)
  useEffect(() => {
    const onD = (e) => {
      if (e.code === 'Space') spacePressed.current = true
      if (e.code === 'KeyW' || e.code === 'ArrowUp')
        wPressed.current = true
      if (e.code === 'KeyS' || e.code === 'ArrowDown')
        sPressed.current = true
    }
    const onU = (e) => {
      if (e.code === 'Space') spacePressed.current = false
      if (e.code === 'KeyW' || e.code === 'ArrowUp')
        wPressed.current = false
      if (e.code === 'KeyS' || e.code === 'ArrowDown')
        sPressed.current = false
    }

    // Release all internal key states when the window loses focus.
    // Without this, alt-tab or DevTools opening mid-drive leaves
    // spacePressed / wPressed / sPressed stuck true indefinitely.
    const resetOnBlur = () => {
      spacePressed.current = false
      wPressed.current = false
      sPressed.current = false
    }
    const handleVisibilityChange = () => {
      if (document.hidden) resetOnBlur()
    }

    window.addEventListener('keydown', onD)
    window.addEventListener('keyup', onU)
    window.addEventListener('blur', resetOnBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('keydown', onD)
      window.removeEventListener('keyup', onU)
      window.removeEventListener('blur', resetOnBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      resetOnBlur()
    }
  }, [])

  // Car configuration (Giulia wheelbase ~2.82m)
  // DNA drive mode profiles
  const DRIVE_MODES = {
    efficient: {
      maxSpeed: 66,
      acceleration: 5,
      braking: 20,
      friction: 18,
      label: 'All Weather',
    },
    natural: {
      maxSpeed: 66,
      acceleration: 8,
      braking: 22,
      friction: 16,
      label: 'Natural',
    },
    dynamic: {
      maxSpeed: 66,
      acceleration: 11,
      braking: 25,
      friction: 14,
      label: 'Dynamic',
    },
    race: {
      maxSpeed: 66,
      acceleration: 15,
      braking: 30,
      friction: 12,
      label: 'Race',
    },
  }

  const CAR_CONFIG = {
    wheelbase: 4.52, // Distance between front and rear axles
    maxSteeringAngle: Math.PI / 6, // ~30 degrees at standstill — very tight turns
    minSteeringAngle: Math.PI / 24, // ~6.4 degrees at top speed — very stable
    maxSpeed: DRIVE_MODES[driveMode]?.maxSpeed || 35,
    acceleration: DRIVE_MODES[driveMode]?.acceleration || 8,
    braking: DRIVE_MODES[driveMode]?.braking || 25,
    friction: DRIVE_MODES[driveMode]?.friction || 15,
    steeringSpeed: 2,
    steeringReturnSpeed: 2,
  }

  // CAR_RIDE_HEIGHT: keep at 0 — the car bounding box positions tire bottoms
  // at y=0 of the group, so surfaceY+0 = tires exactly on the road.
  // A tiny positive value adds z-fight clearance but causes visible float.
  const CAR_RIDE_HEIGHT = 0.0

  // Fallback Y used when no terrain hit is found (e.g. flat drift track)
  const FALLBACK_Y = -0.8

  const FLOOR_Y = -0.78
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
  const terrainConfig = {
    ...TERRAIN_DEFAULTS,
    ...(terrainTuning || {}),
  }
  const { scene, animations } = useGLTF('/models/giulia.glb')

  // Debug: Check for animations and openable parts
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && scene) {
      console.log(
        '=== GLB ANIMATIONS ===',
        animations?.length || 0,
        animations
      )
      const openableParts = []
      scene.traverse((child) => {
        const name = (child.name || '').toLowerCase()
        if (
          name.includes('hood') ||
          name.includes('door') ||
          name.includes('trunk') ||
          name.includes('bonnet') ||
          name.includes('engine')
        ) {
          openableParts.push({ name: child.name, type: child.type })
        }
      })
      console.log('=== OPENABLE PARTS ===', openableParts)
    }
  }, [scene, animations])

  // Store current values for smooth interpolation (used in free roam)
  const currentValues = useRef({
    rotationY: carRotation,
    positionX: carPosition[0],
    positionY: carPosition[1],
    positionZ: carPosition[2],
  })

  // Base position/rotation refs for resetting after free roam
  const basePositionRef = useRef(carPosition)
  const baseRotationRef = useRef(carRotation)

  // Update base refs when props change
  useEffect(() => {
    basePositionRef.current = carPosition
    baseRotationRef.current = carRotation
  }, [carPosition, carRotation])

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(
        carPosition[0],
        carPosition[1],
        carPosition[2]
      )
      // YXZ order: heading first, then local pitch, then local roll.
      // This makes group.rotation.x behave as car-local pitch at any heading.
      groupRef.current.rotation.order = 'YXZ'
      groupRef.current.rotation.y = carRotation
    }
  }, []) // Initialize physical position properly on mount

  useEffect(() => {
    if (!scene || !modelRef.current) return

    // Clear previous
    while (modelRef.current.children.length > 0) {
      modelRef.current.remove(modelRef.current.children[0])
    }
    lightsRef.current = { front: [], rear: [], emissiveMaterials: [] }
    hoodMaterialsRef.current = []
    wheelsRef.current = []

    const model = scene.clone(true)

    // Setup materials and find exactly the light meshes
    model.traverse((child) => {
      if (child.isMesh) {
        const materialName = child.material?.name || ''
        const meshName = child.name || ''
        const isGlassLike = /glass|window|windshield/i.test(
          `${materialName} ${meshName}`
        )

        // Detect wheel meshes by material name and position
        if (
          materialName.includes('Wheel') ||
          materialName.includes('wheel')
        ) {
          // Get the wheel's position in model-local space (not world space)
          // This is stable regardless of camera or car rotation
          const localPos = child.position.clone()

          // Walk up the hierarchy to get position relative to model root
          let parent = child.parent
          while (parent && parent !== model) {
            localPos.applyMatrix4(parent.matrix)
            parent = parent.parent
          }

          // Store wheel metadata for later use
          child.userData.isFrontWheel = localPos.z > 0 // Front wheels have positive Z in model space
          child.userData.isLeftWheel = localPos.x < 0 // Left wheels have negative X
          // Store pure quaternion to fix rotation axis errors when combining local rolling + parent steering
          child.userData.initialQuaternion = child.quaternion.clone()

          wheelsRef.current.push(child)

          // Debug log wheel positions
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `Wheel: ${meshName}, localZ: ${localPos.z.toFixed(2)}, isFront: ${child.userData.isFrontWheel}, isLeft: ${child.userData.isLeftWheel}`
            )
          }
        }

        child.castShadow = !isGlassLike
        child.receiveShadow = !isGlassLike

        if (child.material) {
          child.material = child.material.clone()

          // CRITICAL FIX: Use DoubleSide for ALL materials to prevent interior disappearing
          // This matches Sketchfab/Blender default behavior
          child.material.side = THREE.DoubleSide

          // Fix transparent materials render order
          if (child.material.transparent) {
            child.material.depthWrite = true
          }

          const matName = child.material.name

          // FIX: Handle lamp glass materials specially
          // These use transmission in the original model but Three.js needs explicit configuration
          if (matName === 'red_glass') {
            // Red tinted plastic for rear lamps
            // ADJUSTMENT GUIDE:
            // - color: Base tint color (0xRRGGBB) - more red = 0xff0000, current is deep red
            // - opacity: 0.0 (invisible) to 1.0 (solid) - higher = less see-through
            // - transmission: 0.0 (opaque) to 1.0 (fully transmissive) - lower = more solid color
            // - thickness: Affects how light passes through - higher = more color saturation
            child.material.color.setHex(0xcc1010) // Deeper, more saturated red
            child.material.transparent = true
            child.material.opacity = 0.85 // Increased from 0.45 - less transparent
            child.material.roughness = 0.08
            child.material.metalness = 0
            child.material.transmission = 0.9 // Reduced from 0.85 - more solid red appearance
            child.material.thickness = 0.55 // Increased from 0.2 - richer color
            child.material.ior = 1.45
            child.material.depthWrite = false
            child.renderOrder = 10
          } else if (matName === 'orange_glass') {
            // Orange indicator glass - more transparent
            child.material.color.setHex(0xff7700)
            child.material.transparent = true
            child.material.opacity = 0.5
            child.material.roughness = 0.05
            child.material.metalness = 0
            child.material.transmission = 0.85
            child.material.thickness = 0.2
            child.material.ior = 1.45
            child.material.depthWrite = false
            child.renderOrder = 10
          } else if (matName === 'light_glass') {
            // Front headlight glass - very clear to show internal detail
            child.material.color.setHex(0xffffff)
            child.material.transparent = true
            child.material.opacity = 0.15
            child.material.roughness = 0.02
            child.material.metalness = 0
            child.material.transmission = 0.95
            child.material.thickness = 0.1
            child.material.ior = 1.5
            child.material.depthWrite = false
            child.renderOrder = 10
          }

          // FIX: Ensure interior materials render properly
          // Interior materials marked as transparent with opacity 1 need proper handling
          if (
            matName ===
            'QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017InteriorA_Material1' ||
            matName === 'color_Int'
          ) {
            // These are solid interior materials, not actually transparent
            child.material.transparent = false
            child.material.opacity = 1
            child.material.depthWrite = true
            child.material.envMapIntensity = 1.0
          }

          // Target exactly the materials that represent lights
          // Keep original material settings - we'll use lens flares instead of shader glow
          if (
            matName === 'emiss' ||
            matName ===
            'QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017LightA_Material1'
          ) {
            child.material.toneMapped = false
            // Don't modify emissive - keep original lamp appearance
          } else {
            // For non-light materials: only zero out emissive color to prevent bloom
            // but DO NOT touch emissiveMap or other texture properties
            if (child.material.emissive) {
              child.material.emissive.setHex(0x000000)
              child.material.emissiveIntensity = 0
            }

            // Check if this is a hood/bonnet mesh by name
            const meshNameLower = meshName.toLowerCase()
            if (
              meshNameLower.includes('hood') ||
              meshNameLower.includes('bonnet') ||
              meshNameLower.includes('cofano')
            ) {
              child.material.transparent = true
              child.material.depthWrite = true
              child.material.opacity = 1.0
              hoodMaterialsRef.current.push({
                mesh: child,
                material: child.material,
              })
              console.log('[Hood Mesh] Found by name:', meshName)
            }

            // Also check paint material for body - we'll make it semi-transparent
            if (matName.includes('Paint_Material')) {
              child.material.transparent = true
              child.material.depthWrite = true
              child.material.opacity = 1.0
              // Store reference for potential body transparency
              if (!child.material.userData.isBodyPaint) {
                child.material.userData.isBodyPaint = true
                hoodMaterialsRef.current.push({
                  mesh: child,
                  material: child.material,
                })
                console.log('[Body Paint] Found:', meshName, matName)
              }
            }
          }
        }
      }
    })

    // Update matrices
    model.updateMatrixWorld(true)

    // Get bounding box
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // Calculate scale - 30% bigger (was 4, now ~5.2)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? 5.2 / maxDim : 1

    // Create wrapper group for transformations
    const wrapper = new THREE.Group()
    wrapper.add(model)

    // Scale the wrapper
    wrapper.scale.setScalar(scale)

    // Position to center (accounting for scale)
    wrapper.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale
    )

    modelRef.current.add(wrapper)

    // Store scale for light positioning
    lightsRef.current.scale = scale
    lightsRef.current.wrapper = wrapper
  }, [scene])

  // Store hoodOpen in ref for useFrame access
  const hoodOpenRef = useRef(hoodOpen)
  useEffect(() => {
    hoodOpenRef.current = hoodOpen
  }, [hoodOpen])

  useEffect(() => {
    if (leftHeadlightRef.current && leftHeadlightTargetRef.current) {
      leftHeadlightRef.current.target = leftHeadlightTargetRef.current
      leftHeadlightRef.current.target.updateMatrixWorld()
    }
    if (rightHeadlightRef.current && rightHeadlightTargetRef.current) {
      rightHeadlightRef.current.target = rightHeadlightTargetRef.current
      rightHeadlightRef.current.target.updateMatrixWorld()
    }
    if (leftFrontSpillRef.current && leftFrontSpillTargetRef.current) {
      leftFrontSpillRef.current.target = leftFrontSpillTargetRef.current
      leftFrontSpillRef.current.target.updateMatrixWorld()
    }
    if (rightFrontSpillRef.current && rightFrontSpillTargetRef.current) {
      rightFrontSpillRef.current.target = rightFrontSpillTargetRef.current
      rightFrontSpillRef.current.target.updateMatrixWorld()
    }
    if (leftRearSpillRef.current && leftRearSpillTargetRef.current) {
      leftRearSpillRef.current.target = leftRearSpillTargetRef.current
      leftRearSpillRef.current.target.updateMatrixWorld()
    }
    if (rightRearSpillRef.current && rightRearSpillTargetRef.current) {
      rightRearSpillRef.current.target = rightRearSpillTargetRef.current
      rightRearSpillRef.current.target.updateMatrixWorld()
    }
  }, [])

  // Color change effect
  useEffect(() => {
    if (!carColor || !modelRef.current) return

    modelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const name = (
          child.material.name ||
          child.name ||
          ''
        ).toLowerCase()

        // Handle car body paint specifically
        if (
          name.includes('body') ||
          name.includes('paint') ||
          name.includes('car')
        ) {
          if (child.material.color) {
            child.material.color.set(carColor)
          }

          // Ensure car body paint materials DO NOT exceed 1.0 color values
          // by making sure they use tone mapping, while light emissive
          // materials do not, so we can separate them by luminance threshold
          child.material.toneMapped = true

          // Force emissive to black so the body NEVER glows
          if (child.material.emissive) {
            child.material.emissive.setHex(0x000000)
            child.material.emissiveIntensity = 0
          }
        }
      }
    })
  }, [carColor])

  // Smooth animation - use delta-based lerp for frame-rate independence
  useFrame((state, dt) => {
    if (!groupRef.current) return

    // Cap delta time to prevent physics explosions/rubberbanding on frame drops
    // Limits max delta to equivalent of ~20fps (0.05s) minimum frame rate
    const delta = Math.min(dt, 0.05)

    const current = currentValues.current

    // Frame-rate independent lerp factor
    const lerpSpeed = 6 // Smooth but responsive
    const lerpFactor = 1 - Math.exp(-lerpSpeed * delta)

    // In normal mode, car stays at fixed position
    // In free roam, car can be moved by drive controls
    if (!freeRoamActive) {
      // Smoothly return to base position if coming back from free roam
      current.rotationY +=
        (baseRotationRef.current - current.rotationY) * lerpFactor
      current.positionX +=
        (basePositionRef.current[0] - current.positionX) * lerpFactor
      current.positionY +=
        (basePositionRef.current[1] - current.positionY) * lerpFactor
      current.positionZ +=
        (basePositionRef.current[2] - current.positionZ) * lerpFactor
    }

    // Smooth light transition for engine start/stop
    const targetHeadlightLevel = headlightsOn ? 1 : 0
    headlightLevelRef.current +=
      (targetHeadlightLevel - headlightLevelRef.current) * lerpFactor

    // Brake light logic
    const throttleInputLocal =
      driveDirectionRef?.current?.throttle === 'backward'
        ? -1
        : driveDirectionRef?.current?.throttle === 'forward'
          ? 1
          : 0
    // If pressing backward/brake while still rolling forward, or standing still holding brake
    const isBraking =
      throttleInputLocal === -1 &&
      (carPhysicsRef.current?.speed || 0) > -0.1
    const targetBrakeLevel = isBraking ? 1 : 0
    brakeLightLevelRef.current +=
      (targetBrakeLevel - brakeLightLevelRef.current) * (lerpFactor * 2.5)

    // Update bloom glow emissive intensity based on headlight level
    // High emissiveIntensity triggers bloom post-processing
    const frontGlowIntensity = headlightLevelRef.current * 8

    const baseRearGlow = headlightLevelRef.current * 12 // Higher for LED strip spread
    const brakeGlow = brakeLightLevelRef.current * 30
    const rearGlowIntensity = Math.max(baseRearGlow, brakeGlow)

    const frontGlowOpacity = headlightLevelRef.current // 0 when off, 1 when on
    // Rear flares must also light up during braking even if headlights are off!
    const rearGlowOpacity = Math.max(
      headlightLevelRef.current,
      brakeLightLevelRef.current
    )
    if (leftLensFlareRef.current?.material) {
      leftLensFlareRef.current.material.emissiveIntensity =
        frontGlowIntensity
      leftLensFlareRef.current.material.opacity = frontGlowOpacity
    }
    if (rightLensFlareRef.current?.material) {
      rightLensFlareRef.current.material.emissiveIntensity =
        frontGlowIntensity
      rightLensFlareRef.current.material.opacity = frontGlowOpacity
    }
    if (leftRearFlareRef.current?.material) {
      leftRearFlareRef.current.material.emissiveIntensity =
        rearGlowIntensity
      leftRearFlareRef.current.material.opacity = rearGlowOpacity
    }
    if (rightRearFlareRef.current?.material) {
      rightRearFlareRef.current.material.emissiveIntensity =
        rearGlowIntensity
      rightRearFlareRef.current.material.opacity = rearGlowOpacity
    }
    if (leftRearFlare2Ref.current?.material) {
      leftRearFlare2Ref.current.material.emissiveIntensity =
        rearGlowIntensity
      leftRearFlare2Ref.current.material.opacity = rearGlowOpacity
    }
    if (rightRearFlare2Ref.current?.material) {
      rightRearFlare2Ref.current.material.emissiveIntensity =
        rearGlowIntensity
      rightRearFlare2Ref.current.material.opacity = rearGlowOpacity
    }

    // Update hood/body transparency based on hoodOpen state (button click only)
    const targetOpacity = hoodOpenRef.current ? 0.05 : 1.0
    hoodMaterialsRef.current.forEach((item) => {
      if (item.material) {
        // Smoothly interpolate opacity
        const currentOpacity = item.material.opacity
        const newOpacity =
          currentOpacity + (targetOpacity - currentOpacity) * 0.15
        item.material.opacity = newOpacity
      }
    })

    // Realistic car physics with bicycle model steering
    if (wheelsRef.current.length > 0 && freeRoamActive) {
      const group = groupRef.current
      const physics = carPhysicsRef.current
      const config = CAR_CONFIG

      if (group) {
        // --- Input Processing (now supports combined throttle + steering) ---
        let throttleInput = 0
        let steeringInput = 0

        const driveDir = driveDirectionRef?.current || {
          throttle: null,
          steering: null,
        }

        if (driveDir.throttle === 'forward') throttleInput = 1
        else if (driveDir.throttle === 'backward') throttleInput = -1

        if (driveDir.steering === 'left') steeringInput = 1
        else if (driveDir.steering === 'right') steeringInput = -1

        // Burnout detection: W + S pressed simultaneously
        const isBurnout = wPressed.current && sPressed.current
        if (isBurnout) {
          throttleInput = 0 // Cancel forward/backward movement
        }

        // --- Steering (smooth interpolation with speed-dependent limit) ---
        // At low speeds: full steering angle for tight turns
        // At high speeds: reduced angle for stability (like real power steering)
        const globalMaxSpeed = DRIVE_MODES['race']?.maxSpeed || 55
        const speedRatio = THREE.MathUtils.clamp(
          Math.abs(physics.speed) / globalMaxSpeed,
          0,
          1
        )
        const currentMaxSteer = THREE.MathUtils.lerp(
          config.maxSteeringAngle,
          config.minSteeringAngle,
          speedRatio
        )
        const targetSteering = steeringInput * currentMaxSteer

        if (Math.abs(steeringInput) > 0.01) {
          // Player is actively steering - interpolate towards target
          damp(physics, 'steeringAngle', targetSteering, 0.25, delta)
        } else {
          // Auto-center wheels when no steering input
          damp(physics, 'steeringAngle', 0, 0.35, delta)
        }

        // Clamp steering angle to speed-dependent limit
        physics.steeringAngle = THREE.MathUtils.clamp(
          physics.steeringAngle,
          -currentMaxSteer,
          currentMaxSteer
        )

        // --- Speed / Throttle ---
        if (throttleInput > 0) {
          physics.speed += config.acceleration * throttleInput * delta
        } else if (throttleInput < 0) {
          physics.speed += config.braking * throttleInput * delta
        } else {
          // Friction deceleration when no input
          const frictionForce = config.friction * delta
          if (Math.abs(physics.speed) < frictionForce) {
            physics.speed = 0
          } else {
            physics.speed -= Math.sign(physics.speed) * frictionForce
          }
        }

        // Clamp speed
        physics.speed = THREE.MathUtils.clamp(
          physics.speed,
          -config.maxSpeed * 0.4, // Reverse is slower
          config.maxSpeed
        )

        // --- Vector-Based Drift Physics ---
        // Decouple velocity from heading. This allows the car to point one way while sliding another.
        physics.velX = physics.velX || 0
        physics.velZ = physics.velZ || 0

        const bodyX = Math.sin(group.rotation.y)
        const bodyZ = Math.cos(group.rotation.y)

        // Apply throttle / brake along the car's heading
        if (throttleInput > 0) {
          physics.velX +=
            bodyX * config.acceleration * throttleInput * delta
          physics.velZ +=
            bodyZ * config.acceleration * throttleInput * delta
        } else if (throttleInput < 0) {
          physics.velX += bodyX * config.braking * throttleInput * delta
          physics.velZ += bodyZ * config.braking * throttleInput * delta
        }

        // Decompose global velocity into local axes relative to the car body
        let forwardSpeed =
          physics.velX * bodyX + physics.velZ * bodyZ
        const rightX = Math.cos(group.rotation.y)
        const rightZ = -Math.sin(group.rotation.y)
        let lateralSpeed =
          physics.velX * rightX + physics.velZ * rightZ

        // Apply rolling friction
        if (throttleInput === 0) {
          const frictionDrop = config.friction * delta
          if (Math.abs(forwardSpeed) < frictionDrop) {
            forwardSpeed = 0
          } else {
            forwardSpeed -= Math.sign(forwardSpeed) * frictionDrop
          }
        }

        // Clamp to max speed
        forwardSpeed = THREE.MathUtils.clamp(
          forwardSpeed,
          -config.maxSpeed * 0.4,
          config.maxSpeed
        )

        // Track handbrake input to override natural traction
        const handbrakeActive = spacePressed.current
        const targetTraction = handbrakeActive ? 0.95 : 0.05

        // Initialize if empty
        physics.currentTraction = physics.currentTraction ?? 0.05

        // Gradual return to grip when handbrake is released, but quick drop when handbrake is pressed
        const tractionLerpSpeed = handbrakeActive ? 5.0 : 0.8
        const tractionFactor =
          1 - Math.exp(-tractionLerpSpeed * delta)
        physics.currentTraction = THREE.MathUtils.lerp(
          physics.currentTraction,
          targetTraction,
          tractionFactor
        )

        // Apply sideways friction (kills lateral momentum based on traction)
        lateralSpeed *= Math.pow(
          physics.currentTraction,
          delta * 60
        )

        // Steering: Car turns based on forward rolling speed, not total sliding speed
        if (
          Math.abs(forwardSpeed) > 0.001 &&
          Math.abs(physics.steeringAngle) > 0.001
        ) {
          const turnRadius =
            config.wheelbase / Math.tan(physics.steeringAngle)
          let angularVelocity = forwardSpeed / turnRadius

          const speedRatio = THREE.MathUtils.clamp(
            Math.abs(forwardSpeed) /
            (DRIVE_MODES['race']?.maxSpeed || 55),
            0,
            1
          )
          let gripFactor = THREE.MathUtils.lerp(
            1.0,
            0.4,
            speedRatio
          )

          physics.currentOversteer =
            physics.currentOversteer ?? 1.0
          const targetOversteer = handbrakeActive ? 1.5 : 1.0
          physics.currentOversteer = THREE.MathUtils.lerp(
            physics.currentOversteer,
            targetOversteer,
            tractionFactor
          )

          // Oversteer via handbrake kicks out the back end less aggressively than before
          gripFactor *= physics.currentOversteer

          angularVelocity *= gripFactor
          group.rotation.y += angularVelocity * delta
        }

        // Reconstruct global velocity from local speeds so the camera and path logic receive the updated vector
        physics.velX =
          bodyX * forwardSpeed + rightX * lateralSpeed
        physics.velZ =
          bodyZ * forwardSpeed + rightZ * lateralSpeed
        physics.speed = forwardSpeed
        physics.sidewaysSpeed = lateralSpeed

        // Ensure variables mapped correctly for collision / movement detection
        if (
          Math.abs(physics.velX) > 0.001 ||
          Math.abs(physics.velZ) > 0.001
        ) {
          const dx = physics.velX * delta
          const dz = physics.velZ * delta

          let collision = false

          // Throttle raycasting to every 3rd frame to massively reduce GPU/CPU load
          collisionFrameRef.current++
          if (
            trackColliders &&
            trackColliders.length > 0 &&
            Math.abs(physics.speed) > 0.05 &&
            collisionFrameRef.current % terrainConfig.collisionRaycastModulo === 0
          ) {
            // Raycast vector accounts for both forward and sliding sideways velocities
            _forwardDir.current.set(dx, 0, dz).normalize()
            _rayDir.current.copy(_forwardDir.current)
            _rayOrigin.current.set(
              group.position.x,
              group.position.y + 0.5,
              group.position.z
            )
            const rayFar = 2.9

            raycasterRef.current.set(
              _rayOrigin.current,
              _rayDir.current
            )
            raycasterRef.current.far = rayFar

            const intersects =
              raycasterRef.current.intersectObjects(trackColliders, false)

            if (intersects.length > 0) {
              collision = true
            }
            if (collision) {
              physics.velX = 0
              physics.velZ = 0
              physics.speed = 0
              physics.sidewaysSpeed = 0
              // Push back opposite to movement direction
              const repulse = 0.2
              group.position.x -= _forwardDir.current.x * repulse
              group.position.z -= _forwardDir.current.z * repulse
            }
          }

          if (!collision) {
            group.position.x += dx
            group.position.z += dz
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // TERRAIN FOLLOWING — cast a ray downward from above the car and snap
        // the car's Y to the road surface.  Uses terrainMeshes (road/ground)
        // when available, otherwise falls back to trackColliders, then to
        // FALLBACK_Y on flat tracks with no geometry at all.
        //
        // MULTI-LEVEL TRACK LOGIC: The ray returns hits sorted nearest-first
        // (= highest Y first, since the ray travels downward).  On a track with
        // bridges / overpasses the very first hit is often the bridge surface
        // sitting ABOVE the car, not the road beneath it.  We therefore filter
        // hits to only accept surfaces that are at most MAX_STEP_UP units above
        // the last known terrain Y, which prevents bridge-snap jumps while still
        // allowing the car to climb ramps smoothly.
        // ─────────────────────────────────────────────────────────────────────
        const terrainTargets =
          terrainMeshes && terrainMeshes.length > 0
            ? terrainMeshes
            : trackColliders && trackColliders.length > 0
              ? trackColliders
              : null

        const hasFixedRideY = Number.isFinite(terrainConfig.fixedRideY)
        const fixedRideY = hasFixedRideY
          ? terrainConfig.fixedRideY
          : carPosition?.[1] ?? FALLBACK_Y

        if (terrainConfig.disableTerrainFollow) {
          group.position.y = fixedRideY
          _smoothedTerrainY.current = fixedRideY - CAR_RIDE_HEIGHT
        } else

        if (terrainTargets) {
          terrainFrameRef.current++
          const shouldSampleTerrain =
            _smoothedTerrainY.current === null ||
            terrainFrameRef.current % terrainConfig.terrainRaycastModulo === 0

          if (!shouldSampleTerrain) {
            group.position.y = _smoothedTerrainY.current + CAR_RIDE_HEIGHT
          } else {
          // Only start the ray slightly above the car to prevent hitting bridges/overhead stuff
          const RAY_ABOVE = 5
          _terrainRayOrigin.current.set(
            group.position.x,
            group.position.y + RAY_ABOVE,
            group.position.z
          )
          terrainRaycasterRef.current.set(
            _terrainRayOrigin.current,
            _terrainRayDown.current
          )
          terrainRaycasterRef.current.far = RAY_ABOVE + 10

          const terrainHits =
            terrainRaycasterRef.current.intersectObjects(
              terrainTargets,
              false
            )

          if (terrainHits.length > 0) {
            // ── Proximity-based hit selection ───────────────────────────────────
            // terrainHits is sorted nearest-first from the ray origin (= highest
            // Y first, since the ray travels downward).
            //
            // PROBLEM with simple find(): a bridge that is 1.5 m above the road
            // passes both MAX_STEP_UP=2 AND comes first in the sorted list, so
            // it gets selected instead of the road → car is launched upward.
            //
            // FIX: among all hits below (expectedY + MAX_STEP_UP), pick the one
            // whose Y is CLOSEST to expectedY.  This keeps the car on whatever
            // surface it is currently riding even when a low bridge is nearby.
            // MAX_STEP_UP is now loose (4 m) — the proximity sort does the real
            // discrimination between bridge (far from expected) vs road (close).
            // ───────────────────────────────────────────────────────────────────
            const MAX_STEP_UP = terrainConfig.maxStepUp
            const expectedY =
              _smoothedTerrainY.current ?? (group.position.y - CAR_RIDE_HEIGHT)

            // Step 1: discard anything impossibly high above (very tall bridges)
            let bestHit = null
            let bestDist = Infinity
            for (let i = 0; i < terrainHits.length; i++) {
              const hit = terrainHits[i]
              if (hit.face) {
                _terrainNormal.current
                  .copy(hit.face.normal)
                  .transformDirection(hit.object.matrixWorld)
                // Weaken the normal check significantly so we don't reject slopes
                if (_terrainNormal.current.y < 0.2) continue
              }

              const hy = hit.point.y
              if (hy > expectedY + MAX_STEP_UP) continue // skip very-high overhead
              const d = Math.abs(hy - expectedY)
              if (d > terrainConfig.maxSurfaceDeltaFromExpected) continue
              if (d < bestDist) {
                bestDist = d
                bestHit = hit
              }
            }

            if (bestHit) {
              const surfaceY = bestHit.point.y

              if (_smoothedTerrainY.current === null) {
                _smoothedTerrainY.current = surfaceY
              }

              // Adaptive lerp speed:
              //   • Terrain rises   (ramp up)   → speed 10, smooth climb
              //   • Terrain drops   (ramp down)  → speed 20, snappy / planted feel
              // This makes the car feel heavy and glued to the road going
              // downhill while still smoothly following ramp‐ups.
              const goingDown = surfaceY < _smoothedTerrainY.current
              const terrainLerpSpeed = goingDown ? 20 : 10
              const terrainLerpFactor =
                1 - Math.exp(-terrainLerpSpeed * delta)
              let nextTerrainY = THREE.MathUtils.lerp(
                _smoothedTerrainY.current,
                surfaceY,
                terrainLerpFactor
              )

              const maxRise = terrainConfig.maxRisePerSecond * delta
              const maxFall = terrainConfig.maxFallPerSecond * delta
              const deltaY = nextTerrainY - _smoothedTerrainY.current
              if (deltaY > maxRise) {
                nextTerrainY = _smoothedTerrainY.current + maxRise
              } else if (deltaY < -maxFall) {
                nextTerrainY = _smoothedTerrainY.current - maxFall
              }

              _smoothedTerrainY.current = nextTerrainY

              group.position.y =
                _smoothedTerrainY.current + CAR_RIDE_HEIGHT
            }
            // bestHit === null: all hits were extreme overhead geometry —
            // keep current Y for this frame (briefly airborne / ramp exit).
          } else {
            // Absolutely no geometry below at all — flat fallback track
            _smoothedTerrainY.current = null
            group.position.y = FALLBACK_Y
          }
          }
        } else {
          // No terrain meshes or colliders at all — flat track fallback
          _smoothedTerrainY.current = null
          group.position.y = FALLBACK_Y
        }
        // ─────────────────────────────────────────────────────────────────────

        // ── TERRAIN SLOPE PITCH ───────────────────────────────────────────────
        // Sample terrain height at the front and rear axles to derive pitch.
        // Throttled to every 2nd frame; pitch is smoothed so gaps are invisible.
        // ─────────────────────────────────────────────────────────────────────
        _slopeFrame.current++
        if (terrainConfig.disableTerrainFollow || !terrainConfig.enableSlopePitch) {
          _smoothedPitch.current = 0
        }
        if (
          !terrainConfig.disableTerrainFollow &&
          terrainConfig.enableSlopePitch &&
          terrainTargets &&
          _smoothedTerrainY.current !== null &&
          _slopeFrame.current % terrainConfig.slopeRaycastModulo === 0
        ) {
          const AXLE_DIST = 2.2 // ~half car length in world units
          const sinY = Math.sin(group.rotation.y)
          const cosY = Math.cos(group.rotation.y)
          const slopeFar = 16

          // Front axle
          _terrainRayOrigin.current.set(
            group.position.x + sinY * AXLE_DIST,
            group.position.y + 8,
            group.position.z + cosY * AXLE_DIST
          )
          terrainRaycasterRef.current.set(_terrainRayOrigin.current, _terrainRayDown.current)
          terrainRaycasterRef.current.far = slopeFar
          const fHits = terrainRaycasterRef.current.intersectObjects(terrainTargets, false)

          // Rear axle
          _terrainRayOrigin.current.set(
            group.position.x - sinY * AXLE_DIST,
            group.position.y + 8,
            group.position.z - cosY * AXLE_DIST
          )
          terrainRaycasterRef.current.set(_terrainRayOrigin.current, _terrainRayDown.current)
          terrainRaycasterRef.current.far = slopeFar
          const rHits = terrainRaycasterRef.current.intersectObjects(terrainTargets, false)

          const cY = _smoothedTerrainY.current
          const pickSlopeHitY = (hits) => {
            for (let i = 0; i < hits.length; i++) {
              const hit = hits[i]
              if (!hit.face) return hit.point.y
              _terrainNormal.current
                .copy(hit.face.normal)
                .transformDirection(hit.object.matrixWorld)
              if (_terrainNormal.current.y >= terrainConfig.minTerrainNormalY) {
                return hit.point.y
              }
            }
            return cY
          }

          const fY = pickSlopeHitY(fHits)
          const rY = pickSlopeHitY(rHits)

          // pitch > 0 means front is higher → car nose should tilt up
          // In Three.js with YXZ order, negative X rotation tilts nose up
          const targetPitch = Math.atan2(fY - rY, AXLE_DIST * 2)
          const pitchLerp = 1 - Math.exp(-10 * delta)
          _smoothedPitch.current = THREE.MathUtils.lerp(_smoothedPitch.current, targetPitch, pitchLerp)
        }

        // Apply clamped pitch every frame (decays to 0 on flat terrain naturally)
        const MAX_PITCH = THREE.MathUtils.degToRad(terrainConfig.maxPitchDeg)
        group.rotation.x = THREE.MathUtils.clamp(-_smoothedPitch.current, -MAX_PITCH, MAX_PITCH)

        // Hard safety net against bad terrain hits causing launch/fall-through.
        // Also clamp velocity to prevent NaN explosion crashes (spontaneous reloads)
        if (
          !Number.isFinite(group.position.x) ||
          !Number.isFinite(group.position.y) ||
          !Number.isFinite(group.position.z) ||
          !Number.isFinite(physics.velX) ||
          !Number.isFinite(physics.velZ) ||
          group.position.y < terrainConfig.minYClamp ||
          group.position.y > terrainConfig.maxYClamp
        ) {
          group.position.x = carPosition?.[0] ?? 0
          group.position.y = carPosition?.[1] ?? FALLBACK_Y
          group.position.z = carPosition?.[2] ?? 0
          _smoothedTerrainY.current = group.position.y
          physics.velX = 0
          physics.velZ = 0
          physics.speed = 0
          _smoothedPitch.current = 0
          group.rotation.x = 0
        }
        // ─────────────────────────────────────────────────────────────────────

        // Export car position for camera follow and physics hooks
        if (carPositionRef) {
          carPositionRef.current = {
            x: group.position.x,
            y: group.position.y,
            z: group.position.z,
            rotation: group.rotation.y,
            speed: physics.speed,
            sidewaysSpeed: physics.sidewaysSpeed || 0,
            isDrifting:
              handbrakeActive &&
              Math.abs(physics.sidewaysSpeed || 0) > 1.5,
            isBurnout: isBurnout,
          }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // WHEEL VISUALS - Ackermann-like steering geometry
        // ═══════════════════════════════════════════════════════════════════════
        // The wheel meshes in the 3D model have their own local coordinate system.
        // Typically:
        // - Rolling (forward motion) = rotation around the wheel's axle
        // - Steering (turning) = rotation around vertical axis
        //
        // We need to apply rotations in the correct order and on correct axes.
        // The initial rotation of the wheel mesh is stored and we add to it.
        // ═══════════════════════════════════════════════════════════════════════

        const wheelRadius = 0.34 // ~0.34m for Giulia wheels
        // During burnout, rear wheels spin fast even though car is stationary
        const spinDelta = isBurnout
          ? delta * 80
          : (physics.speed * delta) / wheelRadius
        wheelRotationRef.current += spinDelta

        // Ackermann steering: inner wheel turns more than outer wheel
        const wheelBase = 2.82 // meters
        const trackWidth = 1.6 // meters (approximate)

        // Calculate inner/outer wheel angles for Ackermann geometry
        let innerAngle = physics.steeringAngle
        let outerAngle = physics.steeringAngle

        if (Math.abs(physics.steeringAngle) > 0.01) {
          // Calculate turn radius from steering angle
          const turnRadius =
            wheelBase /
            Math.tan(Math.abs(physics.steeringAngle))

          // Inner wheel turns more, outer wheel turns less
          innerAngle = Math.atan(
            wheelBase / (turnRadius - trackWidth / 2)
          )
          outerAngle = Math.atan(
            wheelBase / (turnRadius + trackWidth / 2)
          )

          // Apply sign based on steering direction
          if (physics.steeringAngle < 0) {
            innerAngle = -innerAngle
            outerAngle = -outerAngle
          }
        }

        wheelsRef.current.forEach((wheel) => {
          const isLeftWheel = wheel.userData.isLeftWheel
          const isFrontWheel = wheel.userData.isFrontWheel
          const initialQuat = wheel.userData.initialQuaternion

          if (!initialQuat) return

          // Start from initial quaternion
          const q = initialQuat.clone()

          // Apply steering to front wheels only
          if (isFrontWheel) {
            // Determine if this wheel is inner or outer based on turn direction
            const turningLeft = physics.steeringAngle > 0
            const isInnerWheel =
              (turningLeft && isLeftWheel) ||
              (!turningLeft && !isLeftWheel)

            const steerAngle = isInnerWheel
              ? innerAngle
              : outerAngle

            // Steer by rotating around Y axis (in parent space)
            const steerQuat = new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 1, 0),
              steerAngle
            )
            q.premultiply(steerQuat)
          }

          // Apply rolling rotation (around the wheel's local axle - typically X in model space)
          // During burnout, only rear wheels spin
          let spinRotation
          if (isBurnout && isFrontWheel) {
            spinRotation = 0 // Front wheels stay still during burnout
          } else {
            spinRotation = isLeftWheel
              ? -wheelRotationRef.current
              : wheelRotationRef.current
          }
          const rollQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            spinRotation
          )
          q.multiply(rollQuat)

          wheel.quaternion.copy(q)
        })
      }
    } else if (headlightsOn && wheelsRef.current.length > 0) {
      // Idle wheel spin when engine is on but not driving
      wheelRotationRef.current += delta * 0.5
      wheelsRef.current.forEach((wheel) => {
        const isLeftWheel = wheel.userData.isLeftWheel
        const initialQuat = wheel.userData.initialQuaternion
        if (!initialQuat) return

        const q = initialQuat.clone()
        const spinRotation = isLeftWheel
          ? -wheelRotationRef.current
          : wheelRotationRef.current
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          spinRotation
        )
        q.multiply(rollQuat)

        wheel.quaternion.copy(q)
      })
    } else {
      // Reset wheels to initial rotation when not active
      wheelsRef.current.forEach((wheel) => {
        const initialQuat = wheel.userData.initialQuaternion
        if (initialQuat) {
          wheel.quaternion.copy(initialQuat)
        }
      })
    }

    // Ensure car stays on floor in free roam mode
    // (terrain following above handles Y when terrainTargets exist;
    //  this is the fallback for when there are no colliders or terrain meshes)
    if (
      freeRoamActive &&
      groupRef.current &&
      (!trackColliders || trackColliders.length === 0) &&
      (!terrainMeshes || terrainMeshes.length === 0)
    ) {
      groupRef.current.position.y = FALLBACK_Y
    }

    if (leftHeadlightRef.current) {
      leftHeadlightRef.current.intensity =
        22 * headlightLevelRef.current
    }
    if (rightHeadlightRef.current) {
      rightHeadlightRef.current.intensity =
        22 * headlightLevelRef.current
    }
    // --- REAR LIGHT TUNING (INTENSITY LAYER) ---
    // These two point lights are the compact "lamp core" glow right at the taillamp housing.
    // Increase for stronger local red punch; keep low to avoid tiny vertical floor dots.
    if (leftTaillightRef.current) {
      leftTaillightRef.current.intensity = Math.max(
        0.4 * headlightLevelRef.current,
        2.0 * brakeLightLevelRef.current
      )
    }
    if (rightTaillightRef.current) {
      rightTaillightRef.current.intensity = Math.max(
        0.4 * headlightLevelRef.current,
        2.0 * brakeLightLevelRef.current
      )
    }

    if (leftFrontSpillRef.current) {
      leftFrontSpillRef.current.intensity =
        15 * headlightLevelRef.current
    }
    if (rightFrontSpillRef.current) {
      rightFrontSpillRef.current.intensity =
        15 * headlightLevelRef.current
    }
    // These two spot lights are the rear floor spill (the long red projection behind the car).
    // Raise value for brighter rear projection footprint on floor.
    if (leftRearSpillRef.current) {
      leftRearSpillRef.current.intensity = Math.max(
        9.8 * headlightLevelRef.current,
        20.0 * brakeLightLevelRef.current
      )
    }
    if (rightRearSpillRef.current) {
      rightRearSpillRef.current.intensity = Math.max(
        9.8 * headlightLevelRef.current,
        20.0 * brakeLightLevelRef.current
      )
    }

    if (
      leftFrontSpillTargetRef.current &&
      rightFrontSpillTargetRef.current
    ) {
      leftFrontSpillTargetRef.current.updateMatrixWorld()
      rightFrontSpillTargetRef.current.updateMatrixWorld()
    }
    if (
      leftRearSpillTargetRef.current &&
      rightRearSpillTargetRef.current
    ) {
      leftRearSpillTargetRef.current.updateMatrixWorld()
      rightRearSpillTargetRef.current.updateMatrixWorld()
    }

    // Apply position and rotation
    // In free roam, position is updated by drive controls above
    // In normal mode, car stays at fixed position
    if (!freeRoamActive) {
      groupRef.current.rotation.y = current.rotationY
      groupRef.current.position.set(
        current.positionX,
        current.positionY,
        current.positionZ
      )
    }
  })

  const handleMeshClick = (e) => {
    e.stopPropagation()
  }

  return (
    <group ref={groupRef}>
      {/* ContactShadows removed — uses MultiplyBlending without premultipliedAlpha
          which spams the console with three.js errors on every frame.
          Real shadow maps (castShadow / receiveShadow) are used instead. */}
      <group ref={vehicleLightsRef}>
        <object3D
          ref={leftHeadlightTargetRef}
          position={[-1.18, -1.05, 14]}
        />
        <object3D
          ref={rightHeadlightTargetRef}
          position={[1.18, -1.05, 14]}
        />
        <object3D
          ref={leftFrontSpillTargetRef}
          position={[-0.9, FLOOR_Y, 6.2]}
        />
        <object3D
          ref={rightFrontSpillTargetRef}
          position={[0.9, FLOOR_Y, 6.2]}
        />
        {/*
          REAR TARGETS = where rear spotlights hit the floor.
          x: wider +/- => wider left/right spread on floor.
          z: more negative => farther throw behind the car.
          y should stay close to FLOOR_Y for stable floor interception.
        */}
        <object3D
          ref={leftRearSpillTargetRef}
          position={[-1.9, FLOOR_Y, -4.6]}
        />
        <object3D
          ref={rightRearSpillTargetRef}
          position={[1.9, FLOOR_Y, -4.6]}
        />

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

        <pointLight
          ref={leftTaillightRef}
          position={[-1.74, 1.92, -2.22]}
          // rear core radius (larger = bigger local halo under/around lamp)
          distance={1.8}
          // physically plausible falloff exponent
          decay={2}
          color="#ff2316"
        />
        <pointLight
          ref={rightTaillightRef}
          position={[1.74, 1.92, -2.22]}
          // rear core radius (match left for symmetry)
          distance={1.8}
          // physically plausible falloff exponent
          decay={2}
          color="#ff2316"
        />

        {/*
          REAR SPILL SPOTS (main rear floor projection controls):
          angle: cone width (bigger = wider spread on floor).
          distance: max throw length (bigger = reaches farther back).
          penumbra: edge softness (1 = soft edge, 0 = hard edge).
        */}
        <spotLight
          ref={leftRearSpillRef}
          position={[-0.64, 0.96, -2.32]}
          angle={0.72}
          penumbra={1}
          distance={11}
          decay={0.8}
          color="#ff2a1c"
        />
        <spotLight
          ref={rightRearSpillRef}
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
        <mesh
          ref={rightLensFlareRef}
          position={[0.78, 0.72, 2.28]}
        >
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

        {/* Rear Left Taillight - LED strip shape (wider, flatter) */}
        {/* rotation: [x-tilt, y-rotation, z-roll] in radians */}
        <mesh
          ref={leftRearFlareRef}
          position={[-0.54, 1, -2.45]}
          rotation={[0, 0.39, -0.02]}
        >
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

        {/* Rear Right Taillight - LED strip shape (wider, flatter) */}
        <mesh
          ref={rightRearFlareRef}
          position={[0.54, 1, -2.45]}
          rotation={[0, -0.39, 0.02]}
        >
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
        <mesh
          ref={leftRearFlare2Ref}
          position={[-0.8, 1, -2.278]}
          rotation={[0, 0.72, 0]}
        >
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
        <mesh
          ref={rightRearFlare2Ref}
          position={[0.8, 1, -2.278]}
          rotation={[0, -0.72, 0]}
        >
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
      </group>

      <group ref={modelRef} onClick={handleMeshClick} />
    </group>
  )
}

useGLTF.preload('/models/giulia.glb')