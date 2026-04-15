import fs from 'fs';

let content = fs.readFileSync('src/screens/ClientAppointmentsScreen.tsx', 'utf8');

const replacement = `<View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <Text style={styles.header}>Мої Записи</Text>
        <TouchableOpacity style={{backgroundColor: '#FF69B4', padding: 10, borderRadius: 10}} onPress={() => navigation.navigate('SearchMastersScreen' as never)}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>🔍 Пошук Майстрів</Text>
        </TouchableOpacity>
      </View>`;

content = content.replace('<Text style={styles.header}>Мої Записи</Text>', replacement);

fs.writeFileSync('src/screens/ClientAppointmentsScreen.tsx', content);
console.log('patched btn');
