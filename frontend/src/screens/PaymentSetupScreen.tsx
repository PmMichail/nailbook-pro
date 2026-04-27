import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export const PaymentSetupScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  
  const [cardNumber, setCardNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  
  const [requirePrepaymentGlobal, setRequirePrepaymentGlobal] = useState(false);
  const [globalPrepaymentAmount, setGlobalPrepaymentAmount] = useState('');

  const [liqpayPublicKey, setLiqpayPublicKey] = useState('');
  const [liqpayPrivateKey, setLiqpayPrivateKey] = useState('');

  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    try {
      const res = await api.get('/api/master/payment-details');
      if (res.data?.info) {
         setCardNumber(res.data.info.cardNumber || '');
         setBankName(res.data.info.bankName || '');
         setPaymentLink(res.data.info.qrCodeUrl || '');
         setRequirePrepaymentGlobal(res.data.info.requirePrepaymentGlobal || false);
         setGlobalPrepaymentAmount(res.data.info.globalPrepaymentAmount ? res.data.info.globalPrepaymentAmount.toString() : '');
         setLiqpayPublicKey(res.data.info.liqpayPublicKey || '');
         setLiqpayPrivateKey(res.data.info.liqpayPrivateKey || '');
      }
    } catch(e) {}
  };

  const handleSave = async () => {
    try {
      await api.put('/api/master/payment-details', {
         cardNumber,
         bankName,
         paymentLink,
         requirePrepaymentGlobal,
         globalPrepaymentAmount,
         liqpayPublicKey,
         liqpayPrivateKey
      });
      Alert.alert('Успіх', 'Налаштування оплат збережено');
      navigation.goBack();
    } catch(e) {
      Alert.alert('Помилка', 'Не вдалося зберегти дані');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 10}}>
             <Text style={{fontSize: 24, fontWeight: 'bold', color: colors.primary}}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>Налаштування Фінансів</Text>
      </View>
      
      {/* P2P Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000' : '#ccc' }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>💳 Оплата на картку (P2P)</Text>
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Назва банку (Mono, Приват):</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="Monobank" placeholderTextColor={colors.textSecondary} value={bankName} onChangeText={setBankName} />
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Номер картки (IBAN):</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="4149 0000 0000 0000" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={cardNumber} onChangeText={setCardNumber} />
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Посилання на Банку / Send (опціонально):</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="https://send.monobank.ua/..." placeholderTextColor={colors.textSecondary} value={paymentLink} onChangeText={setPaymentLink} />
      </View>

      {/* Prepayment Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000' : '#ccc' }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>💰 Передоплата (PRO)</Text>
        
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
           <Text style={[styles.label, { color: colors.text, flex: 1, marginRight: 10 }]}>Вимагати передоплату для нових записів глобально</Text>
           <Switch value={requirePrepaymentGlobal} onValueChange={setRequirePrepaymentGlobal} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>

        {requirePrepaymentGlobal && (
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Сума передоплати за замовчуванням (грн):</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="Наприклад, 200" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={globalPrepaymentAmount} onChangeText={setGlobalPrepaymentAmount} />
            </View>
        )}
      </View>

      {/* LiqPay Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000' : '#ccc', marginBottom: 40 }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>🏦 Інтеграція LiqPay (ФОП)</Text>
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Public Key:</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="sandbox_pub..." placeholderTextColor={colors.textSecondary} value={liqpayPublicKey} onChangeText={setLiqpayPublicKey} />
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Private Key:</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} placeholder="sandbox_priv..." placeholderTextColor={colors.textSecondary} secureTextEntry value={liqpayPrivateKey} onChangeText={setLiqpayPrivateKey} />
        
      </View>

      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.primary, marginBottom: 80 }]} onPress={handleSave}>
        <Text style={[styles.btnPrimaryText, { color: isDark ? '#000' : '#fff' }]}>Зберегти Налаштування</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,  padding: 15 },
  header: { fontSize: 24, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', marginBottom: 15 },
  card: { borderRadius: 20, padding: 20, marginBottom: 20, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderWidth: 1 },
  label: { fontSize: 14, marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  btnPrimary: { borderRadius: 20, padding: 15, alignItems: 'center' },
  btnPrimaryText: { fontWeight: 'bold', fontSize: 16 },
  btnPrimary: { borderRadius: 20, padding: 15, alignItems: 'center' },
  btnPrimaryText: { fontWeight: 'bold', fontSize: 16 }
});
