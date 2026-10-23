# CALDIM SmartAssist Companion — 3D Asset Directory

This directory is the designated production location for the 3D robotic companion model.

## Target Asset File:
`public/models/caldim_dog.glb`

## Requirements:
1. **Format**: Binary GLTF (`.glb`)
2. **File Size**: Target < 15 MB for smooth kiosk loading and responsive 60 FPS rendering.
3. **Materials**: PBR Metallic-Roughness:
   - Primary Chassis: Glossy White / Pearl Silver (`#FFFFFF` / `#E8EEEE`)
   - Brand Collar & Accents: CALDIM Deep Teal (`#0F6B68` / `#084C4A`)
   - Emissive Visor Eyes & LED Indicators: Cyan Glow (`#4ED2CB`)
4. **Armature Hierarchy**:
   - `Root` / `Pelvis`
   - `Spine_01`, `Spine_02`, `Chest`
   - `Neck`, `Head`, `Jaw`
   - `Ear_L`, `Ear_R`
   - `Tail_01`, `Tail_02`, `Tail_03`
   - Quadruped legs (`Leg_Upper_[L/R]_[F/B]`, `Leg_Lower_[L/R]_[F/B]`, `Paw_[L/R]_[F/B]`)
5. **Animation Clips**:
   - `Idle` (Looping subtle breathing / stance)
   - `Greeting` (Head lift, paw raise, or bow)
   - `Happy` (Tail wag and excited stance)
   - `Listening` (Ears perked, attentive head tilt)
   - `Thinking` (Attentive searching motion)
   - `Speaking` (Vocal gesture / jaw articulation)
   - `DocumentReceived` (Attentive sniff / inspection)
   - `AnswerReady` (Affirmative nod / confident alert)
   - `AutomationActive` (Rhythmic work / trot cycle)
   - `NeedsApproval` (Attentive waiting pose with raised paw)
   - `Error` (Confused head shake / caution gesture)

## Asset Creation:
Run the Blender automation script located at:
`scripts/blender/create_caldim_dog_blender.py`
or export from your DCC software directly into this directory.
