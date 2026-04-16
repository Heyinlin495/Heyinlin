// Theme context — manage active theme
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ThemeType } from '../types';
import { themes, defaultTheme } from '../styles/themes';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof themes.creative;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('theme') as ThemeType;
    return saved && themes[saved] ? saved : defaultTheme;
  });

  const colors = themes[theme];

  // Apply theme CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-light', colors.primaryLight);
    root.style.setProperty('--primary-dark', colors.primaryDark);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-light', colors.secondaryLight);
    root.style.setProperty('--bg', colors.bg);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-tertiary', colors.bgTertiary);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--border-light', colors.borderLight);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-light', colors.accentLight);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--error', colors.error);
    root.style.setProperty('--font-family', colors.fontFamily);
    root.style.setProperty('--font-family-mono', colors.fontFamilyMono);
    root.style.setProperty('--radius', colors.radius);
    root.style.setProperty('--radius-lg', colors.radiusLg);
    root.style.setProperty('--shadow', colors.shadow);
    root.style.setProperty('--shadow-lg', colors.shadowLg);
    root.style.setProperty('background-color', colors.bg);
    root.style.setProperty('color', colors.text);
    root.style.setProperty('font-family', colors.fontFamily);

    localStorage.setItem('theme', theme);
  }, [theme, colors]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
