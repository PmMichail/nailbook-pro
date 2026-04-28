"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("./src/services/firebase");
const prismaClient_1 = __importDefault(require("./src/models/prismaClient"));
async function run() {
    console.log("Testing Push Notification");
    const t = await prismaClient_1.default.pushToken.findFirst({
        where: { token: { startsWith: 'ExponentPushToken' } }
    });
    if (t) {
        console.log("Found Expo push token data in DB:", t);
        await (0, firebase_1.sendPushNotification)(t.token, 'Тест Пуш!', 'Це тестове повідомлення з консолі.');
    }
    else {
        console.log("No Expo push tokens in the DB right now. Did you login from Expo?");
    }
    process.exit(0);
}
run();
//# sourceMappingURL=test-push.js.map