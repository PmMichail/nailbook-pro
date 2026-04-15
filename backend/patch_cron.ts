import fs from 'fs';

let content = fs.readFileSync('src/services/cron.ts', 'utf8');

if (!content.includes('import { sendTelegramMessage }')) {
  // Add import
  content = content.replace("import { sendPushNotification } from './firebase';", "import { sendPushNotification } from './firebase';\nimport { sendTelegramMessage } from './telegram';");
  
  // Replace 24h push
  content = content.replace(
      "await sendPushNotification(app.client.pushToken.token, 'Нагадування про запис', `Ваш запис до майстра ${app.master.name} завтра о ${app.time}`);",
      "await sendPushNotification(app.client.pushToken.token, 'Нагадування про запис', `Ваш запис до майстра ${app.master.name} завтра о ${app.time}`);\n             } else {\n                 await sendTelegramMessage(app.clientId, `⏳ Нагадування: Ваш запис до майстра ${app.master.name} завтра о ${app.time}`);"
  );
  content = content.replace(
      "await sendPushNotification(app.master.pushToken.token, 'Нагадування про клієнта', `У вас запис завтра о ${app.time} (клієнт: ${app.client.name})`);",
      "await sendPushNotification(app.master.pushToken.token, 'Нагадування про клієнта', `У вас запис завтра о ${app.time} (клієнт: ${app.client.name})`);\n             } else {\n                 await sendTelegramMessage(app.masterId, `⏳ Нагадування: У вас запис завтра о ${app.time} (клієнт: ${app.client.name})`);"
  );
  
  // Replace 2h push
  content = content.replace(
      "await sendPushNotification(app.client.pushToken.token, 'Скоро Ваш запис!', `Чекаємо на Вас сьогодні о ${app.time}.`);",
      "await sendPushNotification(app.client.pushToken.token, 'Скоро Ваш запис!', `Чекаємо на Вас сьогодні о ${app.time}.`);\n             } else {\n                 await sendTelegramMessage(app.clientId, `⚠️ Скоро Ваш запис! Чекаємо на Вас сьогодні о ${app.time}.`);"
  );
  content = content.replace(
      "await sendPushNotification(app.master.pushToken.token, 'Наступний клієнт!', `Запис сьогодні о ${app.time} (клієнт: ${app.client.name})`);",
      "await sendPushNotification(app.master.pushToken.token, 'Наступний клієнт!', `Запис сьогодні о ${app.time} (клієнт: ${app.client.name})`);\n             } else {\n                 await sendTelegramMessage(app.masterId, `⚠️ Наступний клієнт! Запис сьогодні о ${app.time} (клієнт: ${app.client.name})`);"
  );

  fs.writeFileSync('src/services/cron.ts', content);
  console.log('patched cron');
}
