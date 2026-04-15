import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const PaymentSetupScreen = () => {
  const navigation = useNavigation<any>();
  const [cardNumber, setCardNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [fullName, setFullName] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleSave = async () => {
    // В реальності тут API call: PUT /api/master/payment/setup
    // Згенеруємо мок QR
    const fakeQrBase64 = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MockPaymentInfo';
    setQrCode(fakeQrBase64);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 10}}>
             <Text style={{fontSize: 24, fontWeight: 'bold', color: '#FF69B4'}}>←</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Налаштування Оплати</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>ПІБ Отримувача:</Text>
        <TextInput style={styles.input} placeholder="Іваненко Іван Іванович" value={fullName} onChangeText={setFullName} />
        
        <Text style={styles.label}>Назва банку (Mono, Приват):</Text>
        <TextInput style={styles.input} placeholder="Monobank" value={bankName} onChangeText={setBankName} />
        
        <Text style={styles.label}>Номер картки (IBAN):</Text>
        <TextInput style={styles.input} placeholder="4149 0000 0000 0000" keyboardType="numeric" value={cardNumber} onChangeText={setCardNumber} />
        
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
          <Text style={styles.btnPrimaryText}>Зберегти та згенерувати QR</Text>
        </TouchableOpacity>
      </View>

      {qrCode && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Ваш QR-код для оплати</Text>
          <View style={styles.qrWrapper}>
            <Image source={{ uri: qrCode }} style={styles.qrImage} />
          </View>
          <Text style={styles.qrDesc}>Покажіть цей код клієнту для сканування в банківських додатках.</Text>
          
          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Поділитися QR</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  label: { fontSize: 14, color: '#555', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  btnPrimary: { backgroundColor: '#FF69B4', borderRadius: 20, padding: 15, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  qrContainer: { marginTop: 30, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  qrTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  qrWrapper: { padding: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 15 },
  qrImage: { width: 250, height: 250 },
  qrDesc: { textAlign: 'center', color: '#666', marginBottom: 20, paddingHorizontal: 10 },
  btnSecondary: { backgroundColor: '#98FB98', borderRadius: 20, padding: 15, width: '100%', alignItems: 'center' },
  btnSecondaryText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
});
