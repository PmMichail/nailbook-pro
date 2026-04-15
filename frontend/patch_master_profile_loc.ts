import fs from 'fs';

let content = fs.readFileSync('src/screens/MasterProfileScreen.tsx', 'utf8');

if (!content.includes('import * as Location')) {
    content = content.replace(
        "import * as ImagePicker from 'expo-image-picker';",
        "import * as ImagePicker from 'expo-image-picker';\nimport * as Location from 'expo-location';"
    );
}

if (!content.includes('handleFixLocation')) {
    const handleLogoutCode = `
  const handleFixLocation = async () => {
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
  };

  const handleLogout`;
    content = content.replace("  const handleLogout", handleLogoutCode);
}

if (!content.includes('📍 Зафіксувати геолокацію салону')) {
    const btnCode = `
        <View style={[styles.settingRow, { backgroundColor: colors.card, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={[styles.settingText, { color: colors.text, fontWeight: 'bold' }]}>Геолокація салону</Text>
          <Text style={{color: colors.textSecondary, marginBottom: 10, marginTop: 5, fontSize: 13}}>Дозвольте новим клієнтам поблизу знаходити вас на карті.</Text>
          <TouchableOpacity 
             style={[styles.saveBtn, {backgroundColor: '#ff9900', width: '100%'}]}
             onPress={handleFixLocation}
          >
             <Text style={styles.saveBtnText}>📍 Зафіксувати геолокацію салону</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
`;
    content = content.replace(
        "        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>",
        btnCode
    );
}

fs.writeFileSync('src/screens/MasterProfileScreen.tsx', content);
console.log("Patched MasterProfileScreen with Location button");
