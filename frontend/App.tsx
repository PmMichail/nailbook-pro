import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { TermsScreen } from './src/screens/TermsScreen';
import { MasterTabs, ClientTabs, AdminTabs } from './src/navigation/Navigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import './src/i18n';
import { UnreadProvider } from './src/context/UnreadContext';
import { DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import './src/i18n';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import api from './src/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isDark, colors } = useTheme();

  const CustomTheme = {
    ...(isDark ? NavDarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? NavDarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={CustomTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="TermsScreen" component={TermsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MasterTabs" component={MasterTabs} />
        <Stack.Screen name="ClientTabs" component={ClientTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load fonts
  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'Poppins-Regular': Poppins_400Regular,
        'Poppins-Medium': Poppins_500Medium,
        'Poppins-SemiBold': Poppins_600SemiBold,
        'Poppins-Bold': Poppins_700Bold,
      });
      setFontsLoaded(true);
    };
    loadFonts();
  }, []);

  // Prewake server on app start
  useEffect(() => {
    const prewake = async () => {
      try {
        const API_URL = api.defaults.baseURL;
        console.log('[PREWAKE] Waking up server on app start...');
        await fetch(`${API_URL}/api/auth/login`, { method: 'HEAD' });
        console.log('[PREWAKE] Server prewaked');
      } catch(e) {
        console.log('[PREWAKE] Prewake attempt finished (server may be waking up)');
      }
    };
    prewake();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
        <UnreadProvider>
      <AppNavigator />
            </UnreadProvider>
      </ThemeProvider>
  );
}
