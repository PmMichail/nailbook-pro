import fs from 'fs';

let content = fs.readFileSync('src/components/GlobalHeader.tsx', 'utf8');

content = content.replace("import api from '../api/client';", "import api from '../api/client';\nimport { useUnread } from '../context/UnreadContext';");

content = content.replace("const navigation = useNavigation();", "const navigation = useNavigation();\n  const { unreadCount } = useUnread();");

const uiReplace = `
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
`;

content = content.replace("<Text style={styles.title}>{salonName}</Text>", uiReplace);

fs.writeFileSync('src/components/GlobalHeader.tsx', content);
console.log('patched header');
