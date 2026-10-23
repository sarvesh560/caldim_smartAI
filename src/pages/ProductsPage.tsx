import React, { useState } from 'react';
import { WorkspaceReturnBar } from '../components/layout/WorkspaceReturnBar';
import { TouchButton } from '../components/ui/TouchButton';
import { Badge } from '../components/ui/Badge';
import { NoticeModal } from '../components/ui/NoticeModal';
import { THEME } from '../theme/theme';
import { useCompanion } from '../components/companion/CompanionContext';
import type { CaldimProduct } from '../types';
import {
  Server,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface ProductsPageProps {
  onReturn: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onReturn }) => {
  const { emitEvent } = useCompanion();
  const [selectedPillar, setSelectedPillar] = useState<string>('All');

  const products: CaldimProduct[] = [
    {
      id: 'prod-core',
      name: 'CALDIM SmartAssist Core',
      pillar: 'Core AI',
      tagline: 'Enterprise Industrial Intelligence & Knowledge Orchestration Platform',
      description: 'The foundation layer uniting document retrieval, CAD vision, multimodal telemetry, and robotic companion agents under a zero-exfiltration security architecture.',
      keyFeatures: [
        'Multitenant role-based engineering knowledge access',
        'Air-gapped and on-premises sovereign deployment',
        'Audit-logged inference with traceable citations',
        'Standardized REST and WebSocket event stream APIs',
      ],
      deploymentOptions: ['On-Premises Bare Metal', 'Air-Gapped Workstation', 'Private Cloud'],
      status: 'Active Suite',
    },
    {
      id: 'prod-vision',
      name: 'CALDIM CAD Vision Engine',
      pillar: 'Vision & CAD',
      tagline: 'Vector-Level Drawing Ingestion & GD&T Geometric Verification',
      description: 'Proprietary vision and geometric analysis engine purpose-built for engineering blueprints, DWG/DXF vector files, and 3D solid geometry.',
      keyFeatures: [
        'Automatic extraction of ASME Y14.5 / ISO GD&T symbols',
        'Dimensional clash detection across 2D revisions',
        'Bill of Materials (BOM) cross-referencing and validation',
        'High-resolution multi-megapixel raster conversion',
      ],
      deploymentOptions: ['Dedicated GPU Node (CUDA)', 'Edge Appliance', 'Workstation'],
      status: 'Enterprise Ready',
    },
    {
      id: 'prod-docu',
      name: 'CALDIM DocuSense Enterprise',
      pillar: 'Knowledge & Docs',
      tagline: 'Technical Specification RAG & Semantic Standard Retrieval',
      description: 'Specialized document comprehension system optimized for dense engineering manuals, military specifications, and complex tabular standards.',
      keyFeatures: [
        'OCR-enhanced layout-aware table parser',
        'Semantic chunking preserving technical equations and footnotes',
        'Precise page, paragraph, and table citation links',
        'Multi-lingual technical vocabulary indexing',
      ],
      deploymentOptions: ['Local Vector Cluster', 'Hybrid Private Cloud', 'Edge Storage'],
      status: 'Enterprise Ready',
    },
    {
      id: 'prod-edge',
      name: 'CALDIM Edge & Companion Kiosk',
      pillar: 'Edge & Ops',
      tagline: 'Interactive Shopfloor Exhibition Kiosk & Robotic Assistant',
      description: 'Touch-first exhibition and shopfloor companion platform featuring tactile controls, robotic character animations, and local edge inference.',
      keyFeatures: [
        'Touch-first responsive exhibition interface',
        'Interactive 3D robotic companion character stage',
        'OPC UA and industrial fieldbus telemetry ingest',
        'Hardware-isolated voice and touchscreen input',
      ],
      deploymentOptions: ['Industrial Kiosk Display', 'Rugged Field Tablet', 'Control Room Console'],
      status: 'Preview',
    },
  ];

  const pillars = ['All', 'Core AI', 'Vision & CAD', 'Knowledge & Docs', 'Edge & Ops'];

  const filteredProducts = products.filter(
    (p) => selectedPillar === 'All' || p.pillar === selectedPillar
  );

  const [activeNotice, setActiveNotice] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    type: 'info';
    details: { label: string; value: string }[];
  }>({
    isOpen: false,
    title: '',
    type: 'info',
    details: [],
  });

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
        title="Explore CALDIM Products"
        subtitle="Industrial Intelligence Product Suite & Architecture Matrix"
        badgeLabel="Product Ecosystem"
        onReturn={onReturn}
      />

      {/* Pillar Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: THEME.colors.textSecondary, fontWeight: THEME.typography.weights.medium }}>
          Ecosystem Pillar:
        </span>
        {pillars.map((pill) => {
          const isSelected = selectedPillar === pill;
          return (
            <button
              key={pill}
              onClick={() => setSelectedPillar(pill)}
              style={{
                padding: '8px 16px',
                borderRadius: THEME.radii.pill,
                backgroundColor: isSelected ? THEME.colors.primary : THEME.colors.panelBg,
                color: isSelected ? THEME.colors.textInverse : THEME.colors.textPrimary,
                border: `1px solid ${isSelected ? THEME.colors.primary : THEME.colors.panelBorder}`,
                boxShadow: isSelected ? THEME.shadows.glowTeal : THEME.shadows.subtle,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: THEME.typography.weights.medium,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            style={{
              backgroundColor: THEME.colors.panelBg,
              borderRadius: THEME.radii.lg,
              border: `1px solid ${THEME.colors.panelBorder}`,
              padding: '28px',
              boxShadow: THEME.shadows.panel,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Badge variant="teal" size="sm">{prod.pillar}</Badge>
                <Badge variant="neutral" size="sm">{prod.status}</Badge>
              </div>

              <h3
                style={{
                  fontFamily: THEME.typography.fontDisplay,
                  fontSize: '20px',
                  fontWeight: THEME.typography.weights.bold,
                  color: THEME.colors.textPrimary,
                  margin: '0 0 6px 0',
                }}
              >
                {prod.name}
              </h3>

              <p style={{ fontSize: '13px', fontWeight: THEME.typography.weights.semibold, color: THEME.colors.accentTeal, margin: '0 0 12px 0' }}>
                {prod.tagline}
              </p>

              <p style={{ fontSize: '14px', color: THEME.colors.textSecondary, lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {prod.description}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Architecture Highlights:
                </span>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: THEME.colors.textSecondary }}>
                  {prod.keyFeatures.map((feat, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{feat}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: THEME.colors.textMuted }}>Deployment Targets:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {prod.deploymentOptions.map((opt) => (
                    <Badge key={opt} variant="neutral" size="sm">
                      <Lock size={10} style={{ marginRight: '2px' }} />
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(15, 107, 104, 0.1)', paddingTop: '16px' }}>
              <TouchButton
                variant="secondary"
                size="md"
                fullWidth
                icon={<ArrowRight size={16} />}
                iconPosition="right"
                onClick={() => {
                  emitEvent({
                    type: 'ANALYSIS_STARTED',
                    payload: { taskName: prod.name, hasUserGesture: true },
                  });
                  setActiveNotice({
                    isOpen: true,
                    title: `${prod.name} Specifications`,
                    subtitle: 'Product architectural parameters inspected.',
                    type: 'info',
                    details: [
                      { label: 'Product Name', value: prod.name },
                      { label: 'Ecosystem Pillar', value: prod.pillar },
                      { label: 'Security Model', value: 'Zero Exfiltration / Air-Gap Compatible' },
                      { label: 'Catalog Gateway', value: 'Connected in Phase 2' },
                    ],
                  });
                }}
              >
                Inspect Architecture Blueprint
              </TouchButton>
            </div>
          </div>
        ))}
      </div>

      {/* Honest Empty State Banner */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderRadius: THEME.radii.lg,
          border: '1px dashed rgba(15, 107, 104, 0.3)',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <Server size={24} color={THEME.colors.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '16px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.textPrimary, margin: '0 0 6px 0' }}>
            Live Enterprise Licensing & Benchmark Gateway Paused
          </h4>
          <p style={{ fontSize: '14px', color: THEME.colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
            In this Phase 1 foundation, the product matrix provides architectural discovery and capability specifications. In Phase 2, this workspace connects to the CALDIM license server, cluster GPU sizing calculator, and production firmware download repository.
          </p>
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
