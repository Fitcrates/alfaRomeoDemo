export default function Lighting() {
  return (
    <>
      {/* Soft ambient base to ensure darkest shadows aren't pitch black */}
      {/* Note: Three.js requires strict 6-character hex colors! Do not use 8-character alpha hex (like #RRGGBBAA). */}
      <ambientLight intensity={0.15} color="#f1a035" />

      {/* 
        MAIN SUN & SHADOW CASTER
        
        POSITION GUIDE [X, Y, Z]:
         X (Left/Right): Positive numbers move the sun to the RIGHT, negative to the LEFT.
         Y (Up/Down): Positive numbers raise the sun HIGHER in the sky.
         Z (Front/Back): Positive numbers place the sun in FRONT of the car (casting shadow BACKWARDS),
                         Negative numbers place the sun BEHIND the car (casting shadow FORWARDS).
                         
        In this case, [15, 10, -5] means: 
        15 units to the Right, 10 units Up, and 5 units Behind the car.
        This reverses your previous light by 180 degrees across the car!
        Match these numbers visually to where the blazing sun is in your HDRI map.
      */}
      <directionalLight
        position={[15, 10, -1]}
        intensity={0.35}
        color="#f5aa54"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
    </>
  )
}
