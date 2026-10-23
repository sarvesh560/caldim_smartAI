/**
 * CALDIM SmartAssist Companion — Centralized Theme Module
 *
 * Brand Palette:
 * - Primary Teal: #0F6B68
 * - Deep Teal: #084C4A
 * - Accent Teal: #3C918C
 * - Bright Pale Blue & Soft Neutral Backgrounds: #F4F8F8, #EBF3F3, #FFFFFF
 *
 * Touch-First Exhibition Kiosk Specifications
 */

export const THEME = {
  colors: {
    // Brand Teals
    primary: '#0F6B68',
    primaryHover: '#0B5653',
    deepTeal: '#084C4A',
    accentTeal: '#3C918C',
    accentTealLight: '#52AEA8',
    glowTeal: '#4ED2CB',
    tealMuted: 'rgba(15, 107, 104, 0.12)',
    tealGlow: 'rgba(78, 210, 203, 0.35)',

    // Bright Environment Backgrounds
    bgEnvironment: '#F4F8F8',
    bgCanvas: '#EBF3F3',
    bgWhite: '#FFFFFF',
    bgSubtle: '#F8FAFA',
    bgOverlay: 'rgba(8, 76, 74, 0.45)',

    // Translucent Panels (Glassmorphism)
    panelBg: 'rgba(255, 255, 255, 0.88)',
    panelBgHover: 'rgba(255, 255, 255, 0.96)',
    panelBorder: 'rgba(15, 107, 104, 0.16)',
    panelBorderHover: 'rgba(60, 145, 140, 0.4)',

    // Typography
    textPrimary: '#122524',
    textSecondary: '#4A6261',
    textMuted: '#7D9695',
    textInverse: '#FFFFFF',
    textAccent: '#0F6B68',

    // Status & Feedback
    statusReady: '#10B981',
    statusWarning: '#F59E0B',
    statusInfo: '#0284C7',
    statusPending: '#8B5CF6',
  },

  typography: {
    fontDisplay: '"Outfit", "Plus Jakarta Sans", system-ui, sans-serif',
    fontBody: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    hero: '64px',
  },

  radii: {
    sm: '8px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    pill: '9999px',
  },

  shadows: {
    subtle: '0 2px 8px rgba(8, 76, 74, 0.04)',
    panel: '0 8px 30px rgba(15, 107, 104, 0.08), 0 2px 6px rgba(15, 107, 104, 0.04)',
    panelHover: '0 16px 40px rgba(15, 107, 104, 0.14), 0 4px 12px rgba(15, 107, 104, 0.06)',
    glow: '0 0 24px rgba(78, 210, 203, 0.45)',
    glowTeal: '0 0 36px rgba(15, 107, 104, 0.25)',
  },

  animations: {
    durations: {
      instant: '150ms',
      quick: '250ms',
      smooth: '400ms',
      slow: '700ms',
    },
    easings: {
      standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  touch: {
    minTargetSize: '48px',
    kioskPadding: '24px',
  },
} as const;

export type Theme = typeof THEME;
