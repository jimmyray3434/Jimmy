import { DefaultTheme } from 'react-native-paper';

export const colors = {
  primary: '#4F46E5', // Indigo
  secondary: '#10B981', // Emerald
  accent: '#F59E0B', // Amber
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#1F2937',
  disabled: '#9CA3AF',
  placeholder: '#6B7280',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    backdrop: colors.backdrop,
    error: colors.error,
  },
  roundness: 8,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    bold: '700',
  },
};

