import TelegramBot from 'node-telegram-bot-api';
declare const router: import("express-serve-static-core").Router;
export declare let bot: TelegramBot | null;
export declare const sendTelegramMessage: (userId: string, message: string) => Promise<void>;
export default router;
//# sourceMappingURL=telegram.d.ts.map