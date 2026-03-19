import { useRef, useMemo } from 'react'
import { MeshReflectorMaterial, useTexture } from '@react-three/drei'
import { useThree, extend } from '@react-three/fiber'
import * as THREE from 'three'

// Remove RadialFadeMaterial since user wants infinite floor without dark edge

export default function Floor() {
  const floorRef = useRef()
  const { gl } = useThree()
  const [asphaltMap, asphaltNormalMap, asphaltRoughnessMap] = useTexture([
    '/textures/asphalt.png',
    '/textures/asphalt-normal.png',
    '/textures/asphalt-roughness.png'
  ])

  const mapAnisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy())

  asphaltMap.wrapS = THREE.RepeatWrapping
  asphaltMap.wrapT = THREE.RepeatWrapping
  asphaltMap.repeat.set(340, 340) // Increased by 10x for 1000x1000 plane
  asphaltMap.colorSpace = THREE.SRGBColorSpace
  asphaltMap.anisotropy = mapAnisotropy

  asphaltNormalMap.wrapS = THREE.RepeatWrapping
  asphaltNormalMap.wrapT = THREE.RepeatWrapping
  asphaltNormalMap.repeat.set(340, 340)
  asphaltNormalMap.anisotropy = mapAnisotropy

  asphaltRoughnessMap.wrapS = THREE.RepeatWrapping
  asphaltRoughnessMap.wrapT = THREE.RepeatWrapping
  asphaltRoughnessMap.repeat.set(340, 340)
  asphaltRoughnessMap.anisotropy = mapAnisotropy

  return (
    <group>
      {/* Main floor */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.78, 0]}
        receiveShadow
      >
        <planeGeometry args={[1000, 1000]} />
        <MeshReflectorMaterial
          blur={[800, 400]}
          resolution={512}
          mixBlur={1.0}
          mixStrength={0.06}
          roughness={0.99}
          depthScale={0.2}
          minDepthThreshold={0.95}
          maxDepthThreshold={1.0}
          color="#020202"
          metalness={0.0}
          mirror={0.02}
          map={asphaltMap}
          normalMap={asphaltNormalMap}
          normalScale={[0.02, 0.02]}
          roughnessMap={asphaltRoughnessMap}
          reflectorOffset={0}
          envMapIntensity={0.0}
        />
      </mesh>
    </group>
  )
}
