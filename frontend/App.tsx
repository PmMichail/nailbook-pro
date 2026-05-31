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
import * as SplashScreen from 'expo-splash-screen';
import api from './src/api/client';

SplashScreen.preventAutoHideAsync();

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
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[APP] Initializing...');
        
        // Initialize notifications
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        console.log('[APP] Notifications initialized');
        
        // Prewake server in background without blocking
        const API_URL = api.defaults.baseURL;
        console.log('[PREWAKE] Waking up server in background...');
        fetch(`${API_URL}/api/auth/login`, { method: 'HEAD' })
          .then(() => console.log('[PREWAKE] Server prewaked'))
          .catch(() => console.log('[PREWAKE] Prewake attempt finished'));
        
        console.log('[APP] Initialization complete');
      } catch (e) {
        console.error('[APP] Initialization error:', e);
      } finally {
        // Always hide splash screen immediately
        console.log('[APP] Hiding splash screen');
        await SplashScreen.hideAsync();
        setAppIsReady(true);
      }
    }
    
    prepare();
  }, []);

  if (!appIsReady) {
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
