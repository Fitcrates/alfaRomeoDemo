# Alfa Romeo Giulia 3D Model Documentation (giulia.glb)

## Model Overview
- **File:** `/models/giulia.glb`
- **Total Materials:** 25
- **Total Meshes:** 41
- **Total Textures:** 29 embedded images
- **Total Nodes:** 96

---

## Material Reference

### Body & Exterior
| Material Name | Type | Textures | Notes |
|--------------|------|----------|-------|
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Paint_Material1` | MeshPhysicalMaterial | None (color only) | Main car body paint, color: `#a20000` |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Carbon1_Material1` | MeshPhysicalMaterial | Diffuse 512x512 | Carbon fiber parts |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Base_Material1` | MeshPhysicalMaterial | None | Black base/undercarriage |

### Wheels & Brakes
| Material Name | Type | Textures | Notes |
|--------------|------|----------|-------|
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017_Wheel1A_3D_3DWheel1A_Material1` | MeshPhysicalMaterial | Diffuse 512x512 | Wheel rims |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017CalliperGloss_Material1` | MeshPhysicalMaterial | None | Red brake calipers `#c80000` |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017CalliperBadgeA_Material1` | MeshPhysicalMaterial | Diffuse (transparent) | Caliper badges |
| `phong5` | MeshPhysicalMaterial | None | Brake disc, color: `#555555` |

### Grilles & Badges
| Material Name | Type | Textures | Notes |
|--------------|------|----------|-------|
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Grille1A_Material1` | MeshPhysicalMaterial | Diffuse (transparent) | Front grille mesh |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Grille2A_Material1` | MeshPhysicalMaterial | Diffuse (transparent) | Secondary grille |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Grille3A_Material1` | MeshPhysicalMaterial | Diffuse (transparent) | Tertiary grille |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Grille4A_Material1` | MeshPhysicalMaterial | Diffuse | Lower grille |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Grille5A_Material1` | MeshPhysicalMaterial | Diffuse | Side grille |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Grille6A_Material1` | MeshPhysicalMaterial | Diffuse | Rear grille |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017BadgeA_Material1` | MeshPhysicalMaterial | Diffuse (transparent) | Alfa Romeo badges |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017ManufacturerPlateA_Material1` | MeshPhysicalMaterial | Diffuse | License plate |

### Windows & Glass
| Material Name | Type | Textures | Notes |
|--------------|------|----------|-------|
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Window_Material1` | MeshPhysicalMaterial | None | Tinted windows, opacity: 0.25 |

### Lamp Glass (CRITICAL - Custom Handling Required)
| Material Name | Color | Opacity | Transmission | Notes |
|--------------|-------|---------|--------------|-------|
| `light_glass` | `#ffffff` | 0.4 | 0.8 | Front headlight covers - clear with grain |
| `red_glass` | `#ff2020` | 0.85 | 0.6 | Rear lamp red tint plastic |
| `orange_glass` | `#ff6600` | 0.85 | 0.6 | Turn signal indicators |

### Interior
| Material Name | Type | Textures | Notes |
|--------------|------|----------|-------|
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017InteriorA_Material1` | MeshPhysicalMaterial | Diffuse 512x512, Normal | Main interior (seats, dashboard, trim) |
| `color_Int` | MeshPhysicalMaterial | Diffuse 512x512, Normal | Red interior accents `#bc0f00` |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017Coloured_Material1` | MeshPhysicalMaterial | Diffuse | Seatbelts |

### Lights & Emissive
| Material Name | Type | Textures | Notes |
|--------------|------|----------|-------|
| `emiss` | MeshPhysicalMaterial | Diffuse 512x512 | Emissive light elements (custom shader) |
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017LightA_Material1` | MeshPhysicalMaterial | Diffuse 512x512 | Main light housings (custom shader) |

### Engine
| Material Name | Type | Textures | Notes |
|--------------|------|----------|-------|
| `QuadrifoglioAlfaRomeo_GiuliaQuadrifoglio_2017EngineA_Material1` | MeshPhysicalMaterial | Diffuse (transparent) | Engine bay |

---

## Critical Rendering Fixes Applied

### 1. Light Geometry Problem
The light materials (`emiss`, `LightA_Material1`) span the ENTIRE car length (Z: -2.38m to +2.11m). Standard emissive coloring would make the whole car glow.

**Solution:** Custom shader using `onBeforeCompile` that masks emission by Z-coordinate:
- Front lights: Z > 1.35m (white emission)
- Rear lights: Z < -1.35m (red emission)
- Middle: No emission

### 2. Glass Materials (Transmission)
Original GLB uses Blender's transmission/IOR which Three.js doesn't auto-convert properly.

**Solution:** Manual configuration in `CarModel.jsx`:
```javascript
// red_glass example
child.material.color.setHex(0xff2020)
child.material.transparent = true
child.material.opacity = 0.85
child.material.transmission = 0.6
child.material.thickness = 0.5
child.material.ior = 1.5
```

### 3. Interior Transparency Bug
Interior materials (`InteriorA_Material1`, `color_Int`) were incorrectly marked as `transparent: true` with `opacity: 1`, causing render order issues.

**Solution:** Force `transparent: false` for solid interior materials.

### 4. Backface Culling
Interior was disappearing at certain angles due to single-sided rendering.

**Solution:** Apply `THREE.DoubleSide` to all materials.

---

## Shader Uniforms

| Uniform | Type | Range | Description |
|---------|------|-------|-------------|
| `uHeadlightLevel` | float | 0.0 - 1.0 | Controls lamp emission intensity |

---

## Lamp Glow Shader (Current Implementation)

The shader adds colored glow to lamps when `uHeadlightLevel > 0`:

```glsl
// Position masks (Z-coordinate based)
float frontMask = smoothstep(1.35, 1.75, vLocalPos.z);  // Front lamps
float rearMask = 1.0 - smoothstep(-1.75, -1.35, vLocalPos.z);  // Rear lamps

// Glow colors (tuned for realism)
vec3 frontGlow = vec3(1.0, 0.98, 1.0) * frontMask * uHeadlightLevel * 4.0;  // Cool white LED
vec3 rearGlow = vec3(1.0, 0.05, 0.02) * rearMask * uHeadlightLevel * 5.0;   // Pure red

// Final emission
float onBoost = 1.0 + uHeadlightLevel * 2.0;
totalEmissiveRadiance = baseEmissive * onBoost + frontGlow + rearGlow;
```

### Key Design Decisions:
1. **No emissive override when off** - Original material settings preserved
2. **Additive glow** - Glow is added on top of base texture, not replacing it
3. **Cool white front** - `vec3(1.0, 0.98, 1.0)` mimics modern LED headlights
4. **Pure red rear** - `vec3(1.0, 0.05, 0.02)` avoids orange tint

---

## Recent Fixes Log

### 2024-03-17: Lamp Rendering Refinement
- **Fixed:** White tint on lamps when lights off (removed `emissive = white` override)
- **Fixed:** Orange tint on front headlights (changed to cool white `1.0, 0.98, 1.0`)
- **Fixed:** Orange tint on rear taillights (changed to pure red `1.0, 0.05, 0.02`)
- **Fixed:** Free roam OrbitControls not working (z-index and pointer-events fix)
- **Fixed:** Bright floor reflections (reduced mirror strength, changed env to 'night')

---

## File: CarModel.jsx Key Settings

```javascript
// Lamp glass transmission settings
transmission: 0.6-0.8
thickness: 0.3-0.5
ior: 1.5
roughness: 0.1-0.15

// Interior materials
transparent: false
envMapIntensity: 1.0

// All materials
side: THREE.DoubleSide
```
