# CALDIM SmartAssist Companion — 3D Robotic Puppy Asset Specification

**Document Version:** 2.0 (Phase 2B)  
**Target Asset Path:** `public/models/caldim_dog.glb`  
**Target Runtime:** Three.js r186 / React Three Fiber / WebGL 2.0  
**Target Frame Rate:** 60 FPS on 1080p/4K Touchscreen Exhibition Displays  

---

## 1. Character Identity & Visual Direction

The **CALDIM SmartAssist Companion** is an intelligent, friendly robotic puppy designed as the centerpiece of an industrial-AI exhibition kiosk. It represents high-precision engineering, approachable warmth, and advanced industrial automation.

### Key Visual Characteristics:
- **Silhouette:** Expressive, aerodynamic quadruped silhouette with a balanced stance, curious head posture, perked aerodynamic ears, and a segmented flexible tail.
- **Surface Quality:** Smooth, automotive-grade rounded surfaces with subtle recessed panel lines (0.5mm), chamfered mechanical seams, and precision metallic pivot joints.
- **Color Palette (Brand Compliant):**
  - **Primary Shell:** Glossy Pearl White (`#FFFFFF` to `#F0F4F4`), high gloss, subtle pearl clearcoat.
  - **Secondary Metal:** Dark Anodized Titanium (`#3D4D4C` / `#223030`) for leg joints, shoulder pivots, and tail connectors.
  - **Brand Accent:** Deep Teal (`#084C4A`) and Primary Teal (`#0F6B68`) on collar, flank trim, and paw pads.
  - **Luminous Elements:** Cyan Visor Eyes & Collar Emblem (`#4ED2CB`), emissive glow (bloom-ready).
- **Emblem:** A geometric CALDIM stylized chevron / circuit emblem embedded into the center of the collar.

---

## 2. Geometry & Performance Budgets

| Specification | Target Value | Hard Limit |
|---|---|---|
| **File Format** | Binary GLTF (`.glb`) | Single self-contained file |
| **File Size** | 6 MB - 12 MB | < 15 MB |
| **Triangle Count** | 28,000 - 38,000 tris | 45,000 tris |
| **Draw Calls** | 4 to 6 material slots | Max 8 draw calls |
| **Texture Maps** | 2048 × 2048 px (PBR textures) | Max 2048 × 2048 px (PNG/WEBP) |
| **Bounding Box** | Height: ~0.95m, Length: ~1.15m, Width: ~0.55m | Centered at (0, 0, 0) on ground |

---

## 3. Armature & Bone Hierarchy

The model must be rigged with a single root armature matching standard WebGL animation standards (Y-up, Z-forward).

```
Root (Bone)
 └── Pelvis
      ├── Spine_01
      │    └── Spine_02
      │         └── Chest
      │              ├── Neck
      │              │    └── Head
      │              │         ├── Jaw (Speaking articulation)
      │              │         ├── Ear_L (Attentive perking)
      │              │         ├── Ear_R (Attentive perking)
      │              │         └── Visor_Root (Optional pupil/blink controls)
      │              ├── Shoulder_L
      │              │    └── Leg_Upper_FL
      │              │         └── Leg_Lower_FL
      │              │              └── Paw_FL
      │              └── Shoulder_R
      │                   └── Leg_Upper_FR
      │                        └── Leg_Lower_FR
      │                             └── Paw_FR
      ├── Tail_01
      │    └── Tail_02
      │         └── Tail_03 (Tip indicator)
      ├── Hip_L
      │    └── Leg_Upper_BL
      │         └── Leg_Lower_BL
      │              └── Paw_BL
      └── Hip_R
           └── Leg_Upper_BR
                └── Leg_Lower_BR
                     └── Paw_BR
```

### Bone Naming Rules:
- Names must strictly follow the exact casing in the tree above.
- Left/Right symmetry must use `_L` / `_R` or `_FL` / `_FR` / `_BL` / `_BR` suffixes.

---

## 4. Animation Clip Matrix (11 Required States)

All animation clips must be baked into the single `.glb` file as named NLA tracks / animation clips.

| Clip Name | Loop Mode | Frame Count (at 30 FPS) | Primary Motion & Expressive Intent |
|---|---|---|---|
| **`Idle`** | Loop | 60 frames (2.0s) | Gentle torso breathing, subtle ear micro-adjustments, steady quadruped stance. |
| **`Greeting`** | Once | 75 frames (2.5s) | Head lifts cheerfully, tail wags twice, slight friendly bow of front paws. |
| **`Happy`** | Loop | 45 frames (1.5s) | Fast, energetic tail wag, playful front paw bounce, excited posture. |
| **`Listening`** | Loop | 60 frames (2.0s) | Both ears perk sharply forward, head tilts 12° to the left, attentive posture. |
| **`Thinking`** | Loop | 60 frames (2.0s) | Head slowly pans left-to-right as if scanning blueprints, subtle breathing. |
| **`Speaking`** | Loop | 45 frames (1.5s) | Head affirms forward, jaw opens/closes rhythmically, vocal posture. |
| **`DocumentReceived`** | Once | 60 frames (2.0s) | Head lowers to inspect/sniff incoming document, nods with satisfaction. |
| **`AnswerReady`** | Once | 60 frames (2.0s) | Crisp affirmative head nod, ears stand tall, steady alert stance. |
| **`AutomationActive`** | Loop | 40 frames (1.33s) | Rhythmic quadruped trot/stride in place, steady mechanical movement. |
| **`NeedsApproval`** | Loop | 60 frames (2.0s) | Sits back slightly, raises right front paw attentively awaiting operator signoff. |
| **`Error`** | Loop | 60 frames (2.0s) | Head shakes slowly side-to-side, ears droop slightly, cautious posture. |

---

## 5. PBR Material Definitions

| Material Name | Base Color | Metallic | Roughness | Emissive | Description |
|---|---|---|---|---|---|
| `M_Caldim_Chassis` | `#FFFFFF` | 0.12 | 0.18 | None | Pearl-white automotive gloss shell with subtle reflection. |
| `M_Caldim_TealAccent` | `#0F6B68` | 0.35 | 0.30 | None | Satin CALDIM brand teal for collar and accent stripes. |
| `M_Caldim_DeepTeal` | `#084C4A` | 0.45 | 0.35 | None | Dark teal for joints and structural chassis recesses. |
| `M_Caldim_MetalJoint` | `#3A4A49` | 0.85 | 0.22 | None | Dark titanium brushed metal for pivots and fasteners. |
| `M_Caldim_VisorEye` | `#031414` | 0.10 | 0.10 | `#4ED2CB` (Intensity: 2.5) | Luminous cyan visor glass with inner glowing pupil graphics. |
| `M_Caldim_CollarLED` | `#084C4A` | 0.20 | 0.20 | `#4ED2CB` (Intensity: 1.8) | Glowing CALDIM emblem on collar center. |

---

## 6. Export Settings for Blender

1. **Format:** `glTF 2.0 (.glb)`
2. **Include:** Selected Objects (Armature + Meshes)
3. **Transform:** `+Y Up`
4. **Geometry:**
   - Apply Modifiers: Checked
   - Tangents: Checked
   - Normals: Checked
5. **Animation:**
   - Animations: Checked
   - Group by NLA Track: Checked
   - Export Deformation Bones Only: Checked
   - Sample Animations: Checked (Sampling Rate: 1)
6. **Destination Path:** `C:\caldim_smartAI\caldim_smartassist_companion\public\models\caldim_dog.glb`
