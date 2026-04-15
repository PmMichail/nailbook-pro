import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UnreadContextType = {
  unreadCount: number;
  fetchUnread: () => void;
};

const UnreadContext = createContext<UnreadContextType>({ unreadCount: 0, fetchUnread: () => {} });

export const UnreadProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const role = await AsyncStorage.getItem('role');
      const res = await api.get(`/api/user/unread-count`);
      if (res.data && typeof res.data.count === 'number') {
        setUnreadCount(res.data.count);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // UI poll every 15s 
    return () => clearInterval(interval);
  }, []);

  return (
    <UnreadContext.Provider value={{ unreadCount, fetchUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => useContext(UnreadContext);
