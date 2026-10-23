import React, { useState } from 'react';
import { WorkspaceReturnBar } from '../components/layout/WorkspaceReturnBar';
import { TouchButton } from '../components/ui/TouchButton';
import { Badge } from '../components/ui/Badge';
import { NoticeModal } from '../components/ui/NoticeModal';
import { THEME } from '../theme/theme';
import { useCompanion } from '../components/companion/CompanionContext';
import type { AIUseCase } from '../types';
import {
  Factory,
  Plane,
  Zap,
  Car,
  Bot,
  Filter,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface UseCasePageProps {
  onReturn: () => void;
}

export const UseCasePage: React.FC<UseCasePageProps> = ({ onReturn }) => {
  const { emitEvent } = useCompanion();
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedProblem, setSelectedProblem] = useState<string>('All');

  const sectors = [
    { label: 'All Sectors', icon: <Filter size={15} /> },
    { label: 'Manufacturing', icon: <Factory size={15} /> },
    { label: 'Aerospace', icon: <Plane size={15} /> },
    { label: 'Energy', icon: <Zap size={15} /> },
    { label: 'Automotive', icon: <Car size={15} /> },
    { label: 'Robotics', icon: <Bot size={15} /> },
  ];

  const problemCategories = [
    'All Problems',
    'Drawing Analysis',
    'Quality Inspection',
    'Knowledge Search',
    'Maintenance',
  ];

  const useCases: (AIUseCase & { category: string })[] = [
    {
      id: 'uc-1',
      title: 'Automated GD&T Discrepancy & Tolerance Auditing',
      sector: 'Manufacturing',
      category: 'Drawing Analysis',
      problem: 'Manual inspection of engineering drawings for dimensional clashes and GD&T misalignments consumes hours per revision.',
      solution: 'CALDIM CAD Vision parses vector lines and annotations to audit tolerance stacks against ISO/ASME standards.',
      estimatedRoi: '65% faster drawing signoff',
      complexity: 'Medium',
      dataRequired: ['2D DWG/DXF files', 'Part 3D STEP models', 'Tolerance standards'],
    },
    {
      id: 'uc-2',
      title: 'Air-Gapped Defense & Aerospace Technical Knowledge Retrieval',
      sector: 'Aerospace',
      category: 'Knowledge Search',
      problem: 'Defense manufacturing facilities cannot transmit proprietary schematics or SOP manuals to external cloud LLMs.',
      solution: 'CALDIM SmartAssist runs locally on-premises or air-gapped workstations with zero external data telemetry.',
      estimatedRoi: 'Zero data exfiltration risk + 4x faster SOP lookup',
      complexity: 'Low',
      dataRequired: ['PDF maintenance manuals', 'Internal SOP documents'],
    },
    {
      id: 'uc-3',
      title: 'Predictive Turbine Maintenance & Multimodal Field Diagnostic',
      sector: 'Energy',
      category: 'Maintenance',
      problem: 'Field technicians struggle to correlate vibration sensor anomalies with legacy paper maintenance logs.',
      solution: 'Field Companion matches real-time telemetry against historical maintenance case studies and recommends repair steps.',
      estimatedRoi: '40% reduction in unplanned downtime',
      complexity: 'High',
      dataRequired: ['Time-series telemetry', 'Historical maintenance logs', 'Sensor thresholds'],
    },
    {
      id: 'uc-4',
      title: 'Automotive Stamping Line Defect Triaging & Visual QA',
      sector: 'Automotive',
      category: 'Quality Inspection',
      problem: 'Surface micro-scratches and tear defects on stamped panels cause downstream paint and weld defects.',
      solution: 'High-speed edge camera inference detects imperfections and auto-initiates robotic quarantine.',
      estimatedRoi: '80% fewer defective panels reaching paint line',
      complexity: 'Medium',
      dataRequired: ['High-res panel images', 'Defect taxonomy', 'MES integration'],
    },
    {
      id: 'uc-5',
      title: 'Robotic Workcell Telemetry & Safety Guardrail Monitoring',
      sector: 'Robotics',
      category: 'Maintenance',
      problem: 'Cobot joint overheating and path deviations often go unnoticed until emergency stop failsafe trips.',
      solution: 'Continuous edge monitoring with companion alert system warns operators prior to motor thermal throttling.',
      estimatedRoi: '30% longer cobot actuator lifespan',
      complexity: 'Low',
      dataRequired: ['Motor bus telemetry (CAN/Modbus)', 'Thermal logs'],
    },
  ];

  const filteredUseCases = useCases.filter((uc) => {
    const sectorMatch = selectedSector === 'All' || selectedSector === 'All Sectors' || uc.sector === selectedSector;
    const problemMatch = selectedProblem === 'All' || selectedProblem === 'All Problems' || uc.category === selectedProblem;
    return sectorMatch && problemMatch;
  });

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
        title="Find My AI Use Case"
        subtitle="Industrial AI Exploration & Deployment Readiness Engine"
        badgeLabel="Enterprise Matcher"
        onReturn={onReturn}
      />

      {/* Sector Selection Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
      >
        {sectors.map((s) => {
          const isSelected = selectedSector === s.label;
          return (
            <button
              key={s.label}
              onClick={() => setSelectedSector(s.label)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: THEME.radii.pill,
                backgroundColor: isSelected ? THEME.colors.primary : THEME.colors.panelBg,
                color: isSelected ? THEME.colors.textInverse : THEME.colors.textPrimary,
                border: `1px solid ${isSelected ? THEME.colors.primary : THEME.colors.panelBorder}`,
                boxShadow: isSelected ? THEME.shadows.glowTeal : THEME.shadows.subtle,
                cursor: 'pointer',
                fontFamily: THEME.typography.fontBody,
                fontSize: '14px',
                fontWeight: isSelected ? THEME.typography.weights.semibold : THEME.typography.weights.medium,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {s.icon}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Problem Filter Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: THEME.colors.textSecondary, fontWeight: THEME.typography.weights.medium }}>
          Filter Problem Area:
        </span>
        {problemCategories.map((cat) => {
          const isSelected = selectedProblem === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedProblem(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: THEME.radii.pill,
                backgroundColor: isSelected ? 'rgba(15, 107, 104, 0.12)' : 'transparent',
                color: isSelected ? THEME.colors.primary : THEME.colors.textSecondary,
                border: `1px solid ${isSelected ? THEME.colors.primary : 'rgba(15, 107, 104, 0.15)'}`,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: THEME.typography.weights.medium,
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Use Cases Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredUseCases.map((uc) => (
          <div
            key={uc.id}
            style={{
              backgroundColor: THEME.colors.panelBg,
              borderRadius: THEME.radii.lg,
              border: `1px solid ${THEME.colors.panelBorder}`,
              padding: '24px',
              boxShadow: THEME.shadows.panel,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'all 0.25s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Badge variant="teal" size="sm">{uc.sector}</Badge>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: THEME.typography.fontMono,
                    color: uc.complexity === 'Low' ? '#059669' : uc.complexity === 'Medium' ? '#D97706' : '#DC2626',
                    fontWeight: THEME.typography.weights.bold,
                  }}
                >
                  {uc.complexity} Complexity
                </span>
              </div>

              <h3
                style={{
                  fontFamily: THEME.typography.fontDisplay,
                  fontSize: '18px',
                  fontWeight: THEME.typography.weights.bold,
                  color: THEME.colors.textPrimary,
                  lineHeight: 1.3,
                  marginBottom: '10px',
                }}
              >
                {uc.title}
              </h3>

              <p style={{ fontSize: '13px', color: THEME.colors.textSecondary, marginBottom: '12px', lineHeight: 1.45 }}>
                <strong>Operational Challenge:</strong> {uc.problem}
              </p>

              <p style={{ fontSize: '13px', color: THEME.colors.deepTeal, lineHeight: 1.45 }}>
                <strong>CALDIM Architecture:</strong> {uc.solution}
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(15, 107, 104, 0.1)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: THEME.colors.textMuted }}>Target Impact:</span>
                <span style={{ fontSize: '13px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.primary }}>
                  {uc.estimatedRoi}
                </span>
              </div>

              <TouchButton
                variant="secondary"
                size="sm"
                fullWidth
                icon={<ArrowRight size={15} />}
                iconPosition="right"
                onClick={() => {
                  emitEvent({
                    type: 'ANALYSIS_STARTED',
                    payload: { taskName: uc.title, hasUserGesture: true },
                  });
                  setActiveNotice({
                    isOpen: true,
                    title: 'Use Case Feasibility Assessment Staged',
                    subtitle: 'Architecture parameters verified for enterprise evaluation.',
                    type: 'info',
                    details: [
                      { label: 'Use Case', value: uc.title },
                      { label: 'Sector', value: uc.sector },
                      { label: 'Target Benefit', value: uc.estimatedRoi },
                      { label: 'Data Prerequisites', value: uc.dataRequired.join(', ') },
                    ],
                  });
                }}
              >
                Stage for Feasibility Review
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
        <TrendingUp size={24} color={THEME.colors.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '16px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.textPrimary, margin: '0 0 6px 0' }}>
            Enterprise Assessment Model Connection Required
          </h4>
          <p style={{ fontSize: '14px', color: THEME.colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
            In this Phase 1 foundation, the use case catalog allows exploration and criteria staging. In Phase 2, selecting a use case will generate custom plant-specific ROI calculations, hardware sizing recommendations, and air-gapped deployment blueprints.
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
