const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAdiRegistration = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const assetsDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(assetsDir, 'adi-registration.properties'),
        'DS2KDXKRCRKKAAAAAAAAAAAAAAAA'
      );
      console.log('✅ Injected adi-registration.properties into Android assets!');
      return config;
    },
  ]);
};

module.exports = withAdiRegistration;
