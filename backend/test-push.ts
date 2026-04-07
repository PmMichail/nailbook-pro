import { sendPushNotification } from './src/services/firebase';
import prisma from './src/models/prismaClient';

async function run() {
    console.log("Testing Push Notification");
    const t = await prisma.pushToken.findFirst({
        where: { token: { startsWith: 'ExponentPushToken' } }
    });
    if (t) {
        console.log("Found Expo push token data in DB:", t);
        await sendPushNotification(t.token, 'Тест Пуш!', 'Це тестове повідомлення з консолі.');
    } else {
        console.log("No Expo push tokens in the DB right now. Did you login from Expo?");
    }
    process.exit(0);
}
run();
