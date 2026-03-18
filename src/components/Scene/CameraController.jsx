/**
 * ============================================================================
 * CAMERA CONTROLLER - Alfa Romeo Experience
 * ============================================================================
 * 
 * This component controls camera movement based on scroll progress.
 * The car stays FIXED at center, and the camera moves to showcase different angles.
 * 
 * ============================================================================
 * CAMERA CONFIGURATION REFERENCE
 * ============================================================================
 * 
 * Each section has a camera configuration with the following parameters:
 * 
 * POSITION [x, y, z]:
 * - x: Left (-) / Right (+) of the car
 * - y: Below (-) / Above (+) the car (ground level is ~0)
 * - z: Behind (-) / In front (+) of the car
 * 
 * TARGET [x, y, z]:
 * - The point in 3D space the camera looks at
 * - Usually centered on the car [0, 0, 0] or offset to focus on specific parts
 * - y: 0 = car center height, negative = look at wheels, positive = look at roof
 * 
 * FOV (Field of View):
 * - Lower values (30-40): Telephoto effect, compressed perspective, dramatic
 * - Medium values (45-55): Natural perspective, balanced view
 * - Higher values (60-80): Wide angle, shows more of the scene, can distort edges
 * 
 * ============================================================================
 * COORDINATE SYSTEM VISUALIZATION (Top-down view)
 * ============================================================================
 * 
 *                    +Z (Front of car)
 *                        ▲
 *                        │
 *                        │
 *         -X ◄───────────┼───────────► +X
 *        (Left)          │           (Right)
 *                        │
 *                        ▼
 *                    -Z (Rear of car)
 * 
 * Y-axis: +Y is UP, -Y is DOWN (ground is at y ≈ -0.8)
 * 
 * ============================================================================
 * EXAMPLE CAMERA POSITIONS
 * ============================================================================
 * 
 * Front 3/4 view (classic car shot):
 *   position: [4, 1.5, 6]    - Right side, slightly elevated, in front
 *   target: [0, 0, 0]        - Looking at car center
 * 
 * Side profile:
 *   position: [8, 1, 0]      - Direct right side
 *   target: [0, 0, 0]
 * 
 * Rear 3/4 view:
 *   position: [4, 1.5, -6]   - Right side, behind the car
 *   target: [0, 0, 0]
 * 
 * Low angle (dramatic):
 *   position: [3, 0.3, 5]    - Low, looking up at the car
 *   target: [0, 0.5, 0]      - Looking at upper body
 * 
 * Top-down (engine bay):
 *   position: [0, 4, 2]      - Above and slightly in front
 *   target: [0, 0, 1]        - Looking at hood/engine area
 * 
 * Interior focus:
 *   position: [2, 1.2, 1]    - Close, side angle
 *   target: [0, 0.8, 0.5]    - Looking at cabin area
 * 
 * Wheel detail:
 *   position: [3, 0.5, 1]    - Low, close to front wheel
 *   target: [-0.8, 0.3, 1.5] - Looking at front wheel
 * 
 * ============================================================================
 */

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * SECTION CAMERA CONFIGURATIONS
 * 
 * Modify these values to adjust camera behavior for each section.
 * Changes take effect immediately on page refresh.
 */
export const CAMERA_CONFIGS = {
  // ─────────────────────────────────────────────────────────────────────────
  // HERO SECTION - Opening shot, dramatic front 3/4 view
  // ─────────────────────────────────────────────────────────────────────────
  hero: {
    position: [5, 1.5, 7],      // [x, y, z] - Front-right, elevated
    target: [0, 0, 0],          // Look at car center
    fov: 45,                    // Standard perspective
    // ADJUSTMENTS:
    // - Move camera closer: reduce z (e.g., [5, 1.5, 5])
    // - More dramatic low angle: reduce y (e.g., [5, 0.5, 7])
    // - Show more car side: increase x (e.g., [7, 1.5, 7])
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ENGINE SECTION - Front angle to showcase hood and front design
  // ─────────────────────────────────────────────────────────────────────────
  engine: {
    position: [3, 1.2, 6],      // Closer front view
    target: [0, 0.3, 1],        // Look slightly at hood area
    fov: 50,                    // Slightly wider to show engine context
    // ADJUSTMENTS:
    // - Focus more on grille: target [0, 0.5, 2]
    // - Lower dramatic angle: position [3, 0.4, 6]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SUSPENSION SECTION - Side/rear view to show stance and suspension
  // ─────────────────────────────────────────────────────────────────────────
  suspension: {
    position: [-5, 0.8, 4],     // Left side, low angle
    target: [0, 0, 0],          // Car center
    fov: 48,
    // ADJUSTMENTS:
    // - Show rear suspension: position [-5, 0.8, -3]
    // - Lower to emphasize stance: position [-5, 0.3, 4]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WHEELS SECTION - Low angle focusing on wheels
  // ─────────────────────────────────────────────────────────────────────────
  wheels: {
    position: [4, 0.4, 3],      // Low, front-right angle
    target: [0.8, 0.3, 1.5],    // Focus on front-right wheel area
    fov: 55,                    // Wider to show wheel detail
    // ADJUSTMENTS:
    // - Focus on rear wheel: position [4, 0.4, -2], target [0.8, 0.3, -1.5]
    // - More dramatic: position [3, 0.2, 2]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INTERIOR SECTION - Side view looking into cabin
  // ─────────────────────────────────────────────────────────────────────────
  interior: {
    position: [3.5, 1.3, 1.5],  // Right side, cabin level
    target: [0, 0.9, 0.3],      // Look at interior/dashboard area
    fov: 52,
    // ADJUSTMENTS:
    // - Closer to window: position [2.5, 1.2, 1]
    // - Show more dashboard: target [0, 0.8, 0.8]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ENGINE BAY SECTION - Top-down view of engine compartment
  // ─────────────────────────────────────────────────────────────────────────
  enginebay: {
    position: [1.5, 3.5, 3],    // Above and in front
    target: [0, 0.5, 1.5],      // Look at engine bay area
    fov: 50,
    // ADJUSTMENTS:
    // - More top-down: position [0, 4, 2]
    // - Angled view: position [2.5, 3, 2.5]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GALLERY SECTION - Rear 3/4 beauty shot
  // ─────────────────────────────────────────────────────────────────────────
  gallery: {
    position: [-4, 1.5, -5],    // Left-rear angle
    target: [0, 0.2, 0],        // Car center, slightly low
    fov: 45,
    // ADJUSTMENTS:
    // - Show more rear: position [0, 1.5, -7]
    // - Dramatic low: position [-4, 0.5, -5]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FREE ROAM SECTION - Starting position for free exploration
  // ─────────────────────────────────────────────────────────────────────────
  freeroam: {
    position: [5, 2, 6],        // Classic 3/4 view, good starting point
    target: [0, 0, 0],
    fov: 45,
    // Note: In free roam, OrbitControls takes over after initial position
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT SECTION - Final beauty shot
  // ─────────────────────────────────────────────────────────────────────────
  contact: {
    position: [0, 1.5, 8],      // Direct front view
    target: [0, 0, 0],
    fov: 42,                    // Slightly telephoto for compression
    // ADJUSTMENTS:
    // - More cinematic: fov: 35, position: [0, 1.2, 10]
  },
}

/**
 * Maps section index to section ID
 * Must match the order of sections in ScrollExperience.jsx
 */
const SECTION_ORDER = [
  'hero',
  'engine', 
  'suspension',
  'wheels',
  'interior',
  'enginebay',
  'gallery',
  'freeroam',
  'contact'
]

/**
 * CameraController Component
 * 
 * Smoothly animates the camera between section configurations based on scroll progress.
 * 
 * @param {Object} props
 * @param {React.RefObject} props.scrollProgressRef - Ref containing scroll progress (0-1)
 * @param {boolean} props.freeRoamActive - When true, camera control is handed to OrbitControls
 */
export default function CameraController({ scrollProgressRef, freeRoamActive }) {
  const { camera } = useThree()
  
  // Current interpolated values for smooth transitions
  const currentValues = useRef({
    position: new THREE.Vector3(5, 1.5, 7),
    target: new THREE.Vector3(0, 0, 0),
    fov: 45
  })
  
  // Target values that we're interpolating towards
  const targetValues = useRef({
    position: new THREE.Vector3(5, 1.5, 7),
    target: new THREE.Vector3(0, 0, 0),
    fov: 45
  })

  // Initialize camera position
  useEffect(() => {
    const heroConfig = CAMERA_CONFIGS.hero
    camera.position.set(...heroConfig.position)
    camera.lookAt(...heroConfig.target)
    camera.fov = heroConfig.fov
    camera.updateProjectionMatrix()
    
    currentValues.current.position.set(...heroConfig.position)
    currentValues.current.target.set(...heroConfig.target)
    currentValues.current.fov = heroConfig.fov
  }, [camera])

  useFrame((state, delta) => {
    // Skip camera animation when in free roam (OrbitControls handles it)
    if (freeRoamActive) return
    
    const scrollProgress = scrollProgressRef?.current || 0
    const numSections = SECTION_ORDER.length
    
    // Calculate which sections we're between
    const exactSection = scrollProgress * (numSections - 1)
    const currentSectionIndex = Math.floor(exactSection)
    const nextSectionIndex = Math.min(currentSectionIndex + 1, numSections - 1)
    const sectionProgress = exactSection - currentSectionIndex
    
    // Get section IDs
    const currentSectionId = SECTION_ORDER[currentSectionIndex]
    const nextSectionId = SECTION_ORDER[nextSectionIndex]
    
    // Get camera configs
    const currentConfig = CAMERA_CONFIGS[currentSectionId]
    const nextConfig = CAMERA_CONFIGS[nextSectionId]
    
    // Interpolate target values based on scroll progress
    // Using smooth easing for more natural transitions
    const easedProgress = smoothstep(sectionProgress)
    
    targetValues.current.position.lerpVectors(
      new THREE.Vector3(...currentConfig.position),
      new THREE.Vector3(...nextConfig.position),
      easedProgress
    )
    
    targetValues.current.target.lerpVectors(
      new THREE.Vector3(...currentConfig.target),
      new THREE.Vector3(...nextConfig.target),
      easedProgress
    )
    
    targetValues.current.fov = currentConfig.fov + (nextConfig.fov - currentConfig.fov) * easedProgress
    
    // Smooth interpolation towards target values (frame-rate independent)
    const lerpSpeed = 4 // Lower = smoother but slower, Higher = snappier
    const lerpFactor = 1 - Math.exp(-lerpSpeed * delta)
    
    currentValues.current.position.lerp(targetValues.current.position, lerpFactor)
    currentValues.current.target.lerp(targetValues.current.target, lerpFactor)
    currentValues.current.fov += (targetValues.current.fov - currentValues.current.fov) * lerpFactor
    
    // Apply to camera
    camera.position.copy(currentValues.current.position)
    camera.lookAt(currentValues.current.target)
    
    // Update FOV if changed
    if (Math.abs(camera.fov - currentValues.current.fov) > 0.01) {
      camera.fov = currentValues.current.fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}

/**
 * Smoothstep easing function for natural transitions
 * Creates smooth acceleration and deceleration
 */
function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

/**
 * ============================================================================
 * QUICK REFERENCE - COMMON CAMERA ADJUSTMENTS
 * ============================================================================
 * 
 * TO ZOOM IN:
 * - Move camera closer (reduce distance from [0,0,0])
 * - Or reduce FOV (e.g., 45 → 35)
 * 
 * TO ZOOM OUT:
 * - Move camera further away
 * - Or increase FOV (e.g., 45 → 60)
 * 
 * TO SHOW MORE OF ONE SIDE:
 * - Increase x for more right side visible
 * - Decrease x (negative) for more left side visible
 * 
 * TO LOOK DOWN AT CAR:
 * - Increase camera y position
 * - Decrease target y
 * 
 * TO LOOK UP AT CAR (DRAMATIC):
 * - Decrease camera y position (closer to ground)
 * - Increase target y
 * 
 * TO FOCUS ON SPECIFIC PART:
 * - Move target coordinates to that part
 * - Move camera closer to that area
 * 
 * FRONT OF CAR: z > 0 (positive z)
 * REAR OF CAR: z < 0 (negative z)
 * RIGHT SIDE: x > 0 (positive x)
 * LEFT SIDE: x < 0 (negative x)
 * 
 * ============================================================================
 */
