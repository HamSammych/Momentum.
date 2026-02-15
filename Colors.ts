// constants/Colors.ts (or wherever it is)
const basePalette = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceLight: '#141414',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  border: '#1E1E1E',
  white: '#FFFFFF',
  black: '#000000',
  grayLight: '#A3A3A3',
  grayDark: '#525252',
};

export const Colors = {
  dark: basePalette,
  light: basePalette, // Expand later if needed
};

// Generate shades from a single accent hex (user-customizable)
export function generateShades(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    accent: hex,
    accentLight: `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`,
    accentDark: `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`,
    accentAlpha10: `rgba(${r}, ${g}, ${b}, 0.10)`,
    accentAlpha20: `rgba(${r}, ${g}, ${b}, 0.20)`,
  };
}

// Priority styles using accent shades (no fixed green/yellow/red)
export function getPriorityStyle(priority: 'low' | 'medium' | 'high', shades: ReturnType<typeof generateShades>) {
  switch (priority) {
    case 'low':
      return { dot: shades.accentLight, bg: shades.accentAlpha10 };
    case 'medium':
      return { dot: shades.accent, bg: shades.accentAlpha20 };
    case 'high':
      return { dot: shades.accentDark, bg: shades.accentAlpha20 };
    default:
      return { dot: basePalette.grayLight, bg: 'rgba(163, 163, 163, 0.10)' }; // Gray fallback
  }
}

// Category colors: Grays by default, or accent tints
export const categoryColors = [
  basePalette.grayLight,
  basePalette.grayDark,
  '#6B7280',
  '#9CA3AF',
  '#D1D5DB',
  '#F3F4F6',
  '#E5E7EB',
  '#F9FAFB',
]; // All grays — replace with accent if user wants color

export const DEFAULT_ACCENT_HEX = '#6366F1'; // Subtle indigo default