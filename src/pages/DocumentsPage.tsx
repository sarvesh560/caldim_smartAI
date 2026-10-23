import React, { useState } from 'react';
import { WorkspaceReturnBar } from '../components/layout/WorkspaceReturnBar';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { TouchButton } from '../components/ui/TouchButton';
import { Badge } from '../components/ui/Badge';
import { NoticeModal } from '../components/ui/NoticeModal';
import { THEME } from '../theme/theme';
import { validateQueryInput } from '../services/apiClient';
import { useCompanion } from '../components/companion/CompanionContext';
import type { StagedFile } from '../types';
import { Send, FileText, Sparkles, Database } from 'lucide-react';

interface DocumentsPageProps {
  onReturn: () => void;
  initialStagedFiles?: StagedFile[];
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  onReturn,
  initialStagedFiles = [],
}) => {
  const { emitEvent, submitUserQuery, isSubmittingQuery, lastFailedQuery, retryLastQuery } = useCompanion();
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>(initialStagedFiles);
  const [query, setQuery] = useState('');
  const [activeNotice, setActiveNotice] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    type: 'query' | 'file' | 'info';
    details: { label: string; value: string }[];
  }>({
    isOpen: false,
    title: '',
    type: 'info',
    details: [],
  });

  const promptSuggestions = [
    'What are the operating temperature limits specified in Chapter 2?',
    'Summarize preventative maintenance intervals and safety protocols.',
    'Extract allowable torque tolerances for M12 titanium fasteners.',
    'List all PPE requirements for calibration and servicing procedures.',
  ];

  const handleFileStaged = (file: StagedFile) => {
    setStagedFiles((prev) => [...prev, file]);
    emitEvent({
      type: 'DOCUMENT_SELECTED',
      payload: {
        fileName: file.name,
        fileSize: file.formattedSize,
        hasUserGesture: true,
      },
    });
  };

  const handleRemoveFile = (fileId: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmitQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validation = validateQueryInput(query);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    emitEvent({
      type: 'ANALYSIS_STARTED',
      payload: { taskName: 'DocuSense Document Search', hasUserGesture: true },
    });

    await submitUserQuery(
      query,
      'documents',
      stagedFiles.map((f) => ({ name: f.name, size: f.size }))
    );
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '24px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Return Bar */}
      <WorkspaceReturnBar
        title="Ask My Documents"
        subtitle="DocuSense Technical Knowledge Retrieval & Specification Search"
        badgeLabel="DocuSense Engine"
        onReturn={onReturn}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Document Staging & Upload */}
        <div
          style={{
            backgroundColor: THEME.colors.panelBg,
            borderRadius: THEME.radii.lg,
            border: `1px solid ${THEME.colors.panelBorder}`,
            padding: '24px',
            boxShadow: THEME.shadows.panel,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: THEME.radii.md,
                  backgroundColor: 'rgba(15, 107, 104, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: THEME.colors.primary,
                }}
              >
                <FileText size={18} />
              </div>
              <h3 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '18px', fontWeight: THEME.typography.weights.bold }}>
                Source Documents
              </h3>
            </div>
            <Badge variant="teal" size="sm">
              {stagedFiles.length} Staged
            </Badge>
          </div>

          <FileUploadZone
            acceptedFormats={['.PDF', '.DOCX', '.TXT', '.MD', '.CSV', '.XLSX']}
            label="Upload Specifications or Manuals"
            hint="Stage SOPs, user manuals, material certs, or test reports"
            onFileStaged={handleFileStaged}
            stagedFiles={stagedFiles}
            onRemoveFile={handleRemoveFile}
            onInspectFile={(f) => {
              setActiveNotice({
                isOpen: true,
                title: 'Staged Document Details',
                subtitle: 'File details verified by companion staging layer.',
                type: 'file',
                details: [
                  { label: 'Filename', value: f.name },
                  { label: 'File Size', value: f.formattedSize },
                  { label: 'MIME Type', value: f.type },
                  { label: 'Extension', value: f.extension },
                  { label: 'Stage Status', value: 'Ready for Vector Indexing' },
                ],
              });
            }}
          />
        </div>

        {/* Right Column: Query Input & Realistic Empty State */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Query Formulation Card */}
          <div
            style={{
              backgroundColor: THEME.colors.panelBg,
              borderRadius: THEME.radii.lg,
              border: `1px solid ${THEME.colors.panelBorder}`,
              padding: '24px',
              boxShadow: THEME.shadows.panel,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: THEME.radii.md,
                  backgroundColor: 'rgba(60, 145, 140, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: THEME.colors.accentTeal,
                }}
              >
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '18px', fontWeight: THEME.typography.weights.bold }}>
                Query Document Knowledge
              </h3>
            </div>

            <form onSubmit={handleSubmitQuery} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a technical question about your staged documents, specs, or standards..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: THEME.radii.md,
                    border: `1.5px solid ${THEME.colors.panelBorder}`,
                    backgroundColor: THEME.colors.bgWhite,
                    color: THEME.colors.textPrimary,
                    fontFamily: THEME.typography.fontBody,
                    fontSize: '15px',
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = THEME.colors.primary)}
                  onBlur={(e) => (e.target.style.borderColor = THEME.colors.panelBorder)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: THEME.colors.textMuted }}>
                  {stagedFiles.length === 0 ? 'No files attached (will query general specs)' : `${stagedFiles.length} file(s) attached`}
                </span>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {lastFailedQuery && (
                    <button
                      type="button"
                      onClick={() => retryLastQuery()}
                      disabled={isSubmittingQuery}
                      style={{
                        padding: '8px 14px',
                        borderRadius: THEME.radii.md,
                        backgroundColor: '#FFF7ED',
                        border: '1px solid #FDBA74',
                        color: '#C2410C',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isSubmittingQuery ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Retry Failed
                    </button>
                  )}
                  <TouchButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmittingQuery}
                    icon={<Send size={16} />}
                    iconPosition="right"
                  >
                    {isSubmittingQuery ? 'Analyzing...' : 'Submit Question'}
                  </TouchButton>
                </div>
              </div>
            </form>

            {/* Prompt Suggestions */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: THEME.typography.weights.semibold, color: THEME.colors.textSecondary }}>
                Sample Engineering Prompts:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {promptSuggestions.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(promptText)}
                    style={{
                      background: 'rgba(15, 107, 104, 0.05)',
                      border: '1px solid rgba(15, 107, 104, 0.15)',
                      borderRadius: THEME.radii.pill,
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: THEME.colors.primary,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transparent Realistic Empty State */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              borderRadius: THEME.radii.lg,
              border: '1px dashed rgba(15, 107, 104, 0.3)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 107, 104, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: THEME.colors.primary,
              }}
            >
              <Database size={24} />
            </div>

            <div>
              <h4
                style={{
                  fontFamily: THEME.typography.fontDisplay,
                  fontSize: '17px',
                  fontWeight: THEME.typography.weights.bold,
                  color: THEME.colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Document Indexer Connection Required
              </h4>
              <p
                style={{
                  fontSize: '14px',
                  color: THEME.colors.textSecondary,
                  maxWidth: '460px',
                  lineHeight: 1.5,
                }}
              >
                In this Phase 1 foundation, you can stage documents and validate query formulations. Real semantic chunking, vector embedding generation, and cited RAG answers will execute when the CALDIM DocuSense backend connects in Phase 2.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Badge variant="teal" size="sm">PDF / Word OCR Ready</Badge>
              <Badge variant="teal" size="sm">Vector RAG Pipeline Ready</Badge>
              <Badge variant="neutral" size="sm">Phase 2 Backend Wire</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Modal */}
      <NoticeModal
        isOpen={activeNotice.isOpen}
        onClose={() => setActiveNotice((prev) => ({ ...prev, isOpen: false }))}
        title={activeNotice.title}
        subtitle={activeNotice.subtitle}
        type={activeNotice.type}
        details={activeNotice.details}
      />
    </div>
  );
};
