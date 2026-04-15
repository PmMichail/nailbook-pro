import fs from 'fs';

let content = fs.readFileSync('app.json', 'utf8');
const data = JSON.parse(content);

// Add location plugin with proper description
data.expo.plugins.push([
    "expo-location",
    {
        "locationAlwaysAndWhenInUsePermission": "NailBook Pro потребує вашу геолокацію для того, щоб показати найкращих майстрів навколо вас у радіусі 20 км.",
        "locationAlwaysPermission": "NailBook Pro потребує вашу геолокацію для показу майстрів поблизу.",
        "locationWhenInUsePermission": "NailBook Pro потребує доступ до геолокації, щоб показувати салони та майстрів, які знаходяться найближче до вас."
    }
]);

// Also add NSLocationWhenInUseUsageDescription to infoPlist just in case
if (!data.expo.ios.infoPlist) {
    data.expo.ios.infoPlist = {};
}
data.expo.ios.infoPlist.NSLocationWhenInUseUsageDescription = "NailBook Pro потребує доступ до геолокації, щоб показувати салони та майстрів, які знаходяться найближче до вас.";
data.expo.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription = "NailBook Pro потребує вашу геолокацію для того, щоб показати найкращих майстрів навколо вас у радіусі 20 км.";

fs.writeFileSync('app.json', JSON.stringify(data, null, 2));
console.log('patched app.json');
