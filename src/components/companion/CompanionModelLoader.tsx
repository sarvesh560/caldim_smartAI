import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { CharacterState, ModelMetadata, QuadrupedMotion } from '../../types/character3d';
import { Character3DOrchestrator } from '../../services/character3dOrchestrator';

interface CompanionModelLoaderProps {
  url: string;
  characterState: CharacterState;
  activeMotion?: QuadrupedMotion | null;
  reducedMotion?: boolean;
  isPetting?: boolean;
  lookAt?: { x: number; y: number };
  onModelMetadataLoaded?: (metadata: ModelMetadata) => void;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onPartPointerDown?: (part: 'head' | 'ears' | 'body' | 'paw' | 'general', event: ThreeEvent<PointerEvent>) => void;
}

export const CompanionModelLoader: React.FC<CompanionModelLoaderProps> = ({
  url,
  characterState,
  activeMotion,
  reducedMotion = false,
  isPetting = false,
  lookAt = { x: 0, y: 0 },
  onModelMetadataLoaded,
  scale = 1.0,
  position = [0, 0, 0],
  rotation = [0, Math.PI - 0.28, 0],
  onPartPointerDown,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);

  // Dedicated Three.js AnimationMixer tied to this model's scene instance
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene]);

  // Orchestrator ref managing blending, procedural idle, and expression lighting
  const orchestratorRef = useRef<Character3DOrchestrator | null>(null);

  // Initialize and dispose orchestrator
  useEffect(() => {
    if (!gltf.scene) return;

    const orchestrator = new Character3DOrchestrator(gltf.scene, mixer, gltf.animations);
    orchestrator.setReducedMotion(reducedMotion);
    orchestrator.setState(characterState, isPetting);
    if (activeMotion) {
      orchestrator.playMotion(activeMotion);
    }
    orchestratorRef.current = orchestrator;

    return () => {
      orchestrator.dispose();
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
      orchestratorRef.current = null;
    };
  }, [gltf.scene, mixer, gltf.animations]);

  // Sync state transitions and petting
  useEffect(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.setState(characterState, isPetting);
    }
  }, [characterState, isPetting]);

  // Sync quadruped locomotion & posture transitions (Sit, Stand, Turn, Walk Start/Stop)
  useEffect(() => {
    if (orchestratorRef.current && activeMotion) {
      orchestratorRef.current.playMotion(activeMotion);
    }
  }, [activeMotion]);

  // Sync reduced motion preference
  useEffect(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.setReducedMotion(reducedMotion);
    }
  }, [reducedMotion]);

  // 1. Inspect model geometry, bones, skinning, and report metadata once per model/url
  useEffect(() => {
    if (!gltf.scene) return;

    let meshCount = 0;
    let skinnedMeshCount = 0;
    let boneCount = 0;
    let hasMorphTargets = false;
    const boneNames: string[] = [];

    gltf.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshCount++;
        obj.castShadow = true;
        obj.receiveShadow = true;

        if (obj.morphTargetInfluences && obj.morphTargetInfluences.length > 0) {
          hasMorphTargets = true;
        }
      }
      if (obj instanceof THREE.SkinnedMesh) {
        skinnedMeshCount++;
      }
      if (obj instanceof THREE.Bone) {
        boneCount++;
        boneNames.push(obj.name);
      }
    });

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    const clipNames = gltf.animations.map((c) => c.name);
    const activeClip = orchestratorRef.current?.getStatus().activeClip || clipNames[0] || 'Idle';

    const metadata: ModelMetadata = {
      url,
      status: 'loaded',
      clipNames,
      activeClip,
      meshCount,
      skinnedMeshCount,
      boneCount,
      hasMorphTargets,
      boundingBox: {
        x: parseFloat(size.x.toFixed(2)),
        y: parseFloat(size.y.toFixed(2)),
        z: parseFloat(size.z.toFixed(2)),
      },
      availableBones: boneNames,
      expression: orchestratorRef.current?.getStatus().expression || 'attentive',
      isIdleSchedulerActive: orchestratorRef.current?.getStatus().isIdleSchedulerActive ?? true,
      activeMotion: orchestratorRef.current?.getStatus().activeMotion || activeMotion || null,
    };

    if (onModelMetadataLoaded) {
      onModelMetadataLoaded(metadata);
    }
  }, [gltf.scene, gltf.animations, url, onModelMetadataLoaded]);

  // 2. Main frame update: R3F frame tick executes orchestrator update (mixer + procedural idle + gaze)
  useFrame((_, delta) => {
    if (orchestratorRef.current) {
      if (lookAt) {
        orchestratorRef.current.setLookAt(lookAt.x, lookAt.y);
      }
      orchestratorRef.current.update(delta);
    }
  });

  const handleScenePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const objName = (e.object?.name || '').toLowerCase();
    let part: 'head' | 'ears' | 'body' | 'paw' | 'general' = 'general';

    if (objName.includes('ear')) {
      part = 'ears';
    } else if (
      objName.includes('head') ||
      objName.includes('visor') ||
      objName.includes('eye') ||
      objName.includes('jaw')
    ) {
      part = 'head';
    } else if (
      objName.includes('paw') ||
      objName.includes('leglower') ||
      objName.includes('leg_lower')
    ) {
      part = 'paw';
    } else if (
      objName.includes('torso') ||
      objName.includes('chest') ||
      objName.includes('collar') ||
      objName.includes('gem') ||
      objName.includes('tail') ||
      objName.includes('legupper') ||
      objName.includes('leg_upper') ||
      objName.includes('spine')
    ) {
      part = 'body';
    }

    if (onPartPointerDown) {
      onPartPointerDown(part, e);
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
      onPointerDown={handleScenePointerDown}
    >
      <primitive object={gltf.scene} />
    </group>
  );
};
