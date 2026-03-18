import { useRef, useMemo } from 'react'
import { MeshReflectorMaterial, useTexture } from '@react-three/drei'
import { useThree, extend } from '@react-three/fiber'
import * as THREE from 'three'

// Custom shader material for radial gradient fade
class RadialFadeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        innerRadius: { value: 15.0 },
        outerRadius: { value: 50.0 },
        fadeColor: { value: new THREE.Color(0x000000) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float innerRadius;
        uniform float outerRadius;
        uniform vec3 fadeColor;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          float dist = length(vWorldPosition.xz);
          float fade = smoothstep(innerRadius, outerRadius, dist);
          // Apply exponential falloff for more natural fade
          fade = pow(fade, 1.5);
          gl_FragColor = vec4(fadeColor, fade);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  }
}

extend({ RadialFadeMaterial })

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
  asphaltMap.repeat.set(34, 34)
  asphaltMap.colorSpace = THREE.SRGBColorSpace
  asphaltMap.anisotropy = mapAnisotropy

  asphaltNormalMap.wrapS = THREE.RepeatWrapping
  asphaltNormalMap.wrapT = THREE.RepeatWrapping
  asphaltNormalMap.repeat.set(34, 34)
  asphaltNormalMap.anisotropy = mapAnisotropy

  asphaltRoughnessMap.wrapS = THREE.RepeatWrapping
  asphaltRoughnessMap.wrapT = THREE.RepeatWrapping
  asphaltRoughnessMap.repeat.set(34, 34)
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
        <planeGeometry args={[100, 100]} />
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

      {/* Radial gradient fade overlay - smooth transition to darkness */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.76, 0]}>
        <planeGeometry args={[120, 120]} />
        <radialFadeMaterial />
      </mesh>

      {/* Outer darkness ring to ensure complete black at edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
        <ringGeometry args={[48, 100, 64]} />
        <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical gradient cylinder for horizon fade */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[50, 50, 12, 64, 1, true]} />
        <shaderMaterial
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              // Gradient from bottom (transparent) to top (opaque)
              float alpha = smoothstep(0.0, 0.6, vUv.y);
              gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
            }
          `}
          transparent={true}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
