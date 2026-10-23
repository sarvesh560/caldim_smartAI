import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, Eye } from 'lucide-react';
import { THEME } from '../../theme/theme';
import { stageUploadedFile } from '../../services/apiClient';
import type { StagedFile } from '../../types';
import { Badge } from './Badge';

interface FileUploadZoneProps {
  acceptedFormats?: string[];
  maxFiles?: number;
  label?: string;
  hint?: string;
  onFileStaged: (file: StagedFile) => void;
  stagedFiles?: StagedFile[];
  onRemoveFile?: (fileId: string) => void;
  onInspectFile?: (file: StagedFile) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  acceptedFormats = ['.PDF', '.DOCX', '.TXT', '.MD', '.DWG', '.DXF', '.STEP'],
  maxFiles = 5,
  label = 'Stage Technical Documents or CAD Files',
  hint = 'Tap or drop engineering specifications, manuals, or CAD drawings',
  onFileStaged,
  stagedFiles = [],
  onRemoveFile,
  onInspectFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    for (const rawFile of files.slice(0, maxFiles)) {
      const staged = stageUploadedFile(rawFile);
      onFileStaged(staged);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? THEME.colors.primary : 'rgba(15, 107, 104, 0.25)'}`,
          backgroundColor: isDragging ? 'rgba(15, 107, 104, 0.06)' : THEME.colors.panelBg,
          borderRadius: THEME.radii.lg,
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: `all ${THEME.animations.durations.quick} ease`,
          boxShadow: isDragging ? THEME.shadows.glowTeal : THEME.shadows.subtle,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 107, 104, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME.colors.primary,
            marginBottom: '14px',
            border: '1px solid rgba(15, 107, 104, 0.15)',
          }}
        >
          <UploadCloud size={30} />
        </div>

        <h4
          style={{
            fontFamily: THEME.typography.fontDisplay,
            fontSize: '17px',
            fontWeight: THEME.typography.weights.semibold,
            color: THEME.colors.textPrimary,
            marginBottom: '6px',
          }}
        >
          {label}
        </h4>

        <p style={{ fontSize: '14px', color: THEME.colors.textSecondary, marginBottom: '14px', maxWidth: '420px' }}>
          {hint}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {acceptedFormats.map((ext) => (
            <Badge key={ext} variant="neutral" size="sm">
              {ext}
            </Badge>
          ))}
        </div>
      </div>

      {/* Staged Files List */}
      {stagedFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: THEME.typography.weights.semibold, color: THEME.colors.textSecondary }}>
              Staged Files ({stagedFiles.length}/{maxFiles})
            </span>
            <span style={{ fontSize: '12px', color: THEME.colors.accentTeal }}>
              Ready for Phase 2 Processing Pipeline
            </span>
          </div>

          {stagedFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: THEME.radii.md,
                backgroundColor: THEME.colors.bgWhite,
                border: `1px solid ${THEME.colors.panelBorder}`,
                boxShadow: THEME.shadows.subtle,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: THEME.radii.sm,
                    backgroundColor: 'rgba(15, 107, 104, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: THEME.colors.primary,
                    flexShrink: 0,
                  }}
                >
                  <FileText size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: THEME.typography.weights.medium,
                      color: THEME.colors.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {file.name}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', color: THEME.colors.textMuted }}>{file.formattedSize}</span>
                    <span style={{ fontSize: '10px', color: THEME.colors.textMuted }}>•</span>
                    <Badge variant="teal" size="sm">
                      {file.extension}
                    </Badge>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {onInspectFile && (
                  <button
                    onClick={() => onInspectFile(file)}
                    title="Inspect file details"
                    aria-label={`Inspect ${file.name}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: THEME.radii.pill,
                      color: THEME.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Eye size={18} />
                  </button>
                )}
                {onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    title="Remove staged file"
                    aria-label={`Remove ${file.name}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: THEME.radii.pill,
                      color: THEME.colors.textMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
