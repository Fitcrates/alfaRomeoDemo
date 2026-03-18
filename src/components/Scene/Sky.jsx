import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Procedural Sky Dome
 * 
 * Creates a dark twilight/dusk sky with:
 * - Deep navy-to-black vertical gradient
 * - Subtle warm glow near the horizon (matching sunset lighting)
 * - Optional subtle star field for visual interest
 * - All very muted so it doesn't compete with the car or UI
 */
export default function Sky() {
  const meshRef = useRef();

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(60, 32, 32);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        // Sky colors - top to bottom
        uColorTop: { value: new THREE.Color("#020208") }, // Almost black
        uColorMid: { value: new THREE.Color("#0a0e1a") }, // Deep navy
        uColorHorizon: { value: new THREE.Color("#0a0a0c") }, // Match floor edge color
        uColorGlow: { value: new THREE.Color("#2a1408") }, // Subtle sunset glow (more muted)
        // Control how high the horizon glow reaches
        uGlowIntensity: { value: 0.35 },
        uGlowSpread: { value: 0.08 },
        uStarDensity: { value: 800.0 },
        uStarBrightness: { value: 0.4 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColorTop;
        uniform vec3 uColorMid;
        uniform vec3 uColorHorizon;
        uniform vec3 uColorGlow;
        uniform float uGlowIntensity;
        uniform float uGlowSpread;
        uniform float uStarDensity;
        uniform float uStarBrightness;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        // Hash function for pseudo-random stars
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        
        // Star field
        float stars(vec3 dir) {
          // Project direction onto a sphere grid
          vec3 n = normalize(dir);
          
          // Use spherical coordinates for consistent distribution
          float phi = atan(n.z, n.x);
          float theta = acos(n.y);
          
          vec2 uv = vec2(phi, theta) * uStarDensity / 6.28318;
          vec2 gv = fract(uv) - 0.5;
          vec2 id = floor(uv);
          
          float d = length(gv - (vec2(hash(id), hash(id + 1.0)) - 0.5) * 0.8);
          
          // Sharp star points
          float star = smoothstep(0.05, 0.0, d);
          
          // Vary brightness per star
          float brightness = hash(id + 2.0);
          // Only show ~30% of potential stars
          star *= step(0.7, brightness);
          // Vary individual star brightness
          star *= brightness * uStarBrightness;
          
          // Subtle twinkle
          star *= 0.7 + 0.3 * sin(uTime * (1.0 + hash(id + 3.0) * 2.0) + hash(id + 4.0) * 6.28);
          
          return star;
        }
        
        void main() {
          vec3 dir = normalize(vWorldPosition);
          
          // Normalized height: 0 at horizon, 1 at zenith
          // Using world Y position relative to camera
          float height = normalize(vWorldPosition).y;
          
          // ── Sky gradient ──────────────────────────────────────
          // Bottom half (below horizon) - just dark
          // Top half - gradient from horizon glow to deep black
          
          // Vertical gradient factor (0 = horizon, 1 = straight up)
          float h = max(height, 0.0);
          
          // Main sky gradient: horizon -> mid -> top
          vec3 sky = mix(uColorHorizon, uColorMid, smoothstep(0.0, 0.3, h));
          sky = mix(sky, uColorTop, smoothstep(0.2, 0.8, h));
          
          // ── Horizon glow ──────────────────────────────────────
          // Warm glow concentrated at horizon, slightly to the right
          // (matching your key light direction at [8, 3, 8])
          vec3 glowDir = normalize(vec3(0.7, 0.0, 0.7)); // Front-right
          float glowDot = max(dot(normalize(vec3(dir.x, 0.0, dir.z)), glowDir), 0.0);
          
          // Glow is strongest at horizon and in the light direction
          float horizonFactor = exp(-abs(height) / uGlowSpread);
          float glow = pow(glowDot, 4.0) * horizonFactor * uGlowIntensity;
          
          // Wider, softer ambient glow around the whole horizon
          float ambientGlow = horizonFactor * 0.08;
          
          sky += uColorGlow * (glow + ambientGlow);
          
          // ── Stars ─────────────────────────────────────────────
          // Only show stars above horizon, fade in gradually
          float starMask = smoothstep(0.05, 0.3, h);
          float starField = stars(vWorldPosition) * starMask;
          
          // Stars are slightly warm-tinted
          vec3 starColor = vec3(0.9, 0.85, 0.8);
          sky += starColor * starField;
          
          // ── Below horizon - fade to black ─────────────────────
          // Anything below horizon line should be dark
          float belowHorizon = smoothstep(0.0, -0.05, height);
          sky = mix(sky, vec3(0.0), belowHorizon);
          
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame((state) => {
    if (material.uniforms) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  );
}
