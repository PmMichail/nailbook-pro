import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  background: '#FAF9F6', 
  card: '#ffffff',
  text: '#2C2A29', 
  textSecondary: '#8B8682', 
  primary: '#e0c0b4', 
  border: '#E8E6E1'
};

export const darkTheme = {
  background: '#161212',
  card: '#221A1A',
  text: '#F5F5F5',
  textSecondary: '#A9A4A1',
  primary: '#e0c0b4',
  border: '#332929'
};

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightTheme;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightTheme
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme === 'dark') setIsDark(true);
    } catch(e) {}
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
