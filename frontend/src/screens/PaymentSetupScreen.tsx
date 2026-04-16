import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export const PaymentSetupScreen = () => {
  const { colors, isDark } = useTheme();
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 10}}>
             <Text style={{fontSize: 24, fontWeight: 'bold', color: colors.primary}}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>Налаштування Оплати</Text>
      </View>
      
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000' : '#ccc' }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>ПІБ Отримувача:</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="Іваненко Іван Іванович" placeholderTextColor={colors.textSecondary} value={fullName} onChangeText={setFullName} />
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Назва банку (Mono, Приват):</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="Monobank" placeholderTextColor={colors.textSecondary} value={bankName} onChangeText={setBankName} />
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Номер картки (IBAN):</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="4149 0000 0000 0000" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={cardNumber} onChangeText={setCardNumber} />
        
        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>Зберегти та згенерувати QR</Text>
        </TouchableOpacity>
      </View>

      {qrCode && (
        <View style={[styles.qrContainer, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000' : '#ccc' }]}>
          <Text style={[styles.qrTitle, { color: colors.text }]}>Ваш QR-код для оплати</Text>
          <View style={[styles.qrWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Image source={{ uri: qrCode }} style={styles.qrImage} />
          </View>
          <Text style={[styles.qrDesc, { color: colors.textSecondary }]}>Покажіть цей код клієнту для сканування в банківських додатках.</Text>
          
          <TouchableOpacity style={[styles.btnSecondary, { borderColor: colors.primary, borderWidth: 1 }]}>
            <Text style={[styles.btnSecondaryText, { color: colors.primary }]}>Поділитися QR</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 15 },
  header: { fontSize: 24, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold' },
  card: { borderRadius: 20, padding: 20, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderWidth: 1 },
  label: { fontSize: 14, marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  btnPrimary: { borderRadius: 20, padding: 15, alignItems: 'center' },
  btnPrimaryText: { fontWeight: 'bold', fontSize: 16 },

  qrContainer: { marginTop: 30, alignItems: 'center', borderRadius: 20, padding: 20, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderWidth: 1 },
  qrTitle: { fontSize: 18, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', marginBottom: 20 },
  qrWrapper: { padding: 10, borderWidth: 1, borderRadius: 10, marginBottom: 15 },
  qrImage: { width: 250, height: 250 },
  qrDesc: { textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  btnSecondary: { borderRadius: 20, padding: 15, width: '100%', alignItems: 'center' },
  btnSecondaryText: { fontWeight: 'bold', fontSize: 16 },
});
