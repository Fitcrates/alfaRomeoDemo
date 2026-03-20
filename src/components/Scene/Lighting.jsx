import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function Lighting({ carPositionRef }) {
  const lightRef = useRef();

  useFrame(() => {
    if (!lightRef.current || !carPositionRef?.current) return;

    const car = carPositionRef.current;

    // Move the light to follow the car, keeping the same offset direction
    lightRef.current.position.set(car.x + 15, 10, car.z - 1);
    lightRef.current.target.position.set(car.x, 0, car.z);
    lightRef.current.target.updateMatrixWorld();
  });

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

  return (
    <>
      <ambientLight intensity={0.2} color="#f1a035" />

      <directionalLight
        ref={lightRef}
        position={[15, 10, -1]}
        intensity={1.5}
        color="#f5aa54"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      >
        {/* Target must be a child for .target to work */}
        <object3D />
      </directionalLight>
    </>
  )
}
