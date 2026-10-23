import React, { useState, useRef } from 'react';
import { CompanionStage } from '../components/companion/CompanionStage';
import { useCompanion } from '../components/companion/CompanionContext';
import { TouchButton } from '../components/ui/TouchButton';
import { Badge } from '../components/ui/Badge';
import { NoticeModal } from '../components/ui/NoticeModal';
import { THEME } from '../theme/theme';
import { stageUploadedFile, validateQueryInput } from '../services/apiClient';
import type { WorkspaceId, StagedFile, CapabilityItem } from '../types';
import {
  FileText,
  Compass,
  Sparkles,
  Workflow,
  Layers,
  Send,
  Mic,
  Paperclip,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface HomePageProps {
  onNavigateToWorkspace: (workspace: WorkspaceId) => void;
  onFileStaged: (file: StagedFile) => void;
  stagedFiles: StagedFile[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToWorkspace,
  onFileStaged,
  stagedFiles,
}) => {
  const {
    emitEvent,
    resetToIdle,
    isListening,
    isSubmittingQuery,
    lastFailedQuery,
    voiceStatus,
    startVoiceInput,
    stopVoiceInput,
    simulateVoiceInput,
    submitUserQuery,
    retryLastQuery,
  } = useCompanion();
  const [textInput, setTextInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    type: 'voice' | 'query' | 'file' | 'info';
    details: { label: string; value: string }[];
  }>({
    isOpen: false,
    title: '',
    type: 'info',
    details: [],
  });

  const capabilities: CapabilityItem[] = [
    {
      id: 'documents',
      title: 'Ask My Documents',
      shortDesc: 'Search engineering manuals, specs, SOPs & standards with cited answers',
      badge: 'DocuSense RAG',
      iconName: 'FileText',
      accentColor: THEME.colors.primary,
      readyStatus: 'Phase 1 Ready',
    },
    {
      id: 'drawing',
      title: 'Understand a Drawing',
      shortDesc: 'Inspect DWG/DXF blueprints, verify GD&T callouts & detect clashes',
      badge: 'CAD Vision',
      iconName: 'Compass',
      accentColor: THEME.colors.deepTeal,
      readyStatus: 'Phase 1 Ready',
    },
    {
      id: 'use-case',
      title: 'Find My AI Use Case',
      shortDesc: 'Explore high-ROI industrial AI opportunities tailored to your facility',
      badge: 'Enterprise Matcher',
      iconName: 'Sparkles',
      accentColor: THEME.colors.accentTeal,
      readyStatus: 'Phase 1 Ready',
    },
    {
      id: 'automation',
      title: 'Automate a Task',
      shortDesc: 'Configure trigger-action workflows with human-in-the-loop safety approval',
      badge: 'Task Orchestrator',
      iconName: 'Workflow',
      accentColor: THEME.colors.primaryHover,
      readyStatus: 'Phase 1 Ready',
    },
    {
      id: 'products',
      title: 'Explore CALDIM Products',
      shortDesc: 'Discover the full suite of air-gapped industrial AI platforms & models',
      badge: 'Product Matrix',
      iconName: 'Layers',
      accentColor: THEME.colors.accentTealLight,
      readyStatus: 'Phase 1 Ready',
    },
  ];

  const handleQuerySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingQuery) return;
    const validation = validateQueryInput(textInput);
    if (!validation.isValid) {
      setInputError(validation.error || 'Please enter a valid query');
      return;
    }

    setInputError(null);
    const query = textInput.trim();
    setTextInput('');
    await submitUserQuery(
      query,
      'home',
      stagedFiles.map((f) => ({ name: f.name, size: f.size }))
    );
  };

  const handleMicClick = async () => {
    if (isListening) {
      stopVoiceInput();
      return;
    }

    emitEvent({
      type: 'MICROPHONE_ACTIVATED',
      payload: { hasUserGesture: true },
    });

    const started = await startVoiceInput();
    if (!started) {
      setActiveModal({
        isOpen: true,
        title: 'Microphone & Speech Recognition',
        subtitle: 'Microphone access is unavailable, denied, or not supported by this browser.',
        type: 'voice',
        details: [
          { label: 'Voice Status', value: voiceStatus === 'error' ? 'Permission Denied / Device Unavailable' : 'Standby' },
          { label: 'Speech Recognition', value: 'Web Speech API (Chrome / Edge / Safari)' },
          { label: 'Fallback Testing', value: 'Touch "Simulate Voice Recognition" below to test ASR transcription' },
          { label: 'Keyboard Shortcuts', value: '1-4: Touch, P: Pet, V: Voice, M: Mute, Esc: Cancel' },
        ],
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const staged = stageUploadedFile(file);
      onFileStaged(staged);

      emitEvent({
        type: 'DOCUMENT_SELECTED',
        payload: {
          fileName: staged.name,
          fileSize: staged.formattedSize,
          hasUserGesture: true,
        },
      });

      setActiveModal({
        isOpen: true,
        title: 'Document Staged Successfully',
        subtitle: 'File details verified by companion client.',
        type: 'file',
        details: [
          { label: 'Filename', value: staged.name },
          { label: 'File Size', value: staged.formattedSize },
          { label: 'File Type', value: staged.type },
          { label: 'Extension', value: staged.extension },
          { label: 'Staging Status', value: 'Ready for Ingestion Pipeline (Phase 2)' },
        ],
      });

      e.target.value = '';
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'FileText':
        return <FileText size={22} />;
      case 'Compass':
        return <Compass size={22} />;
      case 'Sparkles':
        return <Sparkles size={22} />;
      case 'Workflow':
        return <Workflow size={22} />;
      case 'Layers':
        return <Layers size={22} />;
      default:
        return <Sparkles size={22} />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '12px 24px 36px',
        gap: '24px',
      }}
    >
      {/* 1. Central Character Stage (Robotic Puppy Centerpiece) */}
      <CompanionStage modelUrl="/models/caldim_dog.glb" />

      {/* 2. Primary Multi-Modal Input Bar (Text, Mic, Document Upload) */}
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <form
          onSubmit={handleQuerySubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: THEME.colors.panelBg,
            borderRadius: THEME.radii.pill,
            padding: '8px 12px 8px 18px',
            border: `1.5px solid ${inputError ? '#DC2626' : THEME.colors.panelBorder}`,
            boxShadow: THEME.shadows.panel,
            backdropFilter: 'blur(16px)',
            transition: 'all 0.25s ease',
            gap: '8px',
          }}
        >
          {/* Hidden File Input for Document Upload */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelected}
            accept=".pdf,.docx,.txt,.md,.dwg,.dxf,.step,.png"
            style={{ display: 'none' }}
          />

          {/* Document Upload Button */}
          <button
            type="button"
            onClick={handleUploadClick}
            aria-label="Upload engineering document or CAD drawing"
            title="Upload document or drawing"
            style={{
              background: stagedFiles.length > 0 ? 'rgba(15, 107, 104, 0.15)' : 'rgba(15, 107, 104, 0.08)',
              border: `1px solid ${stagedFiles.length > 0 ? THEME.colors.primary : 'rgba(15, 107, 104, 0.15)'}`,
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: THEME.colors.primary,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <Paperclip size={19} />
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={textInput}
            disabled={isSubmittingQuery}
            onChange={(e) => {
              setTextInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={isSubmittingQuery ? "Inference in progress..." : "Ask a technical question about drawings, specs, manuals, or workflows..."}
            aria-label="Enter question for CALDIM Companion"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: THEME.typography.fontBody,
              fontSize: '15px',
              color: THEME.colors.textPrimary,
              padding: '6px 8px',
              minWidth: 0,
              opacity: isSubmittingQuery ? 0.7 : 1,
            }}
          />

          {/* Accessible Microphone Button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isSubmittingQuery}
            aria-label={isListening ? 'Listening... Touch to stop voice input' : 'Voice input (touch to activate microphone)'}
            title={isListening ? 'Listening... Touch to stop' : 'Voice input (Web Speech API)'}
            style={{
              background: isListening ? THEME.colors.primary : 'rgba(60, 145, 140, 0.08)',
              border: `1.5px solid ${isListening ? THEME.colors.primaryHover : 'rgba(60, 145, 140, 0.2)'}`,
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isListening ? '#FFFFFF' : THEME.colors.accentTeal,
              cursor: isSubmittingQuery ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: isListening ? `0 0 16px ${THEME.colors.glowTeal}` : 'none',
              transition: 'all 0.2s ease',
              opacity: isSubmittingQuery ? 0.5 : 1,
            }}
          >
            <Mic size={19} />
          </button>

          {/* Submit Action Control */}
          <TouchButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmittingQuery}
            aria-label="Submit question to companion"
            icon={isSubmittingQuery ? <Sparkles size={16} /> : <Send size={16} />}
            style={{ borderRadius: THEME.radii.pill, padding: '10px 18px', opacity: isSubmittingQuery ? 0.8 : 1 }}
          >
            {isSubmittingQuery ? 'Analyzing...' : 'Ask'}
          </TouchButton>
        </form>

        {/* Preserved Failed Inquiry Retry Action Banner */}
        {lastFailedQuery && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: THEME.radii.md,
              padding: '8px 14px',
              fontSize: '12px',
              color: '#991B1B',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ fontWeight: THEME.typography.weights.bold }}>Connection Notice:</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Question preserved: "{lastFailedQuery}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => retryLastQuery()}
              disabled={isSubmittingQuery}
              style={{
                backgroundColor: THEME.colors.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: THEME.radii.pill,
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: THEME.typography.weights.bold,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Retry Question
            </button>
          </div>
        )}

        {/* Input Feedback / Staged Files indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px' }}>
          {inputError ? (
            <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: THEME.typography.weights.medium }}>
              {inputError}
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: THEME.colors.textMuted }}>
              💡 Touch mic, upload documents, or type any industrial engineering query
            </span>
          )}

          {stagedFiles.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Badge variant="teal" size="sm">
                <CheckCircle2 size={12} />
                {stagedFiles.length} file(s) staged
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* 3. Five Capability Entry Points (Tactile Cards) */}
      <div style={{ width: '100%', marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2
            style={{
              fontFamily: THEME.typography.fontDisplay,
              fontSize: '18px',
              fontWeight: THEME.typography.weights.bold,
              color: THEME.colors.textPrimary,
              margin: 0,
            }}
          >
            Explore Companion Capabilities
          </h2>
          <span style={{ fontSize: '12px', color: THEME.colors.textSecondary }}>
            Touch any card to open dedicated workspace
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            width: '100%',
          }}
        >
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              role="button"
              tabIndex={0}
              onClick={() => onNavigateToWorkspace(cap.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onNavigateToWorkspace(cap.id);
                }
              }}
              aria-label={`Open ${cap.title} workspace`}
              style={{
                backgroundColor: THEME.colors.panelBg,
                borderRadius: THEME.radii.lg,
                border: `1.5px solid ${THEME.colors.panelBorder}`,
                padding: '22px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: THEME.shadows.subtle,
                cursor: 'pointer',
                transition: `all ${THEME.animations.durations.quick} ${THEME.animations.easings.standard}`,
                outline: 'none',
                minHeight: '190px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = THEME.shadows.panelHover;
                e.currentTarget.style.borderColor = THEME.colors.panelBorderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = THEME.shadows.subtle;
                e.currentTarget.style.borderColor = THEME.colors.panelBorder;
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: THEME.radii.md,
                      backgroundColor: 'rgba(15, 107, 104, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cap.accentColor,
                      border: '1px solid rgba(15, 107, 104, 0.15)',
                    }}
                  >
                    {renderIcon(cap.iconName)}
                  </div>
                  <Badge variant="teal" size="sm">
                    {cap.badge}
                  </Badge>
                </div>

                <h3
                  style={{
                    fontFamily: THEME.typography.fontDisplay,
                    fontSize: '17px',
                    fontWeight: THEME.typography.weights.bold,
                    color: THEME.colors.textPrimary,
                    marginBottom: '6px',
                    lineHeight: 1.25,
                  }}
                >
                  {cap.title}
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: THEME.colors.textSecondary,
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {cap.shortDesc}
                </p>
              </div>

              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: THEME.typography.weights.semibold,
                  color: THEME.colors.primary,
                }}
              >
                <span>Launch Workspace</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Compact Status & Interaction Hint Area */}
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          padding: '12px 20px',
          borderRadius: THEME.radii.pill,
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid rgba(15, 107, 104, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '13px',
          color: THEME.colors.textSecondary,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: THEME.colors.primary, fontWeight: THEME.typography.weights.semibold }}>
          <Sparkles size={14} color={THEME.colors.glowTeal} />
          Exhibition Kiosk Mode Active
        </span>
        <span style={{ color: THEME.colors.textMuted }}>•</span>
        <span>Tap the companion stage or any capability card to explore</span>
      </div>

      {/* Notice Modal */}
      <NoticeModal
        isOpen={activeModal.isOpen}
        onClose={() => {
          setActiveModal((prev) => ({ ...prev, isOpen: false }));
          resetToIdle();
        }}
        title={activeModal.title}
        subtitle={activeModal.subtitle}
        type={activeModal.type}
        details={activeModal.details}
        secondaryActionLabel={activeModal.type === 'voice' ? 'Simulate Voice Query' : undefined}
        onSecondaryAction={() => {
          simulateVoiceInput('How do I calibrate the pressure relief valve?');
        }}
      />
    </div>
  );
};
