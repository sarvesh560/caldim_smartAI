/**
 * CALDIM SmartAssist Companion — Enhanced Animated 2D Robotic Puppy
 *
 * Phase 4: Interactive Pet Behaviour and Animation Polish
 *
 * Coordinated individual SVG element animations:
 * - Independent articulated left/right ears (perking, droop, asymmetrical questioning tilt)
 * - Articulated tail (calm sway, rapid wag, trot rhythm, happy petting wag)
 * - Visor eyes:
 *   * Gaze tracking (pupils subtly follow visitor's pointer / cursor)
 *   * Joyful crescent eyes during petting & happy states (^ ^)
 *   * Cyan glow pulse during listening
 *   * Laser scan line sweep during thinking
 *   * Red alert blink during error
 * - Articulated front paw:
 *   * Raised paw gesture during needsApproval and greeting
 *   * Gentle rhythmic paw tread during continuous petting
 * - Articulated head (attentive tilt, nod on answer ready, head shake on error, cursor tracking)
 * - Brand collar with live emissive LED status
 * - Full prefers-reduced-motion support
 */

import React from 'react';
import type { CharacterState } from '../../types/character3d';
import type { AnimationPhase } from '../../services/characterAnimationController';
import { CHARACTER_STATE_CONFIGS } from '../../types/character3d';

interface PuppyVectorArtProps {
  characterState: CharacterState;
  animationPhase?: AnimationPhase;
  isPetting?: boolean;
  lookAt?: { x: number; y: number }; // normalized -1 .. 1
  isReacting?: boolean;
  reducedMotion?: boolean;
  size?: number; // width & height in px
}

export const PuppyVectorArt: React.FC<PuppyVectorArtProps> = ({
  characterState = 'idle',
  animationPhase = 'settled',
  isPetting = false,
  lookAt = { x: 0, y: 0 },
  isReacting = false,
  reducedMotion = false,
  size = 270,
}) => {
  const config = CHARACTER_STATE_CONFIGS[characterState] || CHARACTER_STATE_CONFIGS.idle;

  // Independent Ear Rotations
  const getEarTransform = (side: 'left' | 'right') => {
    if (reducedMotion) return 'none';
    const sign = side === 'left' ? -1 : 1;

    if (isPetting) {
      // Relaxed ears flattened back slightly during petting
      return side === 'left' ? 'rotate(-12deg)' : 'rotate(12deg)';
    }

    switch (characterState) {
      case 'listening':
        // Both ears perked high and attentive
        return `rotate(${sign * 26}deg)`;
      case 'happy':
      case 'greeting':
        return `rotate(${sign * 20}deg)`;
      case 'error':
        // Both ears drooped down sad/concerned
        return `rotate(${sign * -14}deg)`;
      case 'thinking':
        // Asymmetrical curious puppy ear cock
        return side === 'left' ? 'rotate(-26deg)' : 'rotate(12deg)';
      case 'documentReceived':
        return `rotate(${sign * 16}deg)`;
      case 'needsApproval':
        return side === 'left' ? 'rotate(-10deg)' : 'rotate(20deg)';
      default:
        return isReacting ? `rotate(${sign * 18}deg)` : 'rotate(0deg)';
    }
  };

  // Articulated Tail Animation
  const getTailStyle = (): React.CSSProperties => {
    if (reducedMotion) {
      return { transformOrigin: '215px 190px' };
    }

    if (isPetting) {
      return {
        transformOrigin: '215px 190px',
        animation: 'tailWagFast 0.28s infinite alternate ease-in-out',
      };
    }
    if (characterState === 'happy' || isReacting) {
      return {
        transformOrigin: '215px 190px',
        animation: 'tailWagFast 0.35s infinite alternate ease-in-out',
      };
    }
    if (characterState === 'automationActive') {
      return {
        transformOrigin: '215px 190px',
        animation: 'tailWagFast 0.6s infinite alternate ease-in-out',
      };
    }
    if (characterState === 'error') {
      return {
        transformOrigin: '215px 190px',
        transform: 'rotate(-22deg)',
      };
    }
    // Idle calm gentle sway
    return {
      transformOrigin: '215px 190px',
      animation: 'tailSwayIdle 3.2s infinite alternate ease-in-out',
    };
  };

  // Articulated Head Animation + Cursor Tracking
  const getHeadStyle = (): React.CSSProperties => {
    if (reducedMotion) {
      return { transformOrigin: '105px 95px' };
    }

    // Pointer tracking offset
    const trackingTilt = lookAt.x * 4; // degrees
    const trackingY = lookAt.y * 2; // px

    if (isPetting) {
      return {
        transformOrigin: '105px 95px',
        transform: `rotate(${-4 + trackingTilt}deg) translateY(${4 + trackingY}px)`,
        transition: 'transform 0.25s ease-out',
      };
    }
    if (characterState === 'answerReady') {
      return {
        transformOrigin: '105px 95px',
        animation: 'headNod 1.2s infinite ease-in-out',
      };
    }
    if (characterState === 'error') {
      return {
        transformOrigin: '105px 95px',
        animation: 'headShake 1.4s infinite ease-in-out',
      };
    }
    if (characterState === 'listening') {
      return {
        transformOrigin: '105px 95px',
        transform: `rotate(${10 + trackingTilt}deg) translateY(${trackingY}px)`,
        transition: 'transform 0.3s ease',
      };
    }
    if (characterState === 'documentReceived') {
      return {
        transformOrigin: '105px 95px',
        transform: `rotate(${8 + trackingTilt}deg) translateY(${4 + trackingY}px)`,
        transition: 'transform 0.3s ease',
      };
    }
    if (characterState === 'thinking') {
      return {
        transformOrigin: '105px 95px',
        transform: `rotate(${-6 + trackingTilt}deg) translateY(${trackingY}px)`,
        transition: 'transform 0.3s ease',
      };
    }

    return {
      transformOrigin: '105px 95px',
      transform: `rotate(${trackingTilt}deg) translateY(${trackingY}px)`,
      transition: 'transform 0.25s ease-out',
    };
  };

  // Front Paw Gesture Style
  const getPawStyle = (): React.CSSProperties => {
    if (reducedMotion) {
      return {};
    }

    if (characterState === 'needsApproval') {
      // Raised inquisitive paw
      return {
        transformOrigin: '120px 185px',
        transform: 'rotate(-35deg)',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };
    }
    if (characterState === 'greeting') {
      // Friendly paw wave
      return {
        transformOrigin: '120px 185px',
        animation: 'pawWave 1.4s infinite ease-in-out',
      };
    }
    if (isPetting) {
      // Rhythmic paw tread
      return {
        animation: 'pawTread 0.5s infinite alternate ease-in-out',
      };
    }

    return {
      transition: 'transform 0.3s ease',
    };
  };

  // Joyful crescent eyes during happy or petting
  const showCrescentEyes = (isPetting || characterState === 'happy') && !reducedMotion;

  // Pupil cursor gaze offsets
  const pupilGazeX = reducedMotion ? 0 : lookAt.x * 3.5;
  const pupilGazeY = reducedMotion ? 0 : lookAt.y * 2.5;

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none', // SVG parts render smoothly; parent container captures gestures
        userSelect: 'none',
      }}
    >
      <svg
        viewBox="0 0 300 300"
        style={{
          width: '100%',
          height: '100%',
          transform: !reducedMotion && animationPhase === 'entry' ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.25s ease-out, filter 0.3s ease',
          filter: isPetting
            ? 'drop-shadow(0 16px 26px rgba(78, 210, 203, 0.28))'
            : 'drop-shadow(0 14px 22px rgba(8, 76, 74, 0.14))',
        }}
      >
        <defs>
          <linearGradient id="pvBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#E2EBEB" />
            <stop offset="100%" stopColor="#C8DADA" />
          </linearGradient>
          <linearGradient id="pvMetalJoint" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7E9695" />
            <stop offset="100%" stopColor="#4A6261" />
          </linearGradient>
          <linearGradient id="pvCollarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#084C4A" />
            <stop offset="50%" stopColor="#0F6B68" />
            <stop offset="100%" stopColor="#3C918C" />
          </linearGradient>

          <clipPath id="visorClip">
            <rect x="76" y="85" width="48" height="20" rx="10" />
          </clipPath>

          {/* Keyframe Animations */}
          <style>
            {`
              @keyframes tailWagFast {
                0% { transform: rotate(-15deg); }
                100% { transform: rotate(32deg); }
              }
              @keyframes tailSwayIdle {
                0% { transform: rotate(-4deg); }
                100% { transform: rotate(10deg); }
              }
              @keyframes headNod {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(12deg); }
              }
              @keyframes headShake {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-10deg); }
                75% { transform: rotate(10deg); }
              }
              @keyframes visorLaserSweep {
                0% { transform: translateX(-40px); opacity: 0.2; }
                50% { opacity: 1; }
                100% { transform: translateX(40px); opacity: 0.2; }
              }
              @keyframes pulseVisorGlow {
                0%, 100% { opacity: 0.75; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.15); }
              }
              @keyframes pawTread {
                0% { transform: translateY(0); }
                100% { transform: translateY(-4px); }
              }
              @keyframes pawWave {
                0%, 100% { transform: rotate(0deg); }
                30% { transform: rotate(-32deg); }
                60% { transform: rotate(-24deg); }
              }
            `}
          </style>
        </defs>

        {/* 1. Wagging Robotic Tail */}
        <g style={getTailStyle()}>
          <path
            d="M 215 190 Q 250 170 255 130 Q 258 120 248 122 Q 240 155 210 185 Z"
            fill="url(#pvBodyGrad)"
            stroke="#0F6B68"
            strokeWidth="2"
          />
          <circle cx="254" cy="122" r="5" fill={config.moodLightColor} />
        </g>

        {/* 2. Hind Leg & Pelvis Joint */}
        <ellipse cx="205" cy="195" rx="28" ry="24" fill="url(#pvBodyGrad)" stroke="#A0B8B7" strokeWidth="2" />
        <rect x="210" y="200" width="16" height="42" rx="8" fill="url(#pvMetalJoint)" />
        <path d="M 205 238 L 235 238 A 6 6 0 0 1 241 244 L 205 244 Z" fill="#084C4A" />

        {/* 3. Main Torso Pod */}
        <path
          d="M 115 130 C 170 120, 220 140, 225 185 C 225 210, 185 220, 135 215 C 105 210, 95 160, 115 130 Z"
          fill="url(#pvBodyGrad)"
          stroke="#0F6B68"
          strokeWidth="2.5"
        />
        {/* Engineering Chassis Seam Lines */}
        <line x1="140" y1="150" x2="190" y2="155" stroke="rgba(15, 107, 104, 0.3)" strokeWidth="2" strokeDasharray="4 3" />
        <line x1="145" y1="165" x2="195" y2="170" stroke="rgba(15, 107, 104, 0.3)" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="165" cy="182" r="6" fill={config.moodLightColor} opacity="0.85" />

        {/* 4. Articulated Front Leg & Paw */}
        <g style={getPawStyle()}>
          <rect x="110" y="180" width="20" height="62" rx="9" fill="url(#pvMetalJoint)" />
          <circle cx="120" cy="195" r="9" fill="#FFFFFF" stroke="#0F6B68" strokeWidth="2" />
          <path d="M 104 238 L 136 238 A 6 6 0 0 1 142 244 L 104 244 Z" fill="#084C4A" />
          {/* Paw Pad Indicator */}
          <ellipse cx="123" cy="242" rx="3.5" ry="2" fill="#4ED2CB" />
        </g>

        {/* 5. Glowing Brand Collar */}
        <path
          d="M 98 128 L 138 126 L 132 144 L 92 146 Z"
          fill="url(#pvCollarGrad)"
          stroke={config.moodLightColor}
          strokeWidth="1.5"
        />
        {/* Collar Center LED Emblem */}
        <circle
          cx="115"
          cy="137"
          r="4.5"
          fill={config.indicatorColor}
          style={{
            filter: `drop-shadow(0 0 6px ${config.moodLightColor})`,
          }}
        />

        {/* 6. Articulated Head & Face Group */}
        <g style={getHeadStyle()}>
          {/* Left Ear */}
          <g
            style={{
              transformOrigin: '90px 80px',
              transform: getEarTransform('left'),
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <path
              d="M 85 85 Q 60 50 78 35 Q 95 45 92 82 Z"
              fill="url(#pvBodyGrad)"
              stroke="#0F6B68"
              strokeWidth="2"
            />
            <path d="M 75 52 Q 85 45 86 70" stroke={config.moodLightColor} strokeWidth="2" fill="none" />
          </g>

          {/* Right Ear */}
          <g
            style={{
              transformOrigin: '125px 80px',
              transform: getEarTransform('right'),
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <path
              d="M 125 80 Q 150 48 135 34 Q 115 42 118 80 Z"
              fill="url(#pvBodyGrad)"
              stroke="#0F6B68"
              strokeWidth="2"
            />
            <path d="M 132 50 Q 124 45 123 70" stroke={config.moodLightColor} strokeWidth="2" fill="none" />
          </g>

          {/* Head Chassis */}
          <path
            d="M 70 95 C 70 65, 140 65, 140 95 C 140 120, 110 135, 75 125 C 65 120, 65 105, 70 95 Z"
            fill="url(#pvBodyGrad)"
            stroke="#0F6B68"
            strokeWidth="2.5"
          />

          {/* Visor Eye Display Unit */}
          <rect
            x="76"
            y="85"
            width="48"
            height="20"
            rx="10"
            fill="#082A29"
            stroke="#0F6B68"
            strokeWidth="1.5"
          />

          {/* Thinking Scan Laser Effect */}
          {characterState === 'thinking' && !reducedMotion && (
            <g clipPath="url(#visorClip)">
              <line
                x1="100"
                y1="85"
                x2="100"
                y2="105"
                stroke="#4ED2CB"
                strokeWidth="3"
                style={{
                  filter: 'drop-shadow(0 0 5px #4ED2CB)',
                  animation: 'visorLaserSweep 1.2s infinite ease-in-out',
                }}
              />
            </g>
          )}

          {/* Visor Eyes: Joyful Crescent Arcs (^ ^) vs. Cursor Tracking LED Pupils */}
          {showCrescentEyes ? (
            <g>
              {/* Left Crescent Smile Eye */}
              <path
                d="M 83 97 Q 88 89 93 97"
                stroke={config.moodLightColor}
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
                style={{ filter: `drop-shadow(0 0 5px ${config.moodLightColor})` }}
              />
              {/* Right Crescent Smile Eye */}
              <path
                d="M 107 97 Q 112 89 117 97"
                stroke={config.moodLightColor}
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
                style={{ filter: `drop-shadow(0 0 5px ${config.moodLightColor})` }}
              />
            </g>
          ) : (
            <g>
              {/* Left LED Pupil */}
              <circle
                cx={88 + pupilGazeX}
                cy={95 + pupilGazeY}
                r={5}
                fill={config.moodLightColor}
                style={{
                  filter: `drop-shadow(0 0 6px ${config.moodLightColor})`,
                  transition: 'all 0.15s ease-out',
                  animation: characterState === 'listening' ? 'pulseVisorGlow 1.2s infinite' : 'none',
                }}
              />
              {/* Right LED Pupil */}
              <circle
                cx={112 + pupilGazeX}
                cy={95 + pupilGazeY}
                r={5}
                fill={config.moodLightColor}
                style={{
                  filter: `drop-shadow(0 0 6px ${config.moodLightColor})`,
                  transition: 'all 0.15s ease-out',
                  animation: characterState === 'listening' ? 'pulseVisorGlow 1.2s infinite' : 'none',
                }}
              />
            </g>
          )}

          {/* Snout & Audio Transducer Nose */}
          <path d="M 64 105 Q 55 108 58 114 Q 68 116 74 114 Z" fill="url(#pvBodyGrad)" stroke="#0F6B68" strokeWidth="1.5" />
          <circle cx="58" cy="110" r="3" fill="#084C4A" />
        </g>
      </svg>
    </div>
  );
};
