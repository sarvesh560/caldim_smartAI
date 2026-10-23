import React, { useState } from 'react';
import { WorkspaceReturnBar } from '../components/layout/WorkspaceReturnBar';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { Badge } from '../components/ui/Badge';
import { NoticeModal } from '../components/ui/NoticeModal';
import { THEME } from '../theme/theme';
import { useCompanion } from '../components/companion/CompanionContext';
import type { StagedFile, DrawingLayer } from '../types';
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  CheckSquare,
  Square,
  Cpu,
} from 'lucide-react';

interface DrawingPageProps {
  onReturn: () => void;
  initialStagedFiles?: StagedFile[];
}

export const DrawingPage: React.FC<DrawingPageProps> = ({
  onReturn,
  initialStagedFiles = [],
}) => {
  const { emitEvent } = useCompanion();
  const [stagedDrawings, setStagedDrawings] = useState<StagedFile[]>(initialStagedFiles);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [gridVisible, setGridVisible] = useState(true);
  const [layers, setLayers] = useState<DrawingLayer[]>([
    { id: 'l1', name: 'GD&T Dimensions & Callouts', color: '#0F6B68', visible: true, elementCount: 42, description: 'Dimensional limits & surface finishes' },
    { id: 'l2', name: 'Mechanical Part Outlines', color: '#084C4A', visible: true, elementCount: 118, description: 'Structural contour & machined faces' },
    { id: 'l3', name: 'Fastener & Bore Holes', color: '#3C918C', visible: true, elementCount: 16, description: 'M8 counterbores and pin locations' },
    { id: 'l4', name: 'Pneumatics & Fluid Lines', color: '#0284C7', visible: false, elementCount: 8, description: 'Auxiliary pressurized fluid feeds' },
    { id: 'l5', name: 'Title Block & Revision Specs', color: '#64748B', visible: true, elementCount: 1, description: 'Drawing metadata & approval signature block' },
  ]);

  const [activeNotice, setActiveNotice] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    type: 'file' | 'info';
    details: { label: string; value: string }[];
  }>({
    isOpen: false,
    title: '',
    type: 'info',
    details: [],
  });

  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleDrawingStaged = (file: StagedFile) => {
    setStagedDrawings((prev) => [...prev, file]);
    emitEvent({
      type: 'DOCUMENT_SELECTED',
      payload: {
        fileName: file.name,
        fileSize: file.formattedSize,
        hasUserGesture: true,
      },
    });
  };

  const handleRemoveDrawing = (fileId: string) => {
    setStagedDrawings((prev) => prev.filter((d) => d.id !== fileId));
  };

  const activeDrawing = stagedDrawings[0];

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
      <WorkspaceReturnBar
        title="Understand a Drawing"
        subtitle="CAD Vision & Engineering Blueprint Inspection"
        badgeLabel="CAD Vision Engine"
        onReturn={onReturn}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Left Column: Blueprint Viewport Mockup */}
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
          {/* Viewport Top Bar */}
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
                <Compass size={18} />
              </div>
              <div>
                <h3 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '18px', fontWeight: THEME.typography.weights.bold }}>
                  Blueprint Canvas
                </h3>
                <span style={{ fontSize: '12px', color: THEME.colors.textSecondary }}>
                  {activeDrawing ? activeDrawing.name : 'Sample Reference Blueprint (Hydraulic Actuator Housing)'}
                </span>
              </div>
            </div>

            {/* Canvas Zoom & View Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                title="Zoom Out"
                aria-label="Zoom Out"
                style={{
                  padding: '8px',
                  borderRadius: THEME.radii.sm,
                  border: `1px solid ${THEME.colors.panelBorder}`,
                  background: THEME.colors.bgWhite,
                  cursor: 'pointer',
                  color: THEME.colors.textPrimary,
                }}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '12px', fontFamily: THEME.typography.fontMono, padding: '0 4px' }}>
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                title="Zoom In"
                aria-label="Zoom In"
                style={{
                  padding: '8px',
                  borderRadius: THEME.radii.sm,
                  border: `1px solid ${THEME.colors.panelBorder}`,
                  background: THEME.colors.bgWhite,
                  cursor: 'pointer',
                  color: THEME.colors.textPrimary,
                }}
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setGridVisible((g) => !g)}
                title="Toggle Grid"
                aria-label="Toggle Grid"
                style={{
                  padding: '8px',
                  borderRadius: THEME.radii.sm,
                  border: `1px solid ${THEME.colors.panelBorder}`,
                  background: gridVisible ? 'rgba(15, 107, 104, 0.1)' : THEME.colors.bgWhite,
                  cursor: 'pointer',
                  color: THEME.colors.primary,
                }}
              >
                <Crosshair size={16} />
              </button>
            </div>
          </div>

          {/* Interactive Technical Canvas */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '380px',
              borderRadius: THEME.radii.md,
              backgroundColor: '#F8FAFA',
              border: '1.5px solid rgba(15, 107, 104, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: gridVisible
                ? `linear-gradient(rgba(15, 107, 104, 0.08) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(15, 107, 104, 0.08) 1px, transparent 1px)`
                : 'none',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Engineering Schematic Graphic */}
            <svg
              viewBox="0 0 500 320"
              style={{
                width: `${zoomLevel * 0.9}%`,
                height: `${zoomLevel * 0.9}%`,
                transition: 'all 0.25s ease',
              }}
            >
              {/* Center Axis Grid Lines */}
              <line x1="0" y1="160" x2="500" y2="160" stroke="#0F6B68" strokeWidth="1" strokeDasharray="12 4 3 4" opacity="0.4" />
              <line x1="250" y1="0" x2="250" y2="320" stroke="#0F6B68" strokeWidth="1" strokeDasharray="12 4 3 4" opacity="0.4" />

              {/* Part Contour (Layer 2) */}
              {layers.find((l) => l.id === 'l2')?.visible && (
                <g stroke="#084C4A" strokeWidth="2.5" fill="rgba(15, 107, 104, 0.04)">
                  <rect x="120" y="80" width="260" height="160" rx="8" />
                  <circle cx="250" cy="160" r="50" strokeWidth="2" />
                  <circle cx="250" cy="160" r="30" strokeWidth="1.5" strokeDasharray="4 2" />
                </g>
              )}

              {/* Fasteners / Bores (Layer 3) */}
              {layers.find((l) => l.id === 'l3')?.visible && (
                <g stroke="#3C918C" fill="#FFFFFF" strokeWidth="1.8">
                  <circle cx="150" cy="110" r="8" />
                  <circle cx="350" cy="110" r="8" />
                  <circle cx="150" cy="210" r="8" />
                  <circle cx="350" cy="210" r="8" />
                  <path d="M 146 110 L 154 110 M 150 106 L 150 114" stroke="#3C918C" />
                  <path d="M 346 110 L 354 110 M 350 106 L 350 114" stroke="#3C918C" />
                  <path d="M 146 210 L 154 210 M 150 206 L 150 214" stroke="#3C918C" />
                  <path d="M 346 210 L 354 210 M 350 206 L 350 214" stroke="#3C918C" />
                </g>
              )}

              {/* GD&T Callouts (Layer 1) */}
              {layers.find((l) => l.id === 'l1')?.visible && (
                <g stroke="#0F6B68" strokeWidth="1" fill="#0F6B68" fontSize="10" fontFamily="monospace">
                  <line x1="120" y1="60" x2="380" y2="60" />
                  <polygon points="120,60 128,57 128,63" />
                  <polygon points="380,60 372,57 372,63" />
                  <text x="225" y="52" fill="#0F6B68" fontWeight="bold">260.00 ± 0.05 mm</text>

                  <line x1="395" y1="80" x2="395" y2="240" />
                  <polygon points="395,80 392,88 398,88" />
                  <polygon points="395,240 392,232 398,232" />
                  <text x="404" y="165" fill="#0F6B68" fontWeight="bold">160.00</text>
                </g>
              )}

              {/* Title Block (Layer 5) */}
              {layers.find((l) => l.id === 'l5')?.visible && (
                <g fontSize="8" fontFamily="monospace" fill="#64748B" stroke="#64748B" strokeWidth="0.8">
                  <rect x="290" y="260" width="190" height="45" fill="#FFFFFF" />
                  <line x1="290" y1="275" x2="480" y2="275" />
                  <line x1="380" y1="260" x2="380" y2="305" />
                  <text x="295" y="270" stroke="none">CALDIM SPEC: #DWG-8402</text>
                  <text x="385" y="270" stroke="none">REV: C.2</text>
                  <text x="295" y="292" stroke="none">MATERIAL: TI-6AL-4V</text>
                  <text x="385" y="292" stroke="none">TOL: ISO 2768-m</text>
                </g>
              )}
            </svg>

            {/* Coordinate Readout HUD */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                padding: '4px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: THEME.typography.fontMono,
                color: THEME.colors.textSecondary,
                border: '1px solid rgba(15, 107, 104, 0.15)',
              }}
            >
              LOC: 250.00, 160.00 mm • SCALE: 1:1
            </div>
          </div>
        </div>

        {/* Right Column: Layer Inspection & Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Drawing Layers Checklist */}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  <Layers size={18} />
                </div>
                <h3 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '18px', fontWeight: THEME.typography.weights.bold }}>
                  Drawing Inspection Layers
                </h3>
              </div>
              <Badge variant="teal" size="sm">
                {layers.filter((l) => l.visible).length}/{layers.length} Visible
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  role="checkbox"
                  aria-checked={layer.visible}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleLayer(layer.id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: THEME.radii.md,
                    backgroundColor: layer.visible ? 'rgba(15, 107, 104, 0.05)' : THEME.colors.bgSubtle,
                    border: `1px solid ${layer.visible ? 'rgba(15, 107, 104, 0.2)' : 'rgba(0, 0, 0, 0.05)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {layer.visible ? (
                      <CheckSquare size={18} color={THEME.colors.primary} />
                    ) : (
                      <Square size={18} color={THEME.colors.textMuted} />
                    )}
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: THEME.typography.weights.medium, color: THEME.colors.textPrimary, margin: 0 }}>
                        {layer.name}
                      </p>
                      <p style={{ fontSize: '12px', color: THEME.colors.textSecondary, margin: '2px 0 0 0' }}>
                        {layer.description}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: THEME.typography.fontMono, color: THEME.colors.textMuted }}>
                    {layer.elementCount} elem
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Staging CAD Files */}
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
            <FileUploadZone
              acceptedFormats={['.DWG', '.DXF', '.STEP', '.STP', '.PDF', '.SVG', '.PNG']}
              label="Stage CAD Blueprint / Schematic"
              hint="Drop DWG, DXF, or engineering PDF to stage for vision pipeline"
              onFileStaged={handleDrawingStaged}
              stagedFiles={stagedDrawings}
              onRemoveFile={handleRemoveDrawing}
              onInspectFile={(f) => {
                emitEvent({
                  type: 'ANALYSIS_STARTED',
                  payload: { taskName: `CAD Blueprint: ${f.name}`, hasUserGesture: true },
                });
                setActiveNotice({
                  isOpen: true,
                  title: 'Drawing Specification Details',
                  subtitle: 'CAD file geometry container inspected.',
                  type: 'file',
                  details: [
                    { label: 'Drawing Name', value: f.name },
                    { label: 'File Size', value: f.formattedSize },
                    { label: 'CAD Format', value: f.extension },
                    { label: 'Vector Extraction', value: 'Queued for Vision Engine' },
                  ],
                });
              }}
            />
          </div>

          {/* Honest Empty State Banner */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              borderRadius: THEME.radii.lg,
              border: '1px dashed rgba(15, 107, 104, 0.3)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            <Cpu size={22} color={THEME.colors.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '15px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.textPrimary, margin: '0 0 4px 0' }}>
                CAD Vision Engine Connection Required
              </h4>
              <p style={{ fontSize: '13px', color: THEME.colors.textSecondary, margin: 0, lineHeight: 1.45 }}>
                In this Phase 1 foundation, the viewport displays interactive schematic guides and layer controls. Real-time optical character recognition for GD&T callouts and DWG vector extraction will execute in Phase 2 when the backend CAD vision pipeline connects.
              </p>
            </div>
          </div>
        </div>
      </div>

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
