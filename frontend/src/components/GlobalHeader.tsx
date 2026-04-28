import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useUnread } from '../context/UnreadContext';
import { useTheme } from '../context/ThemeContext';

export const GlobalHeader = () => {
  const [salonName, setSalonName] = useState('NailsBook Pro');
  const [salonLogo, setSalonLogo] = useState<string | null>(null);
  const navigation = useNavigation();
  const { unreadCount } = useUnread();
  const { colors } = useTheme();

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
         const u = JSON.parse(uStr);
         if (u.salonName) setSalonName(u.salonName);
         if (u.salonLogo || u.avatarUrl) {
             const logoUrl = u.salonLogo || u.avatarUrl;
             const formattedLogo = logoUrl.startsWith('http') ? logoUrl : `${api.defaults.baseURL}/${logoUrl}`;
             setSalonLogo(formattedLogo);
         } else if (u.masterId) {
             // If client without avatar, fetch master's info to show their logo
             const masterRes = await api.get(`/api/client/master/${u.masterId}`);
             if (masterRes.data) {
                if (masterRes.data.salonName) setSalonName(masterRes.data.salonName);
                if (masterRes.data.salonLogo) {
                   const mLogo = masterRes.data.salonLogo.startsWith('http') ? masterRes.data.salonLogo : `${api.defaults.baseURL}/${masterRes.data.salonLogo}`;
                   setSalonLogo(mLogo);
                }
             }
         }
      }
    } catch(e) {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
       <TouchableOpacity style={{marginRight: 15}} onPress={() => navigation.openDrawer && navigation.openDrawer()}>
          <Text style={{fontSize: 24, color: colors.textSecondary}}>≡</Text>
       </TouchableOpacity>
       
       <View style={{flex: 1, alignItems: 'center'}}>
         <Text style={[styles.title, { color: colors.text }]}>{salonName.toUpperCase()}</Text>
       </View>
       
       <TouchableOpacity onPress={() => navigation.navigate('ChatsListNav' as never)} style={{ position: 'relative' }}>
          {salonLogo ? (
              <Image source={{uri: salonLogo}} style={[styles.logo, { borderColor: colors.border }]} />
          ) : (
              <View style={[styles.placeholderLogo, { backgroundColor: colors.primary }]}>
                <Text style={{color: '#fff', fontSize: 16}}>👩</Text>
              </View>
          )}

          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
       </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 55,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  logo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1
  },
  placeholderLogo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
  },
  title: {
      fontSize: 18,
      fontFamily: 'serif',
      fontStyle: 'italic',
      letterSpacing: 2,
      fontWeight: 'bold',
  },
  badge: {
     position: 'absolute', 
     right: -5, 
     top: -5, 
     borderRadius: 10, 
     width: 20, 
     height: 20, 
     justifyContent: 'center', 
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#fff'
  },
  badgeText: {
     color: '#fff', 
     fontSize: 10, 
     fontWeight: 'bold'
  }
});
