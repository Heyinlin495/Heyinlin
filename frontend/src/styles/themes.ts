// ============================================================
// Theme system — 4 color schemes for different creator types
// ============================================================

import { ThemeType } from '../types';

export interface ThemeColors {
  // Primary palette
  primary: string;
  primaryLight: string;
  primaryDark: string;
  // Secondary palette
  secondary: string;
  secondaryLight: string;
  // Neutrals
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  // Accent
  accent: string;
  accentLight: string;
  // Status
  success: string;
  warning: string;
  error: string;
  // Typography
  fontFamily: string;
  fontFamilyMono: string;
  // Spacing
  radius: string;
  radiusLg: string;
  shadow: string;
  shadowLg: string;
}

export const themes: Record<ThemeType, ThemeColors> = {
  // Creative — vibrant, warm, playful
  creative: {
    primary: '#6C5CE7',
    primaryLight: '#A29BFE',
    primaryDark: '#5A4BD1',
    secondary: '#FD79A8',
    secondaryLight: '#FDCB6E',
    bg: '#FAFAFA',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#F0EEFF',
    text: '#2D3436',
    textSecondary: '#636E72',
    textMuted: '#B2BEC3',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    accent: '#00CEC9',
    accentLight: '#81ECEC',
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#E17055',
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontFamilyMono: "'Fira Code', 'Cascadia Code', monospace",
    radius: '8px',
    radiusLg: '16px',
    shadow: '0 2px 8px rgba(108, 92, 231, 0.08)',
    shadowLg: '0 8px 32px rgba(108, 92, 231, 0.12)',
  },

  // Tech — cool, minimal, professional
  tech: {
    primary: '#0984E3',
    primaryLight: '#74B9FF',
    primaryDark: '#0652DD',
    secondary: '#00CEC9',
    secondaryLight: '#55EFC4',
    bg: '#0F1923',
    bgSecondary: '#1A2733',
    bgTertiary: '#243447',
    text: '#E8F0FE',
    textSecondary: '#A0B4C8',
    textMuted: '#5A7A94',
    border: '#2D4050',
    borderLight: '#1E3040',
    accent: '#6C5CE7',
    accentLight: '#A29BFE',
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#E17055',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
    fontFamilyMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    radius: '4px',
    radiusLg: '8px',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },

  // Photography — elegant, warm, gallery-style
  photography: {
    primary: '#E17055',
    primaryLight: '#FAB1A0',
    primaryDark: '#D35400',
    secondary: '#FDCB6E',
    secondaryLight: '#FFEAA7',
    bg: '#1A1A1A',
    bgSecondary: '#242424',
    bgTertiary: '#2E2E2E',
    text: '#F5F5F5',
    textSecondary: '#B0B0B0',
    textMuted: '#666666',
    border: '#333333',
    borderLight: '#2A2A2A',
    accent: '#E84393',
    accentLight: '#FD79A8',
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#FF7675',
    fontFamily: "'Playfair Display', 'Georgia', 'Noto Serif SC', serif",
    fontFamilyMono: "'SF Mono', 'Consolas', monospace",
    radius: '2px',
    radiusLg: '4px',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 12px 48px rgba(0, 0, 0, 0.5)',
  },

  // Writing — clean, readable, paper-like
  writing: {
    primary: '#2C3E50',
    primaryLight: '#5D6D7E',
    primaryDark: '#1B2631',
    secondary: '#8E6E53',
    secondaryLight: '#C4A882',
    bg: '#FDFBF7',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#F5F0E8',
    text: '#2C3E50',
    textSecondary: '#5D6D7E',
    textMuted: '#95A5A6',
    border: '#E8E0D4',
    borderLight: '#F0EBE3',
    accent: '#D4A574',
    accentLight: '#E8C9A8',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#C0392B',
    fontFamily: "'Source Han Serif SC', 'Noto Serif SC', 'Georgia', serif",
    fontFamilyMono: "'Source Han Mono SC', 'SF Mono', monospace",
    radius: '2px',
    radiusLg: '4px',
    shadow: '0 1px 4px rgba(44, 62, 80, 0.06)',
    shadowLg: '0 4px 16px rgba(44, 62, 80, 0.1)',
  },
};

export const defaultTheme: ThemeType = 'creative';
