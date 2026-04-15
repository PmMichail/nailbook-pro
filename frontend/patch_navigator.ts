import fs from 'fs';

let content = fs.readFileSync('src/navigation/Navigator.tsx', 'utf8');

// Add SearchMasters to ClientProfileStack
content = content.replace("import { MastersListScreen } from '../screens/MastersListScreen';", "import { MastersListScreen } from '../screens/MastersListScreen';\nimport { SearchMastersScreen } from '../screens/SearchMastersScreen';");

content = content.replace("<Stack.Screen name=\"Favorites\" component={FavoritesScreen} options={{ headerShown: true, title: 'Обрані дизайни', headerTintColor: '#FF69B4' }} />", "<Stack.Screen name=\"Favorites\" component={FavoritesScreen} options={{ headerShown: true, title: 'Обрані дизайни', headerTintColor: '#FF69B4' }} />\n    <Stack.Screen name=\"SearchMastersScreen\" component={SearchMastersScreen} options={{ headerShown: true, title: 'Пошук майстрів', headerTintColor: '#FF69B4' }} />");

// Add GlobalHeader to ClientTabs
content = content.replace("export const ClientTabs = () => {\n  return (\n    <Tab.Navigator", "export const ClientTabs = () => {\n  return (\n    <>\n    <GlobalHeader />\n    <Tab.Navigator");

content = content.replace("</Tab.Navigator>\n  );\n};", "</Tab.Navigator>\n    </>\n  );\n};");

fs.writeFileSync('src/navigation/Navigator.tsx', content);
console.log('patched navigator');
