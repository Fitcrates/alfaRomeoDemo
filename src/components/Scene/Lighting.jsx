export default function Lighting() {

  return (
    <>
      {/* Soft ambient base - warm sunset tone */}
      <ambientLight intensity={0.2} color="#ffddbb" />

      {/* Sunset sky / dark ground hemisphere */}
      <hemisphereLight args={['#ff9966', '#1a1a2e', 0.4]} />

      {/* Main key light - warm sunset from front-right */}
      <directionalLight
        position={[8, 3, 8]}
        intensity={0.6}
        color="#ffaa77"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Secondary fill - front-left, warm orange */}
      <directionalLight
        position={[-6, 2, 6]}
        intensity={0.35}
        color="#ffbb88"
      />

      {/* Side fill - subtle warm */}
      <directionalLight
        position={[-8, 1.5, 0]}
        intensity={0.15}
        color="#dd9977"
      />
    </>
  )
}
