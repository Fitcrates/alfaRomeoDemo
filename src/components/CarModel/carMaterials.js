import * as THREE from 'three'

// Material configuration for the car model
export function configureCarMaterials(model) {
  const hoodMaterialsRef = []
  const wheelsRef = []

  model.traverse((child) => {
    if (child.isMesh) {
      const materialName = child.material?.name || ''
      const meshName = child.name || ''
      const isGlassLike = /glass|window|windshield/i.test(`${materialName} ${meshName}`)

      // Detect wheel meshes
      if (materialName.includes('Wheel') || materialName.includes('wheel')) {
        const localPos = child.position.clone()
        let parent = child.parent
        while (parent && parent !== model) {
          localPos.applyMatrix4(parent.matrix)
          parent = parent.parent
        }

        child.userData.isFrontWheel = localPos.z > 0
        child.userData.isLeftWheel = localPos.x < 0
        child.userData.initialQuaternion = child.quaternion.clone()
        wheelsRef.push(child)
      }

      child.castShadow = !isGlassLike
      child.receiveShadow = !isGlassLike

      if (child.material) {
        child.material = child.material.clone()
        child.material.side = THREE.DoubleSide

        if (child.material.transparent) {
          child.material.depthWrite = true
        }

        const matName = child.material.name

        // Red glass (taillights)
        if (matName === 'red_glass') {
          child.material.color.setHex(0xcc1010)
          child.material.transparent = true
          child.material.opacity = 0.85
          child.material.roughness = 0.08
          child.material.metalness = 0
          child.material.transmission = 0.9
          child.material.thickness = 0.55
          child.material.ior = 1.45
          child.material.depthWrite = false
          child.renderOrder = 10
        }
        // Orange glass (indicators)
        else if (matName === 'orange_glass') {
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
        }
        // Light glass (headlights)
        else if (matName === 'light_glass') {
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
        // Interior materials
        else if (
          matName === 'QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017InteriorA_Material1' ||
          matName === 'color_Int'
        ) {
          child.material.transparent = false
          child.material.opacity = 1
          child.material.depthWrite = true
          child.material.envMapIntensity = 1.0
        }
        // Emissive materials (lights)
        else if (
          matName === 'emiss' ||
          matName === 'QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017LightA_Material1'
        ) {
          child.material.toneMapped = false
        }
        // All other materials
        else {
          if (child.material.emissive) {
            child.material.emissive.setHex(0x000000)
            child.material.emissiveIntensity = 0
          }

          // Hood/bonnet detection
          const meshNameLower = meshName.toLowerCase()
          if (
            meshNameLower.includes('hood') ||
            meshNameLower.includes('bonnet') ||
            meshNameLower.includes('cofano')
          ) {
            child.material.transparent = true
            child.material.depthWrite = true
            child.material.opacity = 1.0
            hoodMaterialsRef.push({ mesh: child, material: child.material })
          }

          // Body paint
          if (matName.includes('Paint_Material')) {
            child.material.transparent = true
            child.material.depthWrite = true
            child.material.opacity = 1.0
            if (!child.material.userData.isBodyPaint) {
              child.material.userData.isBodyPaint = true
              hoodMaterialsRef.push({ mesh: child, material: child.material })
            }
          }
        }
      }
    }
  })

  return { hoodMaterialsRef, wheelsRef }
}

// Apply car color
export function applyCarColor(model, carColor) {
  if (!carColor || !model) return

  model.traverse((child) => {
    if (child.isMesh && child.material) {
      const name = (child.material.name || child.name || '').toLowerCase()

      if (name.includes('body') || name.includes('paint') || name.includes('car')) {
        if (child.material.color) {
          child.material.color.set(carColor)
        }
        child.material.toneMapped = true
        if (child.material.emissive) {
          child.material.emissive.setHex(0x000000)
          child.material.emissiveIntensity = 0
        }
      }
    }
  })
}

// Update hood transparency
export function updateHoodTransparency(hoodMaterials, targetOpacity, delta) {
  hoodMaterials.forEach((item) => {
    if (item.material) {
      const currentOpacity = item.material.opacity
      item.material.opacity = currentOpacity + (targetOpacity - currentOpacity) * 0.15
    }
  })
}

// Update wheel visuals
export function updateWheelVisuals(wheels, physics, isBurnout, delta) {
  const wheelRadius = 0.34
  const spinDelta = isBurnout ? delta * 80 : (physics.speed * delta) / wheelRadius
  
  // Store accumulated rotation
  if (!wheels._rotation) wheels._rotation = 0
  wheels._rotation += spinDelta

  const wheelBase = 2.82
  const trackWidth = 1.6

  // Ackermann steering
  let innerAngle = physics.steeringAngle
  let outerAngle = physics.steeringAngle

  if (Math.abs(physics.steeringAngle) > 0.01) {
    const turnRadius = wheelBase / Math.tan(Math.abs(physics.steeringAngle))
    innerAngle = Math.atan(wheelBase / (turnRadius - trackWidth / 2))
    outerAngle = Math.atan(wheelBase / (turnRadius + trackWidth / 2))
    if (physics.steeringAngle < 0) {
      innerAngle = -innerAngle
      outerAngle = -outerAngle
    }
  }

  wheels.forEach((wheel) => {
    const isLeftWheel = wheel.userData.isLeftWheel
    const isFrontWheel = wheel.userData.isFrontWheel
    const initialQuat = wheel.userData.initialQuaternion

    if (!initialQuat) return

    const q = initialQuat.clone()

    // Steering on front wheels
    if (isFrontWheel) {
      const turningLeft = physics.steeringAngle > 0
      const isInnerWheel =
        (turningLeft && isLeftWheel) ||
        (!turningLeft && !isLeftWheel)

      const steerAngle = isInnerWheel ? innerAngle : outerAngle
      const steerQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        steerAngle
      )
      q.premultiply(steerQuat)
    }

    // Rolling rotation
    let spinRotation
    if (isBurnout && isFrontWheel) {
      spinRotation = 0
    } else {
      spinRotation = isLeftWheel ? -wheels._rotation : wheels._rotation
    }
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      spinRotation
    )
    q.multiply(rollQuat)

    wheel.quaternion.copy(q)
  })
}

// Reset wheels to initial rotation
export function resetWheels(wheels) {
  wheels.forEach((wheel) => {
    if (wheel.userData.initialQuaternion) {
      wheel.quaternion.copy(wheel.userData.initialQuaternion)
    }
  })
}

// Idle wheel spin (engine on but not driving)
export function updateIdleWheels(wheels, delta) {
  if (!wheels._idleRotation) wheels._idleRotation = 0
  wheels._idleRotation += delta * 0.5

  wheels.forEach((wheel) => {
    const isLeftWheel = wheel.userData.isLeftWheel
    const initialQuat = wheel.userData.initialQuaternion
    if (!initialQuat) return

    const q = initialQuat.clone()
    const spinRotation = isLeftWheel ? -wheels._idleRotation : wheels._idleRotation
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      spinRotation
    )
    q.multiply(rollQuat)
    wheel.quaternion.copy(q)
  })
}