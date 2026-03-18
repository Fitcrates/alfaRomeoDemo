import { useMemo } from "react";
import * as THREE from "three";

/**
 * Procedural Sky Dome (Optimized)
 * 
 * Creates a dark twilight/dusk sky with:
 * - Deep navy-to-black vertical gradient
 * - Subtle warm glow near the horizon
 * - Static stars (no animation for performance)
 */
export default function Sky() {
  const { geometry, material } = useMemo(() => {
    // Lower polygon count for performance
    const geo = new THREE.SphereGeometry(60, 24, 16);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        // Sky colors - top to bottom
        uColorTop: { value: new THREE.Color("#020208") },
        uColorMid: { value: new THREE.Color("#0a0e1a") },
        uColorHorizon: { value: new THREE.Color("#0a0a0c") },
        uColorGlow: { value: new THREE.Color("#2a1408") },
        uGlowIntensity: { value: 0.3 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorMid;
        uniform vec3 uColorHorizon;
        uniform vec3 uColorGlow;
        uniform float uGlowIntensity;
        
        varying vec3 vWorldPosition;
        
        // Simple hash for static stars
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        void main() {
          vec3 dir = normalize(vWorldPosition);
          float height = dir.y;
          float h = max(height, 0.0);
          
          // Sky gradient
          vec3 sky = mix(uColorHorizon, uColorMid, smoothstep(0.0, 0.3, h));
          sky = mix(sky, uColorTop, smoothstep(0.2, 0.8, h));
          
          // Horizon glow (simplified)
          vec3 glowDir = normalize(vec3(0.7, 0.0, 0.7));
          float glowDot = max(dot(normalize(vec3(dir.x, 0.0, dir.z)), glowDir), 0.0);
          float horizonFactor = exp(-abs(height) / 0.08);
          sky += uColorGlow * (pow(glowDot, 4.0) * horizonFactor * uGlowIntensity + horizonFactor * 0.05);
          
          // Static stars (no animation)
          if (h > 0.1) {
            vec2 starUV = vec2(atan(dir.z, dir.x), acos(dir.y)) * 100.0;
            float star = step(0.98, hash(floor(starUV)));
            sky += vec3(0.8, 0.75, 0.7) * star * 0.3 * smoothstep(0.1, 0.4, h);
          }
          
          // Below horizon fade
          sky = mix(sky, uColorHorizon, smoothstep(0.0, -0.05, height));
          
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  return (
    <mesh geometry={geometry} material={material} renderOrder={-1} />
  );
}
