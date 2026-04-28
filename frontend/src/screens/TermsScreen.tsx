import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export const TermsScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 15}}>
           <Text style={{fontSize: 24, fontWeight: 'bold', color: colors.primary}}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Публічна Оферта</Text>
      </View>
      
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Цей документ (далі – «Оферта») є офіційною пропозицією платформи NailsBook Pro (далі – «Сервіс») щодо надання послуг з доступу до функціоналу додатку.
          {'\n\n'}
          <Text style={{fontWeight: 'bold'}}>1. Предмет договору</Text>{'\n'}
          1.1. Сервіс надає Користувачу (Майстру) послуги з використання програмного забезпечення для обліку клієнтів, ведення розкладу та відправки сповіщень на умовах платної підписки (Тариф PRO).
          {'\n\n'}
          <Text style={{fontWeight: 'bold'}}>2. Оплата та Підписка</Text>{'\n'}
          2.1. Доступ до розширеного функціоналу надається після повної передоплати за обраний період (1 місяць). {'\n'}
          2.2. Оплата здійснюється банківською карткою через захищену платіжну систему LiqPay. {'\n'}
          2.3. Гроші, сплачені за підписку, є платою за надання ліцензійного доступу до функціоналу Сервісу.
          {'\n\n'}
          <Text style={{fontWeight: 'bold'}}>3. Політика повернення коштів</Text>{'\n'}
          3.1. Оскільки Сервіс надає доступ до цифрового контенту та програмного забезпечення одразу після оплати, кошти за вже оплачений та активований період підписки <Text style={{fontWeight: 'bold'}}>не повертаються</Text> згідно з чинним законодавством України. {'\n'}
          3.2. Користувач має право скасувати підписку в будь-який момент у налаштуваннях додатку. Після скасування доступ до функціоналу PRO зберігається до кінця оплаченого періоду. {'\n'}
          3.3. Перед оплатою Користувачу надається 14-денний безкоштовний тестовий період (Trial) для повного ознайомлення з функціоналом.
          {'\n\n'}
          <Text style={{fontWeight: 'bold'}}>4. Обмеження відповідальності</Text>{'\n'}
          4.1. Сервіс не несе відповідальності за фінансові розрахунки між Майстром та його клієнтами. {'\n'}
          4.2. Сервіс докладає всіх зусиль для безперебійної роботи додатку, але не гарантує відсутність технічних збоїв, спричинених незалежними від Сервісу обставинами (збої серверів хостингу, операторів зв'язку).
          {'\n\n'}
          <Text style={{fontWeight: 'bold'}}>5. Зміни умов</Text>{'\n'}
          5.1. Сервіс залишає за собою право вносити зміни до даної Оферти. Продовження використання Сервісу після внесення змін означає згоду Користувача з новими умовами.
        </Text>
      </View>
      <View style={{height: 50}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold' },
  card: { padding: 20, borderRadius: 15, borderWidth: 1 },
  text: { fontSize: 14, lineHeight: 22 }
});
