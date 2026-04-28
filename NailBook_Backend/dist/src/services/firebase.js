"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const admin = __importStar(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const serviceAccountPath = path_1.default.resolve(__dirname, '../../firebase-service-account.json');
if (fs_1.default.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
}
else {
    console.warn('Firebase service account not found at: ', serviceAccountPath);
}
const expo = new expo_server_sdk_1.Expo();
const sendPushNotification = async (token, title, body, data = {}) => {
    console.log('[PUSH SEND] Token:', token);
    console.log('[PUSH SEND] Title:', title);
    console.log('[PUSH SEND] Body:', body);
    if (!token)
        return false;
    // Handle Expo Push Tokens gracefully
    if (token.startsWith('ExponentPushToken[') || expo_server_sdk_1.Expo.isExpoPushToken(token)) {
        try {
            const receipts = await expo.sendPushNotificationsAsync([{
                    to: token,
                    sound: 'default',
                    title,
                    body,
                    data
                }]);
            console.log('[PUSH SEND] Expo Success:', receipts);
            return true;
        }
        catch (e) {
            console.error('[PUSH SEND] Expo Error:', e);
            return false;
        }
    }
    // Handle Raw FCM Tokens
    if (!admin.apps.length)
        return false;
    const stringifiedData = {};
    for (const k in data) {
        stringifiedData[k] = String(data[k]);
    }
    try {
        const message = {
            notification: { title, body },
            data: stringifiedData,
            token: token,
        };
        const response = await admin.messaging().send(message);
        console.log('[PUSH DEBUG] FCM Success:', response);
        return true;
    }
    catch (error) {
        console.error('[PUSH DEBUG] FCM Error:', error);
        return false;
    }
};
exports.sendPushNotification = sendPushNotification;
//# sourceMappingURL=firebase.js.map