export const Colors = {
  light: {
    primary: '#4A90E2',
    primaryDark: '#3A7AC8',
    primaryLight: '#6BA8F0',

    secondary: '#FFD54F',
    accent: '#00C49A',
    warning: '#FF6B6B',

    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowDark: 'rgba(0, 0, 0, 0.12)',

    success: '#00C49A',
    error: '#FF6B6B',
    info: '#4A90E2',

    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    primary: '#4A90E2',
    primaryDark: '#3A7AC8',
    primaryLight: '#6BA8F0',

    secondary: '#FFD54F',
    accent: '#00C49A',
    warning: '#FF6B6B',

    background: '#121212',
    surface: '#1E1E1E',
    surfaceElevated: '#2A2A2A',

    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',

    border: '#374151',
    borderLight: '#2A2A2A',

    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',

    success: '#00C49A',
    error: '#FF6B6B',
    info: '#4A90E2',

    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const CategoryColors = [
  '#4A90E2',
  '#00C49A',
  '#FF6B6B',
  '#FFD54F',
  '#9B59B6',
  '#FF9F43',
  '#26C6DA',
  '#AB47BC',
  '#66BB6A',
  '#EF5350',
];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 9999,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Layout = {
  maxWidth: 768,
  headerHeight: 56,
  tabBarHeight: 60,
  fabSize: 56,
  noteCardMinHeight: 120,
};
