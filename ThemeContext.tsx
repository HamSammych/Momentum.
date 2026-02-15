import { createContext, useContext, useMemo, ReactNode } from 'react';
import { Colors, generateAccentShades } from '@/constants/Colors';
import { useAccent } from './AccentContext';

interface ThemeContextType {
  theme: 'dark';
  colors: typeof Colors.dark & {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryAlpha10: string;
    primaryAlpha20: string;
  };
  accent: string;
  accentShades: ReturnType<typeof generateAccentShades>;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: {
    ...Colors.dark,
    primary: '#6366F1',
    primaryLight: '#6366F1',
    primaryDark: '#6366F1',
    primaryAlpha10: 'rgba(99, 102, 241, 0.10)',
    primaryAlpha20: 'rgba(99, 102, 241, 0.20)',
  },
  accent: '#6366F1',
  accentShades: generateAccentShades('#6366F1'),
  toggleTheme: () => {},
  isDark: true,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { accent } = useAccent();

  const accentShades = useMemo(() => generateAccentShades(accent), [accent]);

  const colors = useMemo(
    () => ({
      ...Colors.dark,
      primary: accentShades.primary,
      primaryLight: accentShades.primaryLight,
      primaryDark: accentShades.primaryDark,
      primaryAlpha10: accentShades.primaryAlpha10,
      primaryAlpha20: accentShades.primaryAlpha20,
    }),
    [accentShades]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme: 'dark',
        colors,
        accent,
        accentShades,
        toggleTheme: () => {},
        isDark: true,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
