import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();

// ── Drift Effects ──
export default function DriftEffects({ carPositionRef, terrainMeshes = [] }) {
  const maxMarks = 1000;
  const maxSmoke = 1500;
  const meshRef = useRef();
  const smokeRef = useRef();
  const countRef = useRef(0);
  const smokeCountRef = useRef(0);
  const opacityRef = useRef(new Float32Array(maxMarks).fill(0));
  const dummy = useRef(new THREE.Object3D());
  const smokeDummy = useRef(new THREE.Object3D());
  
  // Custom smoke state containing positions and velocities
  const smokeData = useRef(Array.from({length: maxSmoke}, () => ({ 
    active: false, life: 0, x: 0, y: 0, z: 0, scale: 0, vx: 0, vy: 0, vz: 0 
  })));
  
  // Raycaster for terrain height detection
  const raycasterRef = useRef(new THREE.Raycaster());
  const rayOrigin = useRef(new THREE.Vector3());
  const rayDown = useRef(new THREE.Vector3(0, -1, 0));

  // Initialize ALL instances to zero-scale so uninitialised slots don't render
  // as a gray sphere blob at world origin (Three.js default matrix is all-zeros).
  useEffect(() => {
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    if (meshRef.current) {
      for (let i = 0; i < maxMarks; i++) meshRef.current.setMatrixAt(i, zeroMatrix);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (smokeRef.current) {
      for (let i = 0; i < maxSmoke; i++) smokeRef.current.setMatrixAt(i, zeroMatrix);
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame((_, delta) => {
    const car = carPositionRef?.current;
    if (!car || !meshRef.current) return;

    // Both drifting and burnout trigger effects
    const showEffects = car.isDrifting || car.isBurnout;

    if (showEffects) {
      const { x, y = 0, z, rotation, sidewaysSpeed = 0, speed = 0, isBurnout } = car;
      
      const addMarkAndSmoke = (offsetX, offsetZ) => {
        const worldX = x + Math.cos(rotation) * offsetX + Math.sin(rotation) * offsetZ;
        const worldZ = z - Math.sin(rotation) * offsetX + Math.cos(rotation) * offsetZ;
        
        // Raycast to find actual terrain height at this position
        let markY = y - 0.04; // Default: slightly below car
        if (terrainMeshes.length > 0) {
          rayOrigin.current.set(worldX, y + 5, worldZ);
          raycasterRef.current.set(rayOrigin.current, rayDown.current);
          raycasterRef.current.far = 15;
          const hits = raycasterRef.current.intersectObjects(terrainMeshes, false);
          if (hits.length > 0) {
            // Place mark 1cm above terrain to prevent z-fighting
            markY = hits[0].point.y + 0.01;
          }
        }
        // Fallback to prevent marks spawning below floor
        markY = Math.max(markY, -0.77);
        
        const d = dummy.current;
        d.position.set(worldX, markY, worldZ);
        
        // Reset rotation completely via quaternion to guarantee flat placement
        // Step 1: Lay flat on ground (rotate -90deg around X)
        // Step 2: Rotate around Y (world up) to align with travel direction
        let yawAngle;
        if (isBurnout) {
          // During burnout, marks align with car heading (rear wheels spin in place)
          yawAngle = rotation;
        } else {
          // During drift, marks align with actual travel direction
          yawAngle = Math.atan2(
            Math.sin(rotation) * speed + Math.cos(rotation) * sidewaysSpeed,
            Math.cos(rotation) * speed - Math.sin(rotation) * sidewaysSpeed
          );
        }
        
        // Use Euler with YXZ order: first apply Y rotation (heading), then X rotation (lay flat)
        _euler.set(-Math.PI / 2, yawAngle, 0, 'YXZ');
        d.quaternion.setFromEuler(_euler);
        
        // Scale mark length based on frame travel velocity to prevent dotted lines
        const totalVelocity = isBurnout ? 8 : Math.sqrt(speed * speed + sidewaysSpeed * sidewaysSpeed);
        const stretch = Math.max(0.6, totalVelocity * delta * 2.5);
        d.scale.set(0.35, stretch, 1);
        d.updateMatrix();
        
        const idx = countRef.current % maxMarks;
        meshRef.current.setMatrixAt(idx, d.matrix);
        
        // Opacity based on intensity
        const intensity = isBurnout ? 0.7 : Math.min(0.9, Math.abs(sidewaysSpeed) * 0.15);
        opacityRef.current[idx] = intensity;
        countRef.current++;

        // emit smoke - use the same terrain height we found for marks
        if (smokeRef.current && Math.random() > 0.2) {
            const smokeCount = isBurnout ? 5 : 3; // More smoke during burnout
            const smokeBaseY = markY + 0.15; // Start smoke slightly above terrain
            for(let i=0; i<smokeCount; i++) {
                const sIdx = smokeCountRef.current % maxSmoke;
                const s = smokeData.current[sIdx];
                s.active = true;
                s.life = 1.0;
                s.x = worldX + (Math.random() - 0.5) * 0.4;
                s.y = smokeBaseY;
                s.z = worldZ + (Math.random() - 0.5) * 0.4;
                s.scale = isBurnout ? (0.5 + Math.random() * 0.5) : (0.4 + Math.random() * 0.3);
                s.vx = (Math.random() - 0.5) * (isBurnout ? 3.0 : 2.0);
                s.vy = 1.5 + Math.random() * (isBurnout ? 3 : 2);
                s.vz = (Math.random() - 0.5) * (isBurnout ? 3.0 : 2.0);
                smokeCountRef.current++;
            }
        }
      };
      
      addMarkAndSmoke(-0.84, -1.6); // Left rear wheel
      addMarkAndSmoke(0.84, -1.6); // Right rear wheel
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
    
    // Smooth decay for all instances of skidmarks
    let needsUpdate = false;
    for (let i = 0; i < maxMarks; i++) {
      if (opacityRef.current[i] > 0) {
        opacityRef.current[i] -= delta * 0.10; // slow fade out
        if (opacityRef.current[i] < 0) opacityRef.current[i] = 0;
        
        const c = Math.max(0, opacityRef.current[i]);
        meshRef.current.setColorAt(i, new THREE.Color(c, c, c)); // Use color as opacity multiplier
        needsUpdate = true;
      }
    }
    if (needsUpdate && meshRef.current.instanceColor) {
       meshRef.current.instanceColor.needsUpdate = true;
    }

    // Update smoke physics
    if (smokeRef.current) {
        let smokeNeedsUpdate = false;
        for (let i = 0; i < maxSmoke; i++) {
            const s = smokeData.current[i];
            if (s.active) {
                s.life -= delta * 0.6; // smoke life depletes
                if (s.life > 0) {
                    s.x += s.vx * delta;
                    s.y += s.vy * delta;
                    s.z += s.vz * delta;
                    s.scale += delta * 1.5; // grows as it goes up
                    
                    smokeDummy.current.position.set(s.x, s.y, s.z);
                    // Shrink physically when nearing end of life to easily simulate alpha fade
                    const renderScale = s.life < 0.2 ? s.scale * (s.life * 5.0) : s.scale;
                    smokeDummy.current.scale.setScalar(renderScale);
                } else {
                    s.active = false;
                    smokeDummy.current.scale.setScalar(0);
                }
                smokeDummy.current.updateMatrix();
                smokeRef.current.setMatrixAt(i, smokeDummy.current.matrix);
                smokeNeedsUpdate = true;
            }
        }
        if (smokeNeedsUpdate) {
            smokeRef.current.instanceMatrix.needsUpdate = true;
        }
    }
  });

  return (
    <>
        {/* Tire marks - render first (lower renderOrder) */}
        <instancedMesh 
          ref={meshRef} 
          args={[null, null, maxMarks]} 
          frustumCulled={false}
          renderOrder={0}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
            color={0x000000} 
            transparent 
            opacity={0.8}
            blending={THREE.MultiplyBlending}
            premultipliedAlpha={true}
            depthWrite={false} 
          />
        </instancedMesh>
        
        {/* Smoke - render last (higher renderOrder) to appear on top */}
        <instancedMesh 
          ref={smokeRef} 
          args={[null, null, maxSmoke]} 
          frustumCulled={false}
          renderOrder={100}
        >
          <sphereGeometry args={[0.5, 6, 6]} />
          <meshBasicMaterial 
            color="#cccccc" 
            transparent 
            opacity={0.25}
            depthWrite={false}
            depthTest={true}
            side={THREE.FrontSide}
          />
        </instancedMesh>
    </>
  );
}
