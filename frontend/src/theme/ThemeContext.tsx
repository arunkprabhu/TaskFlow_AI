/**
 * Theme Context with Dark/Light Mode and Gradients
 */

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

export const ThemeProviderWrapper: React.FC<ThemeProviderWrapperProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('dark');

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode colors
                primary: {
                  main: '#6366f1',
                  light: '#818cf8',
                  dark: '#4f46e5',
                },
                secondary: {
                  main: '#ec4899',
                  light: '#f472b6',
                  dark: '#db2777',
                },
                background: {
                  default: '#f8fafc',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#1e293b',
                  secondary: '#64748b',
                },
              }
            : {
                // Dark mode — rich cyber-dark theme
                primary: {
                  main: '#22d3ee',
                  light: '#67e8f9',
                  dark: '#0891b2',
                },
                secondary: {
                  main: '#a78bfa',
                  light: '#c4b5fd',
                  dark: '#7c3aed',
                },
                background: {
                  default: '#080d1a',
                  paper: '#0f1629',
                },
                text: {
                  primary: '#e2e8f0',
                  secondary: '#94a3b8',
                },
                divider: 'rgba(34,211,238,0.12)',
              }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h3: {
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: mode === 'light'
              ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
              : 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          },
          h5: { fontWeight: 700, letterSpacing: '-0.3px' },
          h6: { fontWeight: 700, letterSpacing: '-0.2px' },
          subtitle1: { fontWeight: 500, letterSpacing: '0.1px' },
          body1: { letterSpacing: '0.1px' },
          body2: { letterSpacing: '0.1px' },
          button: {
            fontWeight: 700,
            letterSpacing: '0.4px',
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            defaultProps: {
              disableElevation: false,
            },
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.4px',
                borderRadius: 10,
                padding: '10px 26px',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                '&:active': { transform: 'translateY(1px) scale(0.98)' },
              },

              // ── contained primary → violet-to-fuchsia ────────────────────
              contained: {
                color: '#ffffff',
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)'
                  : 'linear-gradient(135deg, #6d28d9 0%, #be185d 100%)',
                boxShadow: '0 4px 18px rgba(124,58,237,0.45)',
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  background: mode === 'light'
                    ? 'linear-gradient(135deg, #6d28d9 0%, #9d174d 100%)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                  boxShadow: '0 10px 30px rgba(124,58,237,0.6)',
                },
              },

              // ── contained success → emerald-to-cyan ─────────────────────
              containedSuccess: {
                color: '#ffffff',
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #059669 0%, #0891b2 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                boxShadow: '0 4px 18px rgba(5,150,105,0.45)',
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  background: mode === 'light'
                    ? 'linear-gradient(135deg, #047857 0%, #0e7490 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                  boxShadow: '0 10px 30px rgba(5,150,105,0.6)',
                },
              },

              // ── contained error → rose-to-orange ────────────────────────
              containedError: {
                color: '#ffffff',
                background: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)',
                boxShadow: '0 4px 18px rgba(244,63,94,0.45)',
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  background: 'linear-gradient(135deg, #e11d48 0%, #ea580c 100%)',
                  boxShadow: '0 10px 30px rgba(244,63,94,0.6)',
                },
              },

              // ── contained info → sky-to-indigo ──────────────────────────
              containedInfo: {
                color: '#ffffff',
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)'
                  : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                boxShadow: '0 4px 18px rgba(2,132,199,0.45)',
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  background: mode === 'light'
                    ? 'linear-gradient(135deg, #0369a1 0%, #4338ca 100%)'
                    : 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                  boxShadow: '0 10px 30px rgba(2,132,199,0.6)',
                },
              },

              // ── outlined primary → amber border ─────────────────────────
              outlined: {
                borderWidth: '2px',
                borderColor: mode === 'light' ? '#d97706' : '#f59e0b',
                color: mode === 'light' ? '#b45309' : '#f59e0b',
                background: mode === 'light'
                  ? 'rgba(251,191,36,0.04)'
                  : 'rgba(245,158,11,0.06)',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-3px) scale(1.02)',
                  borderColor: mode === 'light' ? '#b45309' : '#fbbf24',
                  color: mode === 'light' ? '#92400e' : '#fcd34d',
                  background: mode === 'light'
                    ? 'rgba(251,191,36,0.12)'
                    : 'rgba(245,158,11,0.14)',
                  boxShadow: mode === 'light'
                    ? '0 6px 20px rgba(217,119,6,0.3)'
                    : '0 6px 20px rgba(245,158,11,0.35)',
                },
              },

              // ── outlined secondary → fuchsia border ─────────────────────
              outlinedSecondary: {
                borderWidth: '2px',
                borderColor: mode === 'light' ? '#a21caf' : '#e879f9',
                color: mode === 'light' ? '#a21caf' : '#e879f9',
                background: mode === 'light'
                  ? 'rgba(162,28,175,0.04)'
                  : 'rgba(232,121,249,0.06)',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-3px) scale(1.02)',
                  borderColor: mode === 'light' ? '#86198f' : '#f0abfc',
                  color: mode === 'light' ? '#86198f' : '#f0abfc',
                  background: mode === 'light'
                    ? 'rgba(162,28,175,0.1)'
                    : 'rgba(232,121,249,0.12)',
                  boxShadow: mode === 'light'
                    ? '0 6px 20px rgba(162,28,175,0.3)'
                    : '0 6px 20px rgba(232,121,249,0.35)',
                },
              },

              // ── outlined error → rose border ────────────────────────────
              outlinedError: {
                borderWidth: '2px',
                borderColor: '#f43f5e',
                color: '#f43f5e',
                background: 'rgba(244,63,94,0.04)',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-3px) scale(1.02)',
                  borderColor: '#e11d48',
                  color: '#e11d48',
                  background: 'rgba(244,63,94,0.1)',
                  boxShadow: '0 6px 20px rgba(244,63,94,0.3)',
                },
              },

              // ── outlined info → sky border ───────────────────────────────
              outlinedInfo: {
                borderWidth: '2px',
                borderColor: mode === 'light' ? '#0284c7' : '#38bdf8',
                color: mode === 'light' ? '#0284c7' : '#38bdf8',
                background: mode === 'light'
                  ? 'rgba(2,132,199,0.04)'
                  : 'rgba(56,189,248,0.06)',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-3px) scale(1.02)',
                  borderColor: mode === 'light' ? '#0369a1' : '#7dd3fc',
                  color: mode === 'light' ? '#0369a1' : '#7dd3fc',
                  background: mode === 'light'
                    ? 'rgba(2,132,199,0.1)'
                    : 'rgba(56,189,248,0.12)',
                  boxShadow: mode === 'light'
                    ? '0 6px 20px rgba(2,132,199,0.3)'
                    : '0 6px 20px rgba(56,189,248,0.35)',
                },
              },

              // ── text → slate, turns teal on hover ───────────────────────
              text: {
                color: mode === 'light' ? '#64748b' : '#94a3b8',
                '&:hover': {
                  color: mode === 'light' ? '#0284c7' : '#38bdf8',
                  background: mode === 'light'
                    ? 'rgba(2,132,199,0.07)'
                    : 'rgba(56,189,248,0.07)',
                  boxShadow: 'none',
                  transform: 'none',
                },
              },

              sizeSmall: { fontSize: '0.8rem', padding: '6px 16px', borderRadius: 8 },
              sizeLarge: { fontSize: '0.95rem', padding: '12px 30px' },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)'
                  : 'linear-gradient(135deg, #080d1a 0%, #0c1628 60%, #0f1a30 100%)',
                borderBottom: mode === 'dark' ? '1px solid rgba(34,211,238,0.18)' : 'none',
                backdropFilter: 'blur(12px)',
                boxShadow: mode === 'dark' ? '0 2px 24px rgba(34,211,238,0.08)' : undefined,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backdropFilter: 'blur(12px)',
                border: mode === 'light' 
                  ? '1px solid rgba(226, 232, 240, 0.8)'
                  : '1px solid rgba(34, 211, 238, 0.12)',
                boxShadow: mode === 'dark'
                  ? '0 4px 32px rgba(34,211,238,0.06), inset 0 1px 0 rgba(34,211,238,0.08)'
                  : undefined,
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                '& .MuiTableCell-head': {
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(8,13,26,0.9) 0%, rgba(15,22,41,0.9) 100%)'
                    : undefined,
                  color: mode === 'dark' ? '#22d3ee' : undefined,
                  borderBottom: mode === 'dark' ? '1px solid rgba(34,211,238,0.2)' : undefined,
                },
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                '&:hover': {
                  backgroundColor: mode === 'dark'
                    ? 'rgba(34,211,238,0.04) !important'
                    : undefined,
                },
              },
            },
          },
          MuiCssBaseline: {
            styleOverrides: {
              '*': {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === 'dark'
                  ? 'rgba(34,211,238,0.35) rgba(8,13,26,0.4)'
                  : 'rgba(99,102,241,0.35) rgba(226,232,240,0.4)',
              },
              '*::-webkit-scrollbar': {
                width: '5px',
                height: '5px',
              },
              '*::-webkit-scrollbar-track': {
                background: mode === 'dark'
                  ? 'rgba(8,13,26,0.4)'
                  : 'rgba(226,232,240,0.4)',
                borderRadius: '10px',
              },
              '*::-webkit-scrollbar-thumb': {
                background: mode === 'dark'
                  ? 'rgba(34,211,238,0.35)'
                  : 'rgba(99,102,241,0.35)',
                borderRadius: '10px',
                '&:hover': {
                  background: mode === 'dark'
                    ? 'rgba(34,211,238,0.6)'
                    : 'rgba(99,102,241,0.6)',
                },
              },
              '*::-webkit-scrollbar-corner': {
                background: 'transparent',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
