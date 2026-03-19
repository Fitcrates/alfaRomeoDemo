import { useRef } from 'react'
import { MeshReflectorMaterial, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function Floor() {
  const floorRef = useRef()
  const { gl } = useThree()

  const [asphaltMap, asphaltNormalMap, asphaltRoughnessMap] = useTexture([
    '/models/textures/asphalt_02_diff_1k.jpg',
    '/models/textures/asphalt_02_nor_gl_1k.jpg',
    '/models/textures/asphalt_02_rough_1k.jpg',
  ])

  const mapAnisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy())

    ;[asphaltMap, asphaltNormalMap, asphaltRoughnessMap].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(440, 440)
      tex.anisotropy = mapAnisotropy
    })

  asphaltMap.colorSpace = THREE.SRGBColorSpace

  return (
    <group>
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.78, 0]}
        receiveShadow
      >
        <planeGeometry args={[2000, 2000]} />
        <MeshReflectorMaterial
          blur={[400, 200]}
          resolution={512}
          mixBlur={0.8}
          mixStrength={0.4}        // ↑ was 0.06 — controls reflection visibility
          roughness={0.6}          // ↓ was 0.99 — lower = shinier/more reflective
          depthScale={0.2}
          minDepthThreshold={0.95}
          maxDepthThreshold={1.0}
          color="#3f3e3e"           // slightly brighter to see reflections
          metalness={0.01}           // ↑ was 0.0 — adds metallic reflectivity
          mirror={0.2}              // ↑ was 0.02 — direct mirror reflection strength
          map={asphaltMap}
          normalMap={asphaltNormalMap}
          normalScale={[0.02, 0.02]} // ↓ was 0.02 — less bumps = cleaner reflections
          roughnessMap={asphaltRoughnessMap}
          reflectorOffset={0}
          envMapIntensity={0.5}     // ↑ was 0.0 — picks up environment reflections
        />
      </mesh>
    </group>
  )
}