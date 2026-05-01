const fs = require('fs');
const path = 'src/navigation/Navigator.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import { AdminClientsScreen } from '../screens/AdminClientsScreen';", "");
content = content.replace("<Drawer.Screen name=\"AdminClients\" component={AdminClientsScreen} options={{ drawerLabel: 'Клієнти' }} />", "");

fs.writeFileSync(path, content, 'utf8');
console.log("Updated Navigator.tsx");
