import { useEffect, useState } from 'react';

const THEME_KEY = 'ccib-theme-react';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  try {
    const theme = window.localStorage.getItem(THEME_KEY);
    return theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch {
    return false;
  }
};

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    document.documentElement.classList.toggle('dark', isDarkMode);

    try {
      window.localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }, [isDarkMode]);

  return { isDarkMode, setIsDarkMode };
};
