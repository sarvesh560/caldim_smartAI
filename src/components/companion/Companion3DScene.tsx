import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { CompanionModelLoader } from './CompanionModelLoader';
import type { CharacterState, ModelMetadata, QuadrupedMotion } from '../../types/character3d';
import { CHARACTER_STATE_CONFIGS } from '../../types/character3d';
import { THEME } from '../../theme/theme';

interface Companion3DSceneProps {
  modelUrl?: string | null;
  characterState?: CharacterState;
  activeMotion?: QuadrupedMotion | null;
  reducedMotion?: boolean;
  interactiveOrbit?: boolean;
  isPetting?: boolean;
  lookAt?: { x: number; y: number };
  onFallbackTriggered?: (reason: string) => void;
  onModelMetadataLoaded?: (metadata: ModelMetadata) => void;
  onPartPointerDown?: (part: 'head' | 'ears' | 'body' | 'paw' | 'general', event: any) => void;
}

export const Companion3DScene: React.FC<Companion3DSceneProps> = ({
  modelUrl,
  characterState = 'idle',
  activeMotion,
  reducedMotion = false,
  interactiveOrbit = true,
  isPetting = false,
  lookAt = { x: 0, y: 0 },
  onFallbackTriggered,
  onModelMetadataLoaded,
  onPartPointerDown,
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const stateConfig = CHARACTER_STATE_CONFIGS[characterState] || CHARACTER_STATE_CONFIGS.idle;

  // If no model URL was supplied, trigger fallback immediately
  useEffect(() => {
    if (!modelUrl) {
      if (onFallbackTriggered) {
        onFallbackTriggered('No 3D GLB model path specified');
      }
    }
  }, [modelUrl, onFallbackTriggered]);

  const handleSceneError = (error: Error) => {
    const errorMsg = error?.message || 'Failed to initialize 3D scene or load model';
    setLoadError(errorMsg);
    if (onFallbackTriggered) {
      onFallbackTriggered(errorMsg);
    }
  };

  // Graceful in-scene error state
  if (loadError || !modelUrl) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SceneErrorBoundary
        onError={handleSceneError}
        fallback={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '16px',
              textAlign: 'center',
              color: THEME.colors.textSecondary,
              fontSize: '12px',
            }}
          >
            <span>3D context error. Falling back to 2D companion.</span>
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: [0.72, 0.68, 2.35], fov: 35, near: 0.1, far: 20 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: interactiveOrbit ? 'auto' : 'none',
          }}
        >
          {/* Studio Lighting Setup matching CALDIM Exhibition Kiosk Environment */}
          <ambientLight intensity={1.1} color="#E8F4F8" />

          {/* Key Light — crisp directional illumination from front-right */}
          <directionalLight
            position={[3.0, 4.0, 3.5]}
            intensity={1.7}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={10}
            shadow-bias={-0.0001}
            color="#FFFFFF"
          />

          {/* Front Soft Fill Light — clarifies visor, front chest, paws */}
          <directionalLight
            position={[0, 1.5, 3.0]}
            intensity={0.9}
            color="#F0F9FF"
          />

          {/* Teal Brand Rim & Fill Light (#3C918C) */}
          <directionalLight
            position={[-2.5, 2.5, 1.5]}
            intensity={1.0}
            color={THEME.colors.accentTeal}
          />

          {/* High-Gloss Rim Silhouette Light */}
          <directionalLight
            position={[0, 3.5, -3.5]}
            intensity={1.8}
            color="#BAE6FD"
          />

          {/* Dynamic Mood Light from Character State */}
          <pointLight
            position={[0, 1.2, 1.2]}
            intensity={0.8}
            color={stateConfig.moodLightColor}
            distance={3.5}
          />

          {/* Model Loading Suspension */}
          <Suspense fallback={null}>
            <CompanionModelLoader
              url={modelUrl}
              characterState={characterState}
              activeMotion={activeMotion}
              reducedMotion={reducedMotion}
              isPetting={isPetting}
              lookAt={lookAt}
              onModelMetadataLoaded={onModelMetadataLoaded}
              scale={1.0}
              position={[0, 0, 0]}
              rotation={[0, Math.PI - 0.28, 0]}
              onPartPointerDown={onPartPointerDown}
            />
          </Suspense>

          {/* Soft Ground Contact Shadow */}
          <ContactShadows
            position={[0, -0.015, 0]}
            opacity={0.52}
            scale={3.2}
            blur={2.0}
            far={1.4}
            resolution={512}
            color="#084C4A"
          />

          {/* Touch-Friendly Orbit Controls */}
          {interactiveOrbit && (
            <OrbitControls
              enableDamping
              dampingFactor={0.06}
              minDistance={1.4}
              maxDistance={4.2}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2 + 0.02}
              target={[0, 0.48, 0]}
            />
          )}
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
};
