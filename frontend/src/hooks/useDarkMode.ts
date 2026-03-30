import { useEffect, useState } from 'react';

const THEME_KEY = 'ccib-theme-react';

const getInitialDarkMode = () => {
  const theme = localStorage.getItem(THEME_KEY);

  return theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
};

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return { isDarkMode, setIsDarkMode };
};
