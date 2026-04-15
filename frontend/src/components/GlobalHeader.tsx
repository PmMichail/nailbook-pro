import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useUnread } from '../context/UnreadContext';

export const GlobalHeader = () => {
  const [salonName, setSalonName] = useState('NailsBook Pro');
  const [salonLogo, setSalonLogo] = useState<string | null>(null);
  const navigation = useNavigation();
  const { unreadCount } = useUnread();

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
         const u = JSON.parse(uStr);
         if (u.salonName) setSalonName(u.salonName);
         if (u.salonLogo) {
             const formattedLogo = u.salonLogo.startsWith('http') ? u.salonLogo : `${api.defaults.baseURL}/${u.salonLogo}`;
             setSalonLogo(formattedLogo);
         } else if (u.masterId) {
             // If client, fetch master's info to show
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
    <View style={styles.container}>
       {salonLogo ? (
           <Image source={{uri: salonLogo}} style={styles.logo} />
       ) : (
           <View style={styles.placeholderLogo}><Text style={{color: '#fff', fontWeight: 'bold'}}>💅</Text></View>
       )}
       
       <View style={{flex: 1}}>
         <Text style={styles.title}>{salonName}</Text>
       </View>
       <TouchableOpacity onPress={() => navigation.navigate('ChatsListNav' as never)} style={{marginRight: 10}}>
         <Text style={{fontSize: 24}}>🔔</Text>
         {unreadCount > 0 && (
           <View style={{position: 'absolute', right: -5, top: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center'}}>
             <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold'}}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
           </View>
         )}
       </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    elevation: 3
  },
  logo: {
      width: 40,
      height: 40,
      borderRadius: 10,
      marginRight: 15
  },
  placeholderLogo: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#FF69B4',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15
  },
  title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333'
  }
});
