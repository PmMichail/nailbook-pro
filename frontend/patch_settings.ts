import fs from 'fs';

let content = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

// Add expo-location import
content = content.replace("import { useNavigation } from '@react-navigation/native';", "import { useNavigation } from '@react-navigation/native';\nimport * as Location from 'expo-location';\nimport api from '../api/client';");

// Add handleFixLocation function
const locationFn = `  const handleFixLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Помилка', 'Доступ до геоданих відхилено');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      await api.put('/api/master/salon-info', {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      Alert.alert('Готово', 'Ваша геолокація успішно збережена!');
    } catch(e) {
      Alert.alert('Помилка', 'Не вдалося визначити геолокацію');
    }
  };`;

content = content.replace('  const handleCalendarConnect = () => {', locationFn + '\n\n  const handleCalendarConnect = () => {');

// Add UI button in Account section
const locationBtn = `
        <TouchableOpacity style={styles.menuItem} onPress={handleFixLocation}>
          <Text style={styles.menuText}>📍 Зафіксувати мою геолокацію</Text>
        </TouchableOpacity>
`;

content = content.replace('<Text style={styles.sectionTitle}>Акаунт & Інтеграції</Text>', '<Text style={styles.sectionTitle}>Акаунт & Інтеграції</Text>' + locationBtn);

fs.writeFileSync('src/screens/SettingsScreen.tsx', content);
console.log('patched settings');
