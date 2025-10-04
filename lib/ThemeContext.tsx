import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { MMKVStorage } from './mmkvStorage';
import { ThemeMode, ColorScheme, ThemeColors, getThemeColors } from '@/constants/theme';

const THEME_STORAGE_KEY = 'app:theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme() as ColorScheme | null;
  const [mode, setMode] = useState<ThemeMode>('system');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = MMKVStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          const themeMode = savedTheme as ThemeMode;
          setMode(themeMode);

          // Determine color scheme based on mode
          if (themeMode === 'system') {
            setColorScheme(systemColorScheme || 'light');
          } else {
            setColorScheme(themeMode as ColorScheme);
          }
        } else {
          // Default to system
          setColorScheme(systemColorScheme || 'light');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setColorScheme('light');
      }
    };

    loadTheme();
  }, []);

  // Update color scheme when system theme changes (if mode is 'system')
  useEffect(() => {
    if (mode === 'system' && systemColorScheme) {
      setColorScheme(systemColorScheme);
    }
  }, [mode, systemColorScheme]);

  // Set theme mode and persist
  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    MMKVStorage.setItem(THEME_STORAGE_KEY, newMode);

    // Update color scheme immediately
    if (newMode === 'system') {
      setColorScheme(systemColorScheme || 'light');
    } else {
      setColorScheme(newMode as ColorScheme);
    }
  }, [systemColorScheme]);

  // Toggle between light and dark (for quick toggle)
  const toggleTheme = useCallback(() => {
    const newScheme: ColorScheme = colorScheme === 'light' ? 'dark' : 'light';
    setThemeMode(newScheme);
  }, [colorScheme, setThemeMode]);

  const colors = getThemeColors(colorScheme);

  const value: ThemeContextValue = {
    mode,
    colorScheme,
    colors,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
