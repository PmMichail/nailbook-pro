import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { MasterTabs, ClientTabs, AdminTabs } from './src/navigation/Navigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { UnreadProvider } from './src/context/UnreadContext';
import { DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import './src/i18n';
import * as Notifications from 'expo-notifications';

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
        <Stack.Screen name="MasterTabs" component={MasterTabs} />
        <Stack.Screen name="ClientTabs" component={ClientTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
        <UnreadProvider>
      <AppNavigator />
            </UnreadProvider>
      </ThemeProvider>
  );
}
