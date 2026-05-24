import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { MasterDashboardScreen } from '../screens/MasterDashboardScreen';
import { MasterClientsScreen } from '../screens/MasterClientsScreen';
import { ClientCalendarScreen } from '../screens/ClientCalendarScreen';
import { ClientAppointmentsScreen } from '../screens/ClientAppointmentsScreen';
import { ChatsListScreen } from '../screens/ChatsListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { GalleryScreen } from '../screens/GalleryScreen';
import { MasterProfileScreen } from '../screens/MasterProfileScreen';
import { PaymentSetupScreen } from '../screens/PaymentSetupScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { ClientProfileScreen } from '../screens/ClientProfileScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

const premiumTabOptions = (colors: any) => ({
  tabBarActiveTintColor: '#FFFFFF',
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 86 : 72,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    shadowColor: '#C88D7A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 12
  },
  tabBarLabelStyle: {
    textTransform: 'none' as const,
    fontSize: 11,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const
  },
  swipeEnabled: true
});

const ChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatsList" component={ChatsListScreen} />
    <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: true, title: 'Чат', headerBackVisible: false, headerTintColor: '#C88D7A' }} />
  </Stack.Navigator>
);

const MasterDashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MasterDashboard" component={MasterDashboardScreen} />
    <Stack.Screen name="MasterClientsScreen" component={MasterClientsScreen} />
    <Stack.Screen name="StatisticsScreen" component={StatisticsScreen} />
    <Stack.Screen name="PaymentSetupScreen" component={PaymentSetupScreen} />
  </Stack.Navigator>
);

import { SubscriptionScreen } from '../screens/SubscriptionScreen';

const MasterProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MasterProfile" component={MasterProfileScreen} />
    <Stack.Screen name="PaymentSetupScreen" component={PaymentSetupScreen} />
    <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} options={{ headerShown: true, title: 'Підписка', headerTintColor: '#C88D7A' }} />
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
  </Stack.Navigator>
);

const ClientProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClientProfile" component={ClientProfileScreen} />
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: true, title: 'Обрані дизайни', headerTintColor: '#C88D7A' }} />
    <Stack.Screen name="SearchMastersScreen" component={SearchMastersScreen} options={{ headerShown: true, title: 'Пошук майстрів', headerTintColor: '#C88D7A' }} />
    <Stack.Screen name="PublicMasterGalleryScreen" component={PublicMasterGalleryScreen} options={{ headerShown: true, title: 'Галерея майстра', headerTintColor: '#C88D7A' }} />
    <Stack.Screen name="MastersList" component={MastersListScreen} options={{ headerShown: true, title: 'Пошук майстрів', headerTintColor: '#C88D7A' }} />
  </Stack.Navigator>
);

import { GlobalHeaderPremium } from '../components/GlobalHeaderPremium';
import { ClientsListScreen } from '../screens/ClientsListScreen';
import { MastersListScreen } from '../screens/MastersListScreen';
import { SearchMastersScreen } from '../screens/SearchMastersScreen';
import { PublicMasterGalleryScreen } from '../screens/PublicMasterGalleryScreen';
import { useTranslation } from 'react-i18next';

export const MasterTabs = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
    <GlobalHeaderPremium mode="master" />
    <Tab.Navigator 
      tabBarPosition="bottom"
      screenOptions={premiumTabOptions(colors)}>
      <Tab.Screen name="Dashboard" component={MasterDashboardStack} options={{ tabBarLabel: t('tabs.dashboard', {defaultValue: 'Кабінет'}), title: '📋' }} />
      <Tab.Screen name="ClientsList" component={ClientsListScreen} options={{ tabBarLabel: t('tabs.clients', {defaultValue: 'Клієнти'}), title: '👥' }} />
      <Tab.Screen name="ChatsListNav" component={ChatStack} options={{ tabBarLabel: t('tabs.chats', {defaultValue: 'Чати'}), title: '💬' }} />
      <Tab.Screen name="Gallery" component={GalleryScreen} options={{ tabBarLabel: t('tabs.gallery', {defaultValue: 'Галерея'}), title: '🖼' }} />
      <Tab.Screen name="Profile" component={MasterProfileStack} options={{ tabBarLabel: t('tabs.profile', {defaultValue: 'Профіль'}), title: '👤' }} />
    </Tab.Navigator>
    </>
  );
};

export const ClientTabs = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
    <GlobalHeaderPremium mode="client" />
    <Tab.Navigator 
      tabBarPosition="bottom"
      screenOptions={premiumTabOptions(colors)}>
      <Tab.Screen name="Calendar" component={ClientCalendarScreen} options={{ tabBarLabel: t('tabs.dashboard', {defaultValue: 'Календар'}), title: '📅' }} />
      <Tab.Screen name="Appointments" component={ClientAppointmentsScreen} options={{ tabBarLabel: t('tabs.appointments', {defaultValue: 'Записи'}), title: '📝' }} />
      <Tab.Screen name="ChatsListNav" component={ChatStack} options={{ tabBarLabel: t('tabs.chats', {defaultValue: 'Чати'}), title: '💬' }} />
      <Tab.Screen name="Gallery" component={GalleryScreen} options={{ tabBarLabel: t('tabs.gallery', {defaultValue: 'Галерея'}), title: '🖼' }} />
      <Tab.Screen name="Profile" component={ClientProfileStack} options={{ tabBarLabel: t('tabs.profile', {defaultValue: 'Профіль'}), title: '👤' }} />
    </Tab.Navigator>
    </>
  );
};

import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminMastersScreen } from '../screens/AdminMastersScreen';


import { useTheme } from '../context/ThemeContext';

export const AdminTabs = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Tab.Navigator 
      tabBarPosition="bottom"
      screenOptions={premiumTabOptions(colors)}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ tabBarLabel: t('tabs.dashboard', {defaultValue: 'Головна'}), title: '📊' }} />
      <Tab.Screen name="Masters" component={AdminMastersScreen} options={{ tabBarLabel: t('tabs.clients', {defaultValue: 'Майстри'}), title: '👥' }} />
    </Tab.Navigator>
  );
};
