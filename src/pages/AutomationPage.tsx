import React, { useState } from 'react';
import { WorkspaceReturnBar } from '../components/layout/WorkspaceReturnBar';
import { TouchButton } from '../components/ui/TouchButton';
import { Badge } from '../components/ui/Badge';
import { NoticeModal } from '../components/ui/NoticeModal';
import { THEME } from '../theme/theme';
import { useCompanion } from '../components/companion/CompanionContext';
import type { AutomationWorkflow } from '../types';

import {
  Workflow,
  ShieldCheck,
  Play,
} from 'lucide-react';

interface AutomationPageProps {
  onReturn: () => void;
}

export const AutomationPage: React.FC<AutomationPageProps> = ({ onReturn }) => {
  const { emitEvent } = useCompanion();
  const templates: AutomationWorkflow[] = [
    {
      id: 'wf-1',
      title: 'CAD Revision Pre-Flight & GD&T Compliance',
      trigger: 'New DWG/DXF uploaded to engineering staging folder',
      actions: [
        'CAD Vision checks geometry against ISO tolerance rules',
        'Detect dimensional interference and missing annotations',
        'Compile pre-flight report for review',
      ],
      requiresApproval: true,
      approvalRole: 'Lead Mechanical Engineer',
      estimatedTimeSaved: '4.5 hrs / revision',
      status: 'Template',
    },
    {
      id: 'wf-2',
      title: 'Quality Anomaly Defect Escalation to MES',
      trigger: 'Vision camera logs surface scratch defect severity > Grade 2',
      actions: [
        'Freeze downstream conveyance buffer line',
        'Capture multi-angle defect imagery',
        'Notify QA supervisor on kiosk companion',
      ],
      requiresApproval: true,
      approvalRole: 'Shift Quality Supervisor',
      estimatedTimeSaved: 'Immediate line safeguard',
      status: 'Template',
    },
    {
      id: 'wf-3',
      title: 'Automated Preventive Maintenance Dispatch',
      trigger: 'Vibration frequency exceeds 140Hz for > 5 consecutive minutes',
      actions: [
        'Query equipment maintenance manual for spindle bearing check',
        'Pre-generate maintenance work order draft in ERP',
        'Display step-by-step repair guide on technician kiosk',
      ],
      requiresApproval: true,
      approvalRole: 'Reliability Engineer',
      estimatedTimeSaved: '2.5 hrs response time',
      status: 'Template',
    },
  ];

  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow>(templates[0]);
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

  const handleSelectTemplate = (tpl: AutomationWorkflow) => {
    setSelectedWorkflow(tpl);
    emitEvent({
      type: 'AUTOMATION_STARTED',
      payload: { taskName: tpl.title, hasUserGesture: true },
    });
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
      <WorkspaceReturnBar
        title="Automate a Task"
        subtitle="Industrial Workflow Configuration & Human-in-the-Loop Orchestration"
        badgeLabel="Task Orchestrator"
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
        {/* Left Column: Template Selection */}
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
                  backgroundColor: 'rgba(15, 107, 104, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: THEME.colors.primary,
                }}
              >
                <Workflow size={18} />
              </div>
              <h3 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '18px', fontWeight: THEME.typography.weights.bold }}>
                Industrial Workflow Templates
              </h3>
            </div>
            <Badge variant="teal" size="sm">
              {templates.length} Ready
            </Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {templates.map((tpl) => {
              const isSelected = selectedWorkflow.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleSelectTemplate(tpl);
                    }
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: THEME.radii.md,
                    backgroundColor: isSelected ? 'rgba(15, 107, 104, 0.06)' : THEME.colors.bgSubtle,
                    border: `1.5px solid ${isSelected ? THEME.colors.primary : 'rgba(15, 107, 104, 0.12)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '15px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.textPrimary, margin: 0 }}>
                      {tpl.title}
                    </h4>
                    {isSelected && <Badge variant="teal" size="sm">Active</Badge>}
                  </div>
                  <p style={{ fontSize: '12px', color: THEME.colors.textSecondary, margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    <strong>Trigger:</strong> {tpl.trigger}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: THEME.colors.accentTeal, fontWeight: THEME.typography.weights.medium }}>
                      Saved: {tpl.estimatedTimeSaved}
                    </span>
                    <span style={{ color: THEME.colors.textMuted }}>
                      Gate: {tpl.approvalRole}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Workflow Pipeline & Human Approval Gate */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pipeline Configuration Visualizer */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '18px', fontWeight: THEME.typography.weights.bold, margin: 0 }}>
                  {selectedWorkflow.title}
                </h3>
                <span style={{ fontSize: '13px', color: THEME.colors.textSecondary }}>
                  Trigger-Action Pipeline Architecture
                </span>
              </div>
              <Badge variant="accent" size="sm">Configured</Badge>
            </div>

            {/* Pipeline Steps Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Step 1: Trigger */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: THEME.radii.md,
                  backgroundColor: THEME.colors.bgSubtle,
                  border: '1px solid rgba(15, 107, 104, 0.12)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: THEME.colors.primary,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: THEME.typography.weights.bold,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: THEME.colors.primary, fontWeight: THEME.typography.weights.bold }}>
                    System Trigger Event
                  </span>
                  <p style={{ fontSize: '14px', color: THEME.colors.textPrimary, margin: '2px 0 0 0', fontWeight: THEME.typography.weights.medium }}>
                    {selectedWorkflow.trigger}
                  </p>
                </div>
              </div>

              {/* Step 2: Automated Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: THEME.radii.md,
                  backgroundColor: THEME.colors.bgSubtle,
                  border: '1px solid rgba(15, 107, 104, 0.12)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: THEME.colors.accentTeal,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: THEME.typography.weights.bold,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ width: '100%' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: THEME.colors.accentTeal, fontWeight: THEME.typography.weights.bold }}>
                    Automated Processing Pipeline
                  </span>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: THEME.colors.textSecondary }}>
                    {selectedWorkflow.actions.map((act, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 3: Human-In-The-Loop Approval Gate */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: THEME.radii.md,
                  backgroundColor: 'rgba(60, 145, 140, 0.08)',
                  border: `1.5px solid ${THEME.colors.accentTeal}`,
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: THEME.colors.deepTeal,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: THEME.typography.weights.bold,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: THEME.colors.deepTeal, fontWeight: THEME.typography.weights.bold }}>
                      Human-in-the-Loop Approval Gate (Safety Failsafe)
                    </span>
                    <Badge variant="teal" size="sm">Required</Badge>
                  </div>
                  <p style={{ fontSize: '14px', color: THEME.colors.textPrimary, margin: '4px 0 2px 0', fontWeight: THEME.typography.weights.semibold }}>
                    Mandatory Signoff: {selectedWorkflow.approvalRole}
                  </p>
                  <p style={{ fontSize: '12px', color: THEME.colors.textSecondary, margin: 0 }}>
                    Automated actions remain in staging quarantine until authorized by certified personnel.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Stage Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <TouchButton
                variant="primary"
                size="md"
                icon={<Play size={16} />}
                onClick={() => {
                  emitEvent({
                    type: 'APPROVAL_REQUIRED',
                    payload: {
                      taskName: selectedWorkflow.title,
                      approvalRole: selectedWorkflow.approvalRole,
                      hasUserGesture: true,
                    },
                  });
                  setActiveNotice({
                    isOpen: true,
                    title: 'Workflow Parameters Staged',
                    subtitle: 'Trigger conditions and approval routing validated.',
                    type: 'info',
                    details: [
                      { label: 'Workflow Title', value: selectedWorkflow.title },
                      { label: 'Trigger Event', value: selectedWorkflow.trigger },
                      { label: 'Approval Required', value: selectedWorkflow.approvalRole },
                      { label: 'Execution Engine', value: 'CALDIM Task Orchestrator (Phase 2)' },
                    ],
                  });
                }}
              >
                Stage Workflow Configuration
              </TouchButton>
            </div>
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
            <ShieldCheck size={24} color={THEME.colors.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontFamily: THEME.typography.fontDisplay, fontSize: '16px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.textPrimary, margin: '0 0 6px 0' }}>
                Workflow Execution Engine Paused
              </h4>
              <p style={{ fontSize: '14px', color: THEME.colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
                In this Phase 1 foundation, you can configure trigger flows and review human approval hierarchies. Active live execution against production MES/ERP endpoints will be enabled when the CALDIM Task Orchestrator backend connects in Phase 2.
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
