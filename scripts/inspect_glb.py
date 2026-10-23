import json
import struct

with open('public/models/caldim_dog.glb', 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len))

print("=== MESHES ===")
for i, m in enumerate(gltf.get('meshes', [])):
    targets = [p.get('targets') for p in m.get('primitives', []) if 'targets' in p]
    target_names = m.get('extras', {}).get('targetNames', [])
    weights = m.get('weights', [])
    print(f"Mesh {i}: {m['name']} | targets: {len(targets)} | weights: {weights} | targetNames: {target_names}")

print("\n=== SKINS & JOINTS ===")
for skin in gltf.get('skins', []):
    joints = [gltf['nodes'][j]['name'] for j in skin['joints']]
    print(f"Skin: {skin.get('name', 'unnamed')} ({len(joints)} joints): {joints}")

print("\n=== NODES ===")
for i, n in enumerate(gltf.get('nodes', [])):
    mesh_idx = n.get('mesh')
    mesh_name = gltf['meshes'][mesh_idx]['name'] if mesh_idx is not None else '-'
    print(f"Node {i}: {n.get('name')} | mesh: {mesh_name}")

print("\n=== MATERIALS ===")
for i, mat in enumerate(gltf.get('materials', [])):
    pbr = mat.get('pbrMetallicRoughness', {})
    emissive = mat.get('emissiveFactor', [0, 0, 0])
    print(f"Mat {i}: {mat.get('name')} | emissive: {emissive}")
