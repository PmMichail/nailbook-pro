import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

const ChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatsList" component={ChatsListScreen} />
    <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: true, title: 'Чат', headerBackVisible: false, headerTintColor: '#FF69B4' }} />
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
    <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} options={{ headerShown: true, title: 'Підписка', headerTintColor: '#FF69B4' }} />
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
  </Stack.Navigator>
);

const ClientProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClientProfile" component={ClientProfileScreen} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: true, title: 'Обрані дизайни', headerTintColor: '#FF69B4' }} />
    <Stack.Screen name="SearchMastersScreen" component={SearchMastersScreen} options={{ headerShown: true, title: 'Пошук майстрів', headerTintColor: '#FF69B4' }} />
    <Stack.Screen name="PublicMasterGalleryScreen" component={PublicMasterGalleryScreen} options={{ headerShown: true, title: 'Галерея майстра', headerTintColor: '#FF69B4' }} />
    <Stack.Screen name="MastersList" component={MastersListScreen} options={{ headerShown: true, title: 'Пошук майстрів', headerTintColor: '#FF69B4' }} />
  </Stack.Navigator>
);

import { GlobalHeader } from '../components/GlobalHeader';
import { ClientsListScreen } from '../screens/ClientsListScreen';
import { MastersListScreen } from '../screens/MastersListScreen';
import { SearchMastersScreen } from '../screens/SearchMastersScreen';
import { PublicMasterGalleryScreen } from '../screens/PublicMasterGalleryScreen';

export const MasterTabs = () => {
  return (
    <>
    <GlobalHeader />
    <Tab.Navigator 
      tabBarPosition="bottom"
      screenOptions={{ 
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', elevation: 10 },
        tabBarIndicatorStyle: { backgroundColor: 'transparent' },
        tabBarLabelStyle: { textTransform: 'none', fontSize: 12 },
        swipeEnabled: true
    }}>
      <Tab.Screen name="Dashboard" component={MasterDashboardStack} options={{ tabBarLabel: 'Кабінет', title: '📋' }} />
      <Tab.Screen name="ClientsList" component={ClientsListScreen} options={{ tabBarLabel: 'Клієнти', title: '👥' }} />
      <Tab.Screen name="ChatsListNav" component={ChatStack} options={{ tabBarLabel: 'Чати', title: '💬' }} />
      <Tab.Screen name="Gallery" component={GalleryScreen} options={{ tabBarLabel: 'Галерея', title: '🖼' }} />
      <Tab.Screen name="Profile" component={MasterProfileStack} options={{ tabBarLabel: 'Профіль', title: '👤' }} />
    </Tab.Navigator>
    </>
  );
};

export const ClientTabs = () => {
  return (
    <>
    <GlobalHeader />
    <Tab.Navigator 
      tabBarPosition="bottom"
      screenOptions={{ 
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', elevation: 10 },
        tabBarIndicatorStyle: { height: 2, backgroundColor: '#FF69B4', top: 0 },
        tabBarLabelStyle: { textTransform: 'none', fontSize: 12 },
        swipeEnabled: true
    }}>
      <Tab.Screen name="Calendar" component={ClientCalendarScreen} options={{ tabBarLabel: 'Календар', title: '📅' }} />
      <Tab.Screen name="Appointments" component={ClientAppointmentsScreen} options={{ tabBarLabel: 'Мої записи', title: '📝' }} />
      <Tab.Screen name="ChatsListNav" component={ChatStack} options={{ tabBarLabel: 'Чати', title: '💬' }} />
      <Tab.Screen name="Gallery" component={GalleryScreen} options={{ tabBarLabel: 'Галерея', title: '🖼' }} />
      <Tab.Screen name="Profile" component={ClientProfileStack} options={{ tabBarLabel: 'Профіль', title: '👤' }} />
    </Tab.Navigator>
    </>
  );
};

import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminMastersScreen } from '../screens/AdminMastersScreen';

export const AdminTabs = () => {
  return (
    <Tab.Navigator 
      tabBarPosition="bottom"
      screenOptions={{ 
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', elevation: 10 },
        tabBarIndicatorStyle: { height: 2, backgroundColor: '#FF69B4', top: 0 },
        tabBarLabelStyle: { textTransform: 'none', fontSize: 12 },
        swipeEnabled: true
    }}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ tabBarLabel: 'Головна', title: '📊' }} />
      <Tab.Screen name="Masters" component={AdminMastersScreen} options={{ tabBarLabel: 'Майстри', title: '👥' }} />
    </Tab.Navigator>
  );
};
