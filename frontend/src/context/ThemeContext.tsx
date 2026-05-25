import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const lightTheme = {
  background: '#FFF8F5',
  card: '#ffffff',
  text: '#2A1D19',
  textSecondary: '#8B756E',
  primary: '#B87460',
  border: '#EADAD2',
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
};

export const darkTheme = {
  background: '#17100F',
  card: '#251A18',
  text: '#FFF8F5',
  textSecondary: '#D7C2B9',
  primary: '#E8B9A7',
  border: '#44312C',
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
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
