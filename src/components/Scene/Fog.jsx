import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FogParticle({ position, speed, size }) {
  const meshRef = useRef()
  const initialPos = useMemo(() => [...position], [position])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = initialPos[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3
      meshRef.current.position.x = initialPos[0] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.2
      meshRef.current.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.05
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color="#1a1a2e"
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function Fog({ particleCount = 30 }) {
  const particles = useMemo(() => {
    const items = []
    for (let i = 0; i < particleCount; i++) {
      items.push({
        position: [
          (Math.random() - 0.5) * 15,
          -1 + Math.random() * 1.5,
          (Math.random() - 0.5) * 15
        ],
        speed: 0.3 + Math.random() * 0.5,
        size: 0.5 + Math.random() * 1.5
      })
    }
    return items
  }, [particleCount])

  return (
    <group>
      {particles.map((particle, i) => (
        <FogParticle key={i} {...particle} />
      ))}
      
      {/* Ground fog plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#0a0a0a"
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
