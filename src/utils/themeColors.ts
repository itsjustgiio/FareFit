// Utility to get theme-aware colors
// These match the CSS variables in globals.css - Fresh Start Dark Edition

export const getThemeColors = (isDark: boolean) => ({
  // Main text colors
  text: isDark ? '#E8F4F2' : '#102A43',
  subtext: isDark ? '#A8C0B0' : '#2F4A56',
  
  // Backgrounds
  bg: isDark ? '#0F1C18' : '#E8F4F2',
  card: isDark ? '#1B2A25' : '#FFFFFF',
  input: isDark ? '#1E2D28' : '#FFFFFF',
  
  // Brand colors
  primary: isDark ? '#3DD68C' : '#1C7C54',
  primaryHover: isDark ? '#2EBB76' : '#166B48',
  secondary: isDark ? '#26433A' : '#A8E6CF',
  accent: isDark ? '#FF7C85' : '#FFB6B9',
  
  // UI elements
  border: isDark ? '#22342E' : '#DCEEEF',
  shadow: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.05)',
  
  // Status colors
  error: isDark ? '#FF6B6B' : '#E53E3E',
  warning: isDark ? '#FFB347' : '#F5A623',
  success: '#4DD4AC',
  
  // Legacy support (for gradual migration)
  textPrimary: isDark ? '#E8F4F2' : '#102A43',
  textSecondary: isDark ? '#A8C0B0' : '#2F4A56',
  mint: isDark ? '#26433A' : '#A8E6CF',
  primaryLight: '#4DD4AC',
  cardHover: isDark ? '#1E2D28' : '#f9f9f9',
  inputBg: isDark ? '#1E2D28' : '#FFFFFF',
});