import { useRef, useEffect } from 'react'
import { useGLTF, ContactShadows } from '@react-three/drei'
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
 * @param {string} driveDirection - Drive direction in free roam ('forward', 'backward', 'left', 'right')
 */
export default function CarModel({
  carPosition = [0, -0.8, 0],
  carRotation = 0,
  carColor = null,
  headlightsOn = false,
  freeRoamActive = false,
  hoodOpen = false,
  driveDirectionRef = null,
  carPositionRef = null, // Ref to share car position with camera
  trackColliders = [] // Prop for collision meshes
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

  // Car physics state for realistic steering
  const carPhysicsRef = useRef({
    speed: 0,
    steeringAngle: 0, // Current wheel angle in radians
    targetSteering: 0, // Target steering from input
  })

  // Car configuration (Giulia wheelbase ~2.82m)
  const CAR_CONFIG = {
    wheelbase: 4.52, // Distance between front and rear axles
    maxSteeringAngle: Math.PI / 10, // ~36 degrees max wheel turn
    maxSpeed: 35, // Increased for a more progressive and racing feel
    acceleration: 8,
    braking: 25,
    friction: 15,
    steeringSpeed: 2.5, // Snappier wheels
    steeringReturnSpeed: 2,
  }

  const FLOOR_Y = -0.78
  const { scene, animations } = useGLTF('/models/giulia.glb')


  // Debug: Check for animations and openable parts
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && scene) {
      console.log('=== GLB ANIMATIONS ===', animations?.length || 0, animations)
      const openableParts = []
      scene.traverse((child) => {
        const name = (child.name || '').toLowerCase()
        if (name.includes('hood') || name.includes('door') || name.includes('trunk') || name.includes('bonnet') || name.includes('engine')) {
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
    positionZ: carPosition[2]
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
        const isGlassLike = /glass|window|windshield/i.test(`${materialName} ${meshName}`)

        // Detect wheel meshes by material name and position
        if (materialName.includes('Wheel') || materialName.includes('wheel')) {
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
            console.log(`Wheel: ${meshName}, localZ: ${localPos.z.toFixed(2)}, isFront: ${child.userData.isFrontWheel}, isLeft: ${child.userData.isLeftWheel}`)
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
          if (matName === 'QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017InteriorA_Material1' ||
            matName === 'color_Int') {
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
            matName === 'QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017LightA_Material1'
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
            if (meshNameLower.includes('hood') || meshNameLower.includes('bonnet') || meshNameLower.includes('cofano')) {
              child.material.transparent = true
              child.material.depthWrite = true
              child.material.opacity = 1.0
              hoodMaterialsRef.current.push({ mesh: child, material: child.material })
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
                hoodMaterialsRef.current.push({ mesh: child, material: child.material })
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
        const name = (child.material.name || child.name || '').toLowerCase()

        // Handle car body paint specifically
        if (name.includes('body') || name.includes('paint') || name.includes('car')) {
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
      current.rotationY += (baseRotationRef.current - current.rotationY) * lerpFactor
      current.positionX += (basePositionRef.current[0] - current.positionX) * lerpFactor
      current.positionY += (basePositionRef.current[1] - current.positionY) * lerpFactor
      current.positionZ += (basePositionRef.current[2] - current.positionZ) * lerpFactor
    }

    // Smooth light transition for engine start/stop
    const targetHeadlightLevel = headlightsOn ? 1 : 0
    headlightLevelRef.current += (targetHeadlightLevel - headlightLevelRef.current) * lerpFactor

    // Update bloom glow emissive intensity based on headlight level
    // High emissiveIntensity triggers bloom post-processing
    const frontGlowIntensity = headlightLevelRef.current * 8
    const rearGlowIntensity = headlightLevelRef.current * 12 // Higher for LED strip spread
    const glowOpacity = headlightLevelRef.current // 0 when off, 1 when on
    if (leftLensFlareRef.current?.material) {
      leftLensFlareRef.current.material.emissiveIntensity = frontGlowIntensity
      leftLensFlareRef.current.material.opacity = glowOpacity
    }
    if (rightLensFlareRef.current?.material) {
      rightLensFlareRef.current.material.emissiveIntensity = frontGlowIntensity
      rightLensFlareRef.current.material.opacity = glowOpacity
    }
    if (leftRearFlareRef.current?.material) {
      leftRearFlareRef.current.material.emissiveIntensity = rearGlowIntensity
      leftRearFlareRef.current.material.opacity = glowOpacity
    }
    if (rightRearFlareRef.current?.material) {
      rightRearFlareRef.current.material.emissiveIntensity = rearGlowIntensity
      rightRearFlareRef.current.material.opacity = glowOpacity
    }
    if (leftRearFlare2Ref.current?.material) {
      leftRearFlare2Ref.current.material.emissiveIntensity = rearGlowIntensity
      leftRearFlare2Ref.current.material.opacity = glowOpacity
    }
    if (rightRearFlare2Ref.current?.material) {
      rightRearFlare2Ref.current.material.emissiveIntensity = rearGlowIntensity
      rightRearFlare2Ref.current.material.opacity = glowOpacity
    }

    // Update hood/body transparency based on hoodOpen state (button click only)
    const targetOpacity = hoodOpenRef.current ? 0.05 : 1.0
    hoodMaterialsRef.current.forEach((item) => {
      if (item.material) {
        // Smoothly interpolate opacity
        const currentOpacity = item.material.opacity
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.15
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

        const driveDir = driveDirectionRef?.current || { throttle: null, steering: null }

        if (driveDir.throttle === 'forward') throttleInput = 1
        else if (driveDir.throttle === 'backward') throttleInput = -1

        if (driveDir.steering === 'left') steeringInput = 1
        else if (driveDir.steering === 'right') steeringInput = -1

        // --- Steering (smooth interpolation) ---
        const targetSteering = steeringInput * config.maxSteeringAngle

        if (Math.abs(steeringInput) > 0.01) {
          // Player is actively steering - interpolate towards target
          damp(physics, 'steeringAngle', targetSteering, 0.25, delta);
        } else {
          // Auto-center wheels when no steering input
          damp(physics, 'steeringAngle', 0, 0.35, delta);
        }

        // Clamp steering angle
        physics.steeringAngle = THREE.MathUtils.clamp(
          physics.steeringAngle,
          -config.maxSteeringAngle,
          config.maxSteeringAngle
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

        // --- Bicycle Model Movement (arc, not tank turn) ---
        if (Math.abs(physics.speed) > 0.001) {
          if (Math.abs(physics.steeringAngle) > 0.001) {
            // Calculate turn radius from rear axle
            const turnRadius = config.wheelbase / Math.tan(physics.steeringAngle)

            // Angular velocity = speed / turnRadius
            const angularVelocity = physics.speed / turnRadius

            // Update car heading (rotation)
            group.rotation.y += angularVelocity * delta
          }

          // Move car forward in the direction it's facing
          const dx = Math.sin(group.rotation.y) * physics.speed * delta
          const dz = Math.cos(group.rotation.y) * physics.speed * delta

          let collision = false;
          if (trackColliders && trackColliders.length > 0 && Math.abs(physics.speed) > 0.1) {
             const vDir = new THREE.Vector3(dx, 0, dz).normalize();
             raycasterRef.current.set(new THREE.Vector3(group.position.x, -0.3, group.position.z), vDir);
             // Ensure it ignores things like ground, look purely forward for walls at chassis height
             raycasterRef.current.far = 1.35; 

             const intersects = raycasterRef.current.intersectObjects(trackColliders, false);
             if (intersects.length > 0 && intersects[0].distance < 1.35) {
               collision = true;
             }
          }

          if (collision) {
             physics.speed *= -0.5; // Bounce
          } else {
             group.position.x += dx
             group.position.z += dz
          }
        }

        // Keep car on the floor
        group.position.y = -0.8

        // Export car position for camera follow
        if (carPositionRef) {
          carPositionRef.current = {
            x: group.position.x,
            y: group.position.y,
            z: group.position.z,
            rotation: group.rotation.y,
            speed: physics.speed,
          }
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // WHEEL VISUALS - Ackermann-like steering geometry
        // ═══════════════════════════════════════════════════════════════════════════
        // The wheel meshes in the 3D model have their own local coordinate system.
        // Typically:
        // - Rolling (forward motion) = rotation around the wheel's axle
        // - Steering (turning) = rotation around vertical axis
        //
        // We need to apply rotations in the correct order and on correct axes.
        // The initial rotation of the wheel mesh is stored and we add to it.
        // ═══════════════════════════════════════════════════════════════════════════

        const wheelRadius = 0.34 // ~0.34m for Giulia wheels
        const spinDelta = (physics.speed * delta) / wheelRadius
        wheelRotationRef.current += spinDelta

        // Ackermann steering: inner wheel turns more than outer wheel
        const wheelBase = 2.82 // meters
        const trackWidth = 1.6 // meters (approximate)

        // Calculate inner/outer wheel angles for Ackermann geometry
        let innerAngle = physics.steeringAngle
        let outerAngle = physics.steeringAngle

        if (Math.abs(physics.steeringAngle) > 0.01) {
          // Calculate turn radius from steering angle
          const turnRadius = wheelBase / Math.tan(Math.abs(physics.steeringAngle))

          // Inner wheel turns more, outer wheel turns less
          innerAngle = Math.atan(wheelBase / (turnRadius - trackWidth / 2))
          outerAngle = Math.atan(wheelBase / (turnRadius + trackWidth / 2))

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
            const isInnerWheel = (turningLeft && isLeftWheel) || (!turningLeft && !isLeftWheel)

            const steerAngle = isInnerWheel ? innerAngle : outerAngle

            // Steer by rotating around Y axis (in parent space)
            const steerQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), steerAngle)
            q.premultiply(steerQuat)
          }

          // Apply rolling rotation (around the wheel's local axle - typically X in model space)
          const spinRotation = isLeftWheel ? -wheelRotationRef.current : wheelRotationRef.current
          const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), spinRotation)
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
        const spinRotation = isLeftWheel ? -wheelRotationRef.current : wheelRotationRef.current
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), spinRotation)
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
    if (freeRoamActive && groupRef.current) {
      groupRef.current.position.y = -0.8
    }

    if (leftHeadlightRef.current) {
      leftHeadlightRef.current.intensity = 22 * headlightLevelRef.current
    }
    if (rightHeadlightRef.current) {
      rightHeadlightRef.current.intensity = 22 * headlightLevelRef.current
    }
    // --- REAR LIGHT TUNING (INTENSITY LAYER) ---
    // These two point lights are the compact "lamp core" glow right at the taillamp housing.
    // Increase for stronger local red punch; keep low to avoid tiny vertical floor dots.
    if (leftTaillightRef.current) {
      leftTaillightRef.current.intensity = 0.4 * headlightLevelRef.current
    }
    if (rightTaillightRef.current) {
      rightTaillightRef.current.intensity = 0.4 * headlightLevelRef.current
    }

    if (leftFrontSpillRef.current) {
      leftFrontSpillRef.current.intensity = 15 * headlightLevelRef.current
    }
    if (rightFrontSpillRef.current) {
      rightFrontSpillRef.current.intensity = 15 * headlightLevelRef.current
    }
    // These two spot lights are the rear floor spill (the long red projection behind the car).
    // Raise value for brighter rear projection footprint on floor.
    if (leftRearSpillRef.current) {
      leftRearSpillRef.current.intensity = 9.8 * headlightLevelRef.current
    }
    if (rightRearSpillRef.current) {
      rightRearSpillRef.current.intensity = 9.8 * headlightLevelRef.current
    }

    if (leftFrontSpillTargetRef.current && rightFrontSpillTargetRef.current) {
      leftFrontSpillTargetRef.current.updateMatrixWorld()
      rightFrontSpillTargetRef.current.updateMatrixWorld()
    }
    if (leftRearSpillTargetRef.current && rightRearSpillTargetRef.current) {
      leftRearSpillTargetRef.current.updateMatrixWorld()
      rightRearSpillTargetRef.current.updateMatrixWorld()
    }

    // Apply position and rotation
    // In free roam, position is updated by drive controls above
    // In normal mode, car stays at fixed position
    if (!freeRoamActive) {
      groupRef.current.rotation.y = current.rotationY
      groupRef.current.position.set(current.positionX, current.positionY, current.positionZ)
    }
  })

  const handleMeshClick = (e) => {
    e.stopPropagation()
    const meshName = e.object.name
    const matName = e.object.material?.name || 'No Material'

  }

  return (
    <group ref={groupRef}>
      <ContactShadows frames={1} position={[0, -0.02, 0]} opacity={0.65} scale={18} blur={2.0} far={4} resolution={1024} color="#000000" />
      <group ref={vehicleLightsRef}>
        <object3D ref={leftHeadlightTargetRef} position={[-1.18, -1.05, 14]} />
        <object3D ref={rightHeadlightTargetRef} position={[1.18, -1.05, 14]} />
        <object3D ref={leftFrontSpillTargetRef} position={[-0.9, FLOOR_Y, 6.2]} />
        <object3D ref={rightFrontSpillTargetRef} position={[0.9, FLOOR_Y, 6.2]} />
        {/*
          REAR TARGETS = where rear spotlights hit the floor.
          x: wider +/- => wider left/right spread on floor.
          z: more negative => farther throw behind the car.
          y should stay close to FLOOR_Y for stable floor interception.
        */}
        <object3D ref={leftRearSpillTargetRef} position={[-1.9, FLOOR_Y, -4.6]} />
        <object3D ref={rightRearSpillTargetRef} position={[1.9, FLOOR_Y, -4.6]} />

        <spotLight
          ref={leftHeadlightRef}
          position={[-0.86, 0.74, 2.32]}
          angle={0.17}
          penumbra={0.92}
          distance={34}
          decay={1}
          color="#e7edf8"
          castShadow
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
          castShadow
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

        {/* Rear Left Taillight - LED strip shape (wider, flatter) */}
        {/* rotation: [x-tilt, y-rotation, z-roll] in radians */}
        <mesh ref={leftRearFlareRef} position={[-0.54, 1, -2.45]} rotation={[0, 0.39, -0.02]}>
          <boxGeometry args={[0.30, 0.01, 0.02]} />
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
        <mesh ref={rightRearFlareRef} position={[0.54, 1, -2.45]} rotation={[0, -0.39, 0.02]}>
          <boxGeometry args={[0.30, 0.01, 0.02]} />
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
        <mesh ref={leftRearFlare2Ref} position={[-0.80, 1, -2.278]} rotation={[0, 0.72, 0]}>
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
        <mesh ref={rightRearFlare2Ref} position={[0.80, 1, -2.278]} rotation={[0, -0.72, 0]}>
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
