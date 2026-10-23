"""
CALDIM SmartAssist Companion — Custom 3D Robotic Puppy Generator
Script for Blender 3.x / 4.x (Python API)

Usage:
  blender --background --python scripts/blender/create_caldim_dog_blender.py

This script programmatically generates:
1. Production-quality industrial quadruped mesh with CALDIM brand PBR materials.
2. Complete 25-bone skeletal rig matching Three.js r186 requirements.
3. 11 genuine animation actions/NLA tracks for all companion states:
   Idle, Greeting, Happy, Listening, Thinking, Speaking,
   DocumentReceived, AnswerReady, AutomationActive, NeedsApproval, Error.
4. Exports a self-contained GLB to public/models/caldim_dog.glb.
"""

import sys
import os
import math

try:
    import bpy
    import mathutils
except ImportError:
    print("This script is designed to run within Blender Python environment:")
    print("  blender --background --python scripts/blender/create_caldim_dog_blender.py")
    sys.exit(0)

# Target export path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

export_target = os.environ.get("CALDIM_EXPORT_PATH")
if not export_target:
    for i, arg in enumerate(sys.argv):
        if arg in ("--export-path", "-o") and i + 1 < len(sys.argv):
            export_target = sys.argv[i + 1]
            break

if not export_target:
    export_target = os.path.join(PROJECT_ROOT, "public", "models", "caldim_dog_candidate.glb")

EXPORT_PATH = os.path.abspath(export_target)
os.makedirs(os.path.dirname(EXPORT_PATH), exist_ok=True)

print(f"[CALDIM 3D] Target export destination: {EXPORT_PATH}")

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0

# 2. Setup CALDIM PBR Materials
def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, emissive=(0,0,0,1), emissive_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        # Blender 4.0+ uses 'Emission Color' and 'Emission Strength'
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emissive
            bsdf.inputs["Emission Strength"].default_value = emissive_strength
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = emissive
    return mat

mat_chassis = create_pbr_material("M_Caldim_Chassis", (0.96, 0.98, 0.98, 1.0), metallic=0.15, roughness=0.20)
mat_teal = create_pbr_material("M_Caldim_TealAccent", (0.059, 0.420, 0.408, 1.0), metallic=0.35, roughness=0.30)
mat_deep_teal = create_pbr_material("M_Caldim_DeepTeal", (0.031, 0.298, 0.290, 1.0), metallic=0.45, roughness=0.35)
mat_joint = create_pbr_material("M_Caldim_MetalJoint", (0.24, 0.30, 0.30, 1.0), metallic=0.85, roughness=0.25)
mat_visor = create_pbr_material("M_Caldim_VisorEye", (0.01, 0.08, 0.08, 1.0), metallic=0.10, roughness=0.10,
                                emissive=(0.306, 0.824, 0.796, 1.0), emissive_strength=2.8)
mat_collar_led = create_pbr_material("M_Caldim_CollarLED", (0.03, 0.30, 0.29, 1.0), metallic=0.20, roughness=0.20,
                                     emissive=(0.306, 0.824, 0.796, 1.0), emissive_strength=2.0)

# 3. Create Armature
bpy.ops.object.armature_add(enter_editmode=True, align='WORLD', location=(0, 0, 0))
armature_obj = bpy.context.object
armature_obj.name = "Armature_CaldimDog"
armature_data = armature_obj.data
armature_data.name = "Armature_Data"

edit_bones = armature_data.edit_bones
root_bone = edit_bones[0]
root_bone.name = "Root"
root_bone.head = (0, 0, 0.45)
root_bone.tail = (0, 0.1, 0.55)

pelvis = edit_bones.new("Pelvis")
pelvis.parent = root_bone
pelvis.head = (0, -0.15, 0.55)
pelvis.tail = (0, 0.05, 0.55)

spine_01 = edit_bones.new("Spine_01")
spine_01.parent = pelvis
spine_01.head = (0, 0.05, 0.55)
spine_01.tail = (0, 0.25, 0.58)

spine_02 = edit_bones.new("Spine_02")
spine_02.parent = spine_01
spine_02.head = (0, 0.25, 0.58)
spine_02.tail = (0, 0.40, 0.60)

chest = edit_bones.new("Chest")
chest.parent = spine_02
chest.head = (0, 0.40, 0.60)
chest.tail = (0, 0.50, 0.64)

neck = edit_bones.new("Neck")
neck.parent = chest
neck.head = (0, 0.50, 0.64)
neck.tail = (0, 0.58, 0.78)

head = edit_bones.new("Head")
head.parent = neck
head.head = (0, 0.58, 0.78)
head.tail = (0, 0.75, 0.82)

jaw = edit_bones.new("Jaw")
jaw.parent = head
jaw.head = (0, 0.66, 0.76)
jaw.tail = (0, 0.76, 0.74)

ear_l = edit_bones.new("Ear_L")
ear_l.parent = head
ear_l.head = (-0.12, 0.58, 0.86)
ear_l.tail = (-0.18, 0.52, 1.02)

ear_r = edit_bones.new("Ear_R")
ear_r.parent = head
ear_r.head = (0.12, 0.58, 0.86)
ear_r.tail = (0.18, 0.52, 1.02)

tail_01 = edit_bones.new("Tail_01")
tail_01.parent = pelvis
tail_01.head = (0, -0.28, 0.58)
tail_01.tail = (0, -0.38, 0.68)

tail_02 = edit_bones.new("Tail_02")
tail_02.parent = tail_01
tail_02.head = (0, -0.38, 0.68)
tail_02.tail = (0, -0.46, 0.78)

tail_03 = edit_bones.new("Tail_03")
tail_03.parent = tail_02
tail_03.head = (0, -0.46, 0.78)
tail_03.tail = (0, -0.52, 0.85)

# Leg Bone Pairs
def add_leg(side, x_sign, is_front, y_pos):
    prefix = f"FL" if (is_front and x_sign < 0) else f"FR" if is_front else f"BL" if x_sign < 0 else f"BR"
    parent_bone = chest if is_front else pelvis
    
    upper = edit_bones.new(f"Leg_Upper_{prefix}")
    upper.parent = parent_bone
    upper.head = (x_sign * 0.16, y_pos, 0.50)
    upper.tail = (x_sign * 0.16, y_pos - (0.02 if is_front else -0.04), 0.26)
    
    lower = edit_bones.new(f"Leg_Lower_{prefix}")
    lower.parent = upper
    lower.head = upper.tail
    lower.tail = (x_sign * 0.16, y_pos + (0.02 if is_front else -0.02), 0.08)
    
    paw = edit_bones.new(f"Paw_{prefix}")
    paw.parent = lower
    paw.head = lower.tail
    paw.tail = (x_sign * 0.16, y_pos + 0.08, 0.0)

add_leg("L", -1, True, 0.42)
add_leg("R", 1, True, 0.42)
add_leg("L", -1, False, -0.20)
add_leg("R", 1, False, -0.20)

bpy.ops.object.mode_set(mode='OBJECT')

print(f"[CALDIM 3D] Armature generated with {len(armature_data.bones)} bones.")

# 4. Create Aerodynamic Quadruped Meshes
def create_subd_cylinder(name, location, radius, depth, mat, parent_bone):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = armature_obj
    # Add smooth shading
    for poly in obj.data.polygons:
        poly.use_smooth = True
    # Bind to armature
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = armature_obj
    vg = obj.vertex_groups.new(name=parent_bone)
    vg.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    return obj

def create_subd_sphere(name, location, radius, mat, parent_bone):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = armature_obj
    for poly in obj.data.polygons:
        poly.use_smooth = True
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = armature_obj
    vg = obj.vertex_groups.new(name=parent_bone)
    vg.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    return obj

# Torso Pod
torso = create_subd_sphere("Mesh_Torso", (0, 0.12, 0.56), 0.28, mat_chassis, "Spine_01")
torso.scale = (0.75, 1.45, 0.85)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Head Pod
head_mesh = create_subd_sphere("Mesh_Head", (0, 0.65, 0.80), 0.18, mat_chassis, "Head")
head_mesh.scale = (0.85, 1.15, 0.85)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Cyan Visor Eyes
visor_mesh = create_subd_cylinder("Mesh_VisorEye", (0, 0.74, 0.82), 0.08, 0.16, mat_visor, "Head")
visor_mesh.rotation_euler = (math.radians(90), 0, math.radians(90))
visor_mesh.scale = (0.5, 0.35, 1.1)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# Collar & Luminous Gem
collar_mesh = create_subd_cylinder("Mesh_Collar", (0, 0.54, 0.70), 0.17, 0.06, mat_teal, "Neck")
collar_mesh.rotation_euler = (math.radians(45), 0, 0)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

collar_gem = create_subd_sphere("Mesh_CollarGem", (0, 0.62, 0.68), 0.035, mat_collar_led, "Neck")

# Ears
ear_l_mesh = create_subd_cylinder("Mesh_Ear_L", (-0.15, 0.55, 0.94), 0.04, 0.18, mat_chassis, "Ear_L")
ear_r_mesh = create_subd_cylinder("Mesh_Ear_R", (0.15, 0.55, 0.94), 0.04, 0.18, mat_chassis, "Ear_R")

# Tail Segments
tail_mesh_1 = create_subd_cylinder("Mesh_Tail_01", (0, -0.33, 0.63), 0.03, 0.14, mat_joint, "Tail_01")
tail_mesh_2 = create_subd_cylinder("Mesh_Tail_02", (0, -0.42, 0.73), 0.025, 0.14, mat_chassis, "Tail_02")
tail_mesh_3 = create_subd_sphere("Mesh_Tail_03", (0, -0.49, 0.82), 0.035, mat_collar_led, "Tail_03")

# Leg Meshes & Paws
for prefix, x_sign, y_pos in [("FL", -1, 0.42), ("FR", 1, 0.42), ("BL", -1, -0.20), ("BR", 1, -0.20)]:
    create_subd_cylinder(f"Mesh_LegUpper_{prefix}", (x_sign * 0.16, y_pos, 0.38), 0.045, 0.22, mat_joint, f"Leg_Upper_{prefix}")
    create_subd_cylinder(f"Mesh_LegLower_{prefix}", (x_sign * 0.16, y_pos, 0.17), 0.035, 0.18, mat_chassis, f"Leg_Lower_{prefix}")
    paw = create_subd_sphere(f"Mesh_Paw_{prefix}", (x_sign * 0.16, y_pos + 0.04, 0.04), 0.055, mat_deep_teal, f"Paw_{prefix}")
    paw.scale = (0.8, 1.3, 0.6)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# 5. Build Animation Actions & NLA Tracks
bpy.context.view_layer.objects.active = armature_obj
armature_obj.select_set(True)

def create_action(name, keyframes_dict):
    act = bpy.data.actions.new(name=name)
    armature_obj.animation_data_create()
    armature_obj.animation_data.action = act
    
    for bone_name, data in keyframes_dict.items():
        pbone = armature_obj.pose.bones.get(bone_name)
        if not pbone:
            continue
        pbone.rotation_mode = 'XYZ'
        if isinstance(data, dict) and ("rot" in data or "loc" in data):
            if "rot" in data:
                for frame, rot in data["rot"].items():
                    pbone.rotation_euler = rot
                    pbone.keyframe_insert(data_path="rotation_euler", frame=frame)
            if "loc" in data:
                for frame, loc in data["loc"].items():
                    pbone.location = loc
                    pbone.keyframe_insert(data_path="location", frame=frame)
        else:
            for frame, rot in data.items():
                pbone.rotation_euler = rot
                pbone.keyframe_insert(data_path="rotation_euler", frame=frame)
            
    # Push to NLA so glTF exporter bakes all actions
    nla_tracks = armature_obj.animation_data.nla_tracks
    track = nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, act)
    return act

# Define Keyframes for the 11 Character States
idle_anim = {
    "Spine_01": {1: (0, 0, 0), 30: (math.radians(2), 0, 0), 60: (0, 0, 0)},
    "Neck": {1: (0, 0, 0), 30: (math.radians(-3), 0, 0), 60: (0, 0, 0)},
    "Tail_01": {1: (0, 0, 0), 30: (0, 0, math.radians(8)), 60: (0, 0, 0)},
    "Tail_02": {1: (0, 0, 0), 30: (0, 0, math.radians(14)), 60: (0, 0, 0)},
}

greeting_anim = {
    "Head": {1: (0, 0, 0), 25: (math.radians(-15), 0, 0), 50: (math.radians(10), 0, 0), 75: (0, 0, 0)},
    "Ear_L": {1: (0, 0, 0), 25: (math.radians(-12), 0, 0), 75: (0, 0, 0)},
    "Ear_R": {1: (0, 0, 0), 25: (math.radians(-12), 0, 0), 75: (0, 0, 0)},
    "Tail_01": {1: (0, 0, 0), 20: (0, 0, math.radians(25)), 40: (0, 0, math.radians(-25)), 60: (0, 0, math.radians(20)), 75: (0, 0, 0)},
}

happy_anim = {
    "Tail_01": {1: (0, 0, math.radians(30)), 12: (0, 0, math.radians(-30)), 24: (0, 0, math.radians(30)), 36: (0, 0, math.radians(-30)), 45: (0, 0, math.radians(30))},
    "Tail_02": {1: (0, 0, math.radians(40)), 12: (0, 0, math.radians(-40)), 24: (0, 0, math.radians(40)), 36: (0, 0, math.radians(-40)), 45: (0, 0, math.radians(40))},
    "Head": {1: (math.radians(6), 0, 0), 22: (math.radians(-8), 0, 0), 45: (math.radians(6), 0, 0)},
    "Ear_L": {1: (math.radians(-15), 0, 0), 22: (math.radians(5), 0, 0), 45: (math.radians(-15), 0, 0)},
    "Ear_R": {1: (math.radians(-15), 0, 0), 22: (math.radians(5), 0, 0), 45: (math.radians(-15), 0, 0)},
}

listening_anim = {
    "Head": {1: (0, 0, 0), 20: (0, 0, math.radians(14)), 60: (0, 0, math.radians(14))},
    "Ear_L": {1: (0, 0, 0), 15: (math.radians(-20), 0, 0), 60: (math.radians(-20), 0, 0)},
    "Ear_R": {1: (0, 0, 0), 15: (math.radians(-20), 0, 0), 60: (math.radians(-20), 0, 0)},
    "Tail_01": {1: (0, 0, 0), 30: (0, 0, math.radians(5)), 60: (0, 0, 0)},
}

thinking_anim = {
    "Head": {1: (0, math.radians(-12), 0), 30: (0, math.radians(12), 0), 60: (0, math.radians(-12), 0)},
    "Neck": {1: (math.radians(4), 0, 0), 30: (math.radians(-4), 0, 0), 60: (math.radians(4), 0, 0)},
    "Tail_01": {1: (0, 0, 0), 30: (0, 0, math.radians(-8)), 60: (0, 0, 0)},
}

speaking_anim = {
    "Jaw": {1: (0, 0, 0), 10: (math.radians(15), 0, 0), 20: (0, 0, 0), 30: (math.radians(18), 0, 0), 45: (0, 0, 0)},
    "Head": {1: (0, 0, 0), 15: (math.radians(6), 0, 0), 30: (math.radians(-4), 0, 0), 45: (0, 0, 0)},
    "Ear_L": {1: (0, 0, 0), 20: (math.radians(-10), 0, 0), 45: (0, 0, 0)},
    "Ear_R": {1: (0, 0, 0), 20: (math.radians(-10), 0, 0), 45: (0, 0, 0)},
}

doc_received_anim = {
    "Head": {1: (0, 0, 0), 25: (math.radians(22), 0, 0), 45: (math.radians(15), 0, 0), 60: (0, 0, 0)},
    "Ear_L": {1: (0, 0, 0), 25: (math.radians(-15), 0, 0), 60: (0, 0, 0)},
    "Tail_01": {1: (0, 0, 0), 25: (0, 0, math.radians(15)), 60: (0, 0, 0)},
}

answer_ready_anim = {
    "Head": {1: (0, 0, 0), 15: (math.radians(18), 0, 0), 30: (math.radians(-8), 0, 0), 45: (math.radians(15), 0, 0), 60: (0, 0, 0)},
    "Ear_L": {1: (0, 0, 0), 20: (math.radians(-18), 0, 0), 60: (0, 0, 0)},
    "Ear_R": {1: (0, 0, 0), 20: (math.radians(-18), 0, 0), 60: (0, 0, 0)},
    "Tail_01": {1: (0, 0, 0), 30: (0, 0, math.radians(18)), 60: (0, 0, 0)},
}

automation_anim = {
    "Leg_Upper_FL": {1: (math.radians(15), 0, 0), 20: (math.radians(-15), 0, 0), 40: (math.radians(15), 0, 0)},
    "Leg_Upper_FR": {1: (math.radians(-15), 0, 0), 20: (math.radians(15), 0, 0), 40: (math.radians(-15), 0, 0)},
    "Leg_Upper_BL": {1: (math.radians(-15), 0, 0), 20: (math.radians(15), 0, 0), 40: (math.radians(-15), 0, 0)},
    "Leg_Upper_BR": {1: (math.radians(15), 0, 0), 20: (math.radians(-15), 0, 0), 40: (math.radians(15), 0, 0)},
    "Tail_01": {1: (0, 0, math.radians(10)), 20: (0, 0, math.radians(-10)), 40: (0, 0, math.radians(10))},
}

approval_anim = {
    "Leg_Upper_FR": {1: (0, 0, 0), 25: (math.radians(-35), 0, 0), 60: (math.radians(-35), 0, 0)},
    "Head": {1: (0, 0, 0), 25: (math.radians(-10), 0, 0), 60: (math.radians(-10), 0, 0)},
    "Tail_01": {1: (0, 0, 0), 30: (0, 0, math.radians(12)), 60: (0, 0, 0)},
}

error_anim = {
    "Head": {1: (0, math.radians(-15), 0), 15: (0, math.radians(15), 0), 30: (0, math.radians(-15), 0), 45: (0, math.radians(15), 0), 60: (0, 0, 0)},
    "Ear_L": {1: (0, 0, 0), 20: (math.radians(12), 0, 0), 60: (0, 0, 0)},
    "Ear_R": {1: (0, 0, 0), 20: (math.radians(12), 0, 0), 60: (0, 0, 0)},
}

petting_anim = {
    "Head": {1: (0, 0, 0), 20: (math.radians(-8), 0, 0), 40: (math.radians(-12), 0, 0), 60: (math.radians(-4), 0, 0), 80: (0, 0, 0)},
    "Ear_L": {1: (0, 0, 0), 25: (math.radians(10), 0, math.radians(-14)), 55: (math.radians(10), 0, math.radians(-14)), 80: (0, 0, 0)},
    "Ear_R": {1: (0, 0, 0), 25: (math.radians(10), 0, math.radians(14)), 55: (math.radians(10), 0, math.radians(14)), 80: (0, 0, 0)},
    "Tail_01": {1: (0, 0, math.radians(18)), 20: (0, 0, math.radians(-18)), 40: (0, 0, math.radians(18)), 60: (0, 0, math.radians(-18)), 80: (0, 0, math.radians(18))},
    "Tail_02": {1: (0, 0, math.radians(24)), 20: (0, 0, math.radians(-24)), 40: (0, 0, math.radians(24)), 60: (0, 0, math.radians(-24)), 80: (0, 0, math.radians(24))},
}

# PHASE 8 NEW ARTICULATED ANIMATIONS

sit_down_anim = {
    "Root": {"loc": {1: (0, 0, 0), 30: (0, -0.05, -0.08), 60: (0, -0.08, -0.14)}},
    "Pelvis": {1: (0, 0, 0), 30: (math.radians(-10), 0, 0), 60: (math.radians(-18), 0, 0)},
    "Spine_01": {1: (0, 0, 0), 30: (math.radians(6), 0, 0), 60: (math.radians(12), 0, 0)},
    "Chest": {1: (0, 0, 0), 30: (math.radians(4), 0, 0), 60: (math.radians(8), 0, 0)},
    "Neck": {1: (0, 0, 0), 30: (math.radians(-4), 0, 0), 60: (math.radians(-8), 0, 0)},
    "Head": {1: (0, 0, 0), 30: (math.radians(-5), 0, 0), 60: (math.radians(-10), 0, 0)},
    "Leg_Upper_BL": {1: (0, 0, 0), 30: (math.radians(35), 0, 0), 60: (math.radians(62), 0, 0)},
    "Leg_Lower_BL": {1: (0, 0, 0), 30: (math.radians(-45), 0, 0), 60: (math.radians(-82), 0, 0)},
    "Paw_BL": {1: (0, 0, 0), 30: (math.radians(12), 0, 0), 60: (math.radians(22), 0, 0)},
    "Leg_Upper_BR": {1: (0, 0, 0), 30: (math.radians(35), 0, 0), 60: (math.radians(62), 0, 0)},
    "Leg_Lower_BR": {1: (0, 0, 0), 30: (math.radians(-45), 0, 0), 60: (math.radians(-82), 0, 0)},
    "Paw_BR": {1: (0, 0, 0), 30: (math.radians(12), 0, 0), 60: (math.radians(22), 0, 0)},
    "Leg_Upper_FL": {1: (0, 0, 0), 30: (math.radians(5), 0, 0), 60: (math.radians(10), 0, 0)},
    "Leg_Lower_FL": {1: (0, 0, 0), 30: (math.radians(-4), 0, 0), 60: (math.radians(-8), 0, 0)},
    "Paw_FL": {1: (0, 0, 0), 60: (math.radians(-2), 0, 0)},
    "Leg_Upper_FR": {1: (0, 0, 0), 30: (math.radians(5), 0, 0), 60: (math.radians(10), 0, 0)},
    "Leg_Lower_FR": {1: (0, 0, 0), 30: (math.radians(-4), 0, 0), 60: (math.radians(-8), 0, 0)},
    "Paw_FR": {1: (0, 0, 0), 60: (math.radians(-2), 0, 0)},
    "Tail_01": {1: (0, 0, 0), 30: (math.radians(-10), 0, math.radians(6)), 60: (math.radians(-20), 0, math.radians(14))},
    "Tail_02": {1: (0, 0, 0), 30: (math.radians(-8), 0, math.radians(10)), 60: (math.radians(-14), 0, math.radians(18))},
}

sit_idle_anim = {
    "Root": {"loc": {1: (0, -0.08, -0.14), 30: (0, -0.08, -0.136), 60: (0, -0.08, -0.14)}},
    "Pelvis": {1: (math.radians(-18), 0, 0), 30: (math.radians(-18), 0, 0), 60: (math.radians(-18), 0, 0)},
    "Spine_01": {1: (math.radians(12), 0, 0), 30: (math.radians(13.5), 0, 0), 60: (math.radians(12), 0, 0)},
    "Chest": {1: (math.radians(8), 0, 0), 30: (math.radians(9.5), 0, 0), 60: (math.radians(8), 0, 0)},
    "Neck": {1: (math.radians(-8), 0, 0), 30: (math.radians(-6), 0, 0), 60: (math.radians(-8), 0, 0)},
    "Head": {1: (math.radians(-10), 0, 0), 30: (math.radians(-12), 0, 0), 60: (math.radians(-10), 0, 0)},
    "Ear_L": {1: (0, 0, 0), 20: (math.radians(-6), 0, 0), 45: (math.radians(4), 0, 0), 60: (0, 0, 0)},
    "Ear_R": {1: (0, 0, 0), 25: (math.radians(-6), 0, 0), 50: (math.radians(4), 0, 0), 60: (0, 0, 0)},
    "Leg_Upper_BL": {1: (math.radians(62), 0, 0), 60: (math.radians(62), 0, 0)},
    "Leg_Lower_BL": {1: (math.radians(-82), 0, 0), 60: (math.radians(-82), 0, 0)},
    "Paw_BL": {1: (math.radians(22), 0, 0), 60: (math.radians(22), 0, 0)},
    "Leg_Upper_BR": {1: (math.radians(62), 0, 0), 60: (math.radians(62), 0, 0)},
    "Leg_Lower_BR": {1: (math.radians(-82), 0, 0), 60: (math.radians(-82), 0, 0)},
    "Paw_BR": {1: (math.radians(22), 0, 0), 60: (math.radians(22), 0, 0)},
    "Leg_Upper_FL": {1: (math.radians(10), 0, 0), 60: (math.radians(10), 0, 0)},
    "Leg_Lower_FL": {1: (math.radians(-8), 0, 0), 60: (math.radians(-8), 0, 0)},
    "Paw_FL": {1: (math.radians(-2), 0, 0), 60: (math.radians(-2), 0, 0)},
    "Leg_Upper_FR": {1: (math.radians(10), 0, 0), 60: (math.radians(10), 0, 0)},
    "Leg_Lower_FR": {1: (math.radians(-8), 0, 0), 60: (math.radians(-8), 0, 0)},
    "Paw_FR": {1: (math.radians(-2), 0, 0), 60: (math.radians(-2), 0, 0)},
    "Tail_01": {1: (math.radians(-20), 0, math.radians(14)), 30: (math.radians(-20), 0, math.radians(6)), 60: (math.radians(-20), 0, math.radians(14))},
    "Tail_02": {1: (math.radians(-14), 0, math.radians(18)), 30: (math.radians(-14), 0, math.radians(8)), 60: (math.radians(-14), 0, math.radians(18))},
}

stand_up_anim = {
    "Root": {"loc": {1: (0, -0.08, -0.14), 25: (0, -0.04, -0.06), 50: (0, 0, 0)}},
    "Pelvis": {1: (math.radians(-18), 0, 0), 25: (math.radians(-8), 0, 0), 50: (0, 0, 0)},
    "Spine_01": {1: (math.radians(12), 0, 0), 25: (math.radians(5), 0, 0), 50: (0, 0, 0)},
    "Chest": {1: (math.radians(8), 0, 0), 25: (math.radians(3), 0, 0), 50: (0, 0, 0)},
    "Neck": {1: (math.radians(-8), 0, 0), 25: (math.radians(-3), 0, 0), 50: (0, 0, 0)},
    "Head": {1: (math.radians(-10), 0, 0), 25: (math.radians(-4), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_BL": {1: (math.radians(62), 0, 0), 25: (math.radians(28), 0, 0), 50: (0, 0, 0)},
    "Leg_Lower_BL": {1: (math.radians(-82), 0, 0), 25: (math.radians(-35), 0, 0), 50: (0, 0, 0)},
    "Paw_BL": {1: (math.radians(22), 0, 0), 25: (math.radians(8), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_BR": {1: (math.radians(62), 0, 0), 25: (math.radians(28), 0, 0), 50: (0, 0, 0)},
    "Leg_Lower_BR": {1: (math.radians(-82), 0, 0), 25: (math.radians(-35), 0, 0), 50: (0, 0, 0)},
    "Paw_BR": {1: (math.radians(22), 0, 0), 25: (math.radians(8), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_FL": {1: (math.radians(10), 0, 0), 25: (math.radians(4), 0, 0), 50: (0, 0, 0)},
    "Leg_Lower_FL": {1: (math.radians(-8), 0, 0), 25: (math.radians(-3), 0, 0), 50: (0, 0, 0)},
    "Paw_FL": {1: (math.radians(-2), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_FR": {1: (math.radians(10), 0, 0), 25: (math.radians(4), 0, 0), 50: (0, 0, 0)},
    "Leg_Lower_FR": {1: (math.radians(-8), 0, 0), 25: (math.radians(-3), 0, 0), 50: (0, 0, 0)},
    "Paw_FR": {1: (math.radians(-2), 0, 0), 50: (0, 0, 0)},
    "Tail_01": {1: (math.radians(-20), 0, math.radians(14)), 25: (math.radians(-8), 0, math.radians(6)), 50: (0, 0, 0)},
    "Tail_02": {1: (math.radians(-14), 0, math.radians(18)), 25: (math.radians(-5), 0, math.radians(8)), 50: (0, 0, 0)},
}

turn_left_anim = {
    "Head": {1: (0, 0, 0), 25: (0, math.radians(-24), 0), 50: (0, 0, 0)},
    "Neck": {1: (0, 0, 0), 25: (0, math.radians(-14), 0), 50: (0, 0, 0)},
    "Chest": {1: (0, 0, 0), 25: (0, 0, math.radians(-10)), 50: (0, 0, 0)},
    "Spine_01": {1: (0, 0, 0), 25: (0, 0, math.radians(-6)), 50: (0, 0, 0)},
    "Leg_Upper_FR": {1: (0, 0, 0), 15: (math.radians(12), 0, math.radians(-6)), 35: (math.radians(-6), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_FL": {1: (0, 0, 0), 15: (math.radians(-10), 0, 0), 35: (math.radians(6), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_BR": {1: (0, 0, 0), 15: (math.radians(8), 0, math.radians(-4)), 35: (math.radians(-4), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_BL": {1: (0, 0, 0), 15: (math.radians(-8), 0, 0), 35: (math.radians(4), 0, 0), 50: (0, 0, 0)},
    "Tail_01": {1: (0, 0, 0), 25: (0, 0, math.radians(20)), 50: (0, 0, 0)},
    "Tail_02": {1: (0, 0, 0), 25: (0, 0, math.radians(26)), 50: (0, 0, 0)},
}

turn_right_anim = {
    "Head": {1: (0, 0, 0), 25: (0, math.radians(24), 0), 50: (0, 0, 0)},
    "Neck": {1: (0, 0, 0), 25: (0, math.radians(14), 0), 50: (0, 0, 0)},
    "Chest": {1: (0, 0, 0), 25: (0, 0, math.radians(10)), 50: (0, 0, 0)},
    "Spine_01": {1: (0, 0, 0), 25: (0, 0, math.radians(6)), 50: (0, 0, 0)},
    "Leg_Upper_FL": {1: (0, 0, 0), 15: (math.radians(12), 0, math.radians(6)), 35: (math.radians(-6), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_FR": {1: (0, 0, 0), 15: (math.radians(-10), 0, 0), 35: (math.radians(6), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_BL": {1: (0, 0, 0), 15: (math.radians(8), 0, math.radians(4)), 35: (math.radians(-4), 0, 0), 50: (0, 0, 0)},
    "Leg_Upper_BR": {1: (0, 0, 0), 15: (math.radians(-8), 0, 0), 35: (math.radians(4), 0, 0), 50: (0, 0, 0)},
    "Tail_01": {1: (0, 0, 0), 25: (0, 0, math.radians(-20)), 50: (0, 0, 0)},
    "Tail_02": {1: (0, 0, 0), 25: (0, 0, math.radians(-26)), 50: (0, 0, 0)},
}

walk_start_anim = {
    "Leg_Upper_FL": {1: (0, 0, 0), 15: (math.radians(7), 0, 0), 30: (math.radians(15), 0, 0)},
    "Leg_Upper_FR": {1: (0, 0, 0), 15: (math.radians(-7), 0, 0), 30: (math.radians(-15), 0, 0)},
    "Leg_Upper_BL": {1: (0, 0, 0), 15: (math.radians(-7), 0, 0), 30: (math.radians(-15), 0, 0)},
    "Leg_Upper_BR": {1: (0, 0, 0), 15: (math.radians(7), 0, 0), 30: (math.radians(15), 0, 0)},
    "Tail_01": {1: (0, 0, 0), 15: (0, 0, math.radians(5)), 30: (0, 0, math.radians(10))},
}

walk_stop_anim = {
    "Leg_Upper_FL": {1: (math.radians(15), 0, 0), 15: (math.radians(6), 0, 0), 30: (0, 0, 0)},
    "Leg_Upper_FR": {1: (math.radians(-15), 0, 0), 15: (math.radians(-6), 0, 0), 30: (0, 0, 0)},
    "Leg_Upper_BL": {1: (math.radians(-15), 0, 0), 15: (math.radians(-6), 0, 0), 30: (0, 0, 0)},
    "Leg_Upper_BR": {1: (math.radians(15), 0, 0), 15: (math.radians(6), 0, 0), 30: (0, 0, 0)},
    "Tail_01": {1: (0, 0, math.radians(10)), 15: (0, 0, math.radians(4)), 30: (0, 0, 0)},
}

actions = {
    "Idle": idle_anim,
    "Greeting": greeting_anim,
    "Happy": happy_anim,
    "Listening": listening_anim,
    "Thinking": thinking_anim,
    "Speaking": speaking_anim,
    "DocumentReceived": doc_received_anim,
    "AnswerReady": answer_ready_anim,
    "AutomationActive": automation_anim,
    "NeedsApproval": approval_anim,
    "Error": error_anim,
    "Petting": petting_anim,
    "Sit_Down": sit_down_anim,
    "Sit_Idle": sit_idle_anim,
    "Stand_Up": stand_up_anim,
    "Turn_Left": turn_left_anim,
    "Turn_Right": turn_right_anim,
    "Walk_Start": walk_start_anim,
    "Walk_Stop": walk_stop_anim,
}

for clip_name, kf in actions.items():
    create_action(clip_name, kf)
    print(f"[CALDIM 3D] Created genuine AnimationClip: {clip_name}")

# 6. Export to Self-Contained GLB
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_animations=True,
    export_nla_strips=True,
    export_def_bones=True,
    export_skins=True,
    export_yup=True
)

file_size_mb = os.path.getsize(EXPORT_PATH) / (1024 * 1024)
print(f"[CALDIM 3D] Successfully exported genuine GLB to: {EXPORT_PATH} ({file_size_mb:.2f} MB)")
