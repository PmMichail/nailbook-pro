export declare const sendTelegramMessage: (userId: string, message: string) => Promise<boolean>;
export declare const sendTelegramNotification: (chatId: string, message: string) => Promise<boolean>;
export declare const sendAppointmentNotification: (userId: string, appointment: any, type: "created" | "confirmed" | "cancelled") => Promise<boolean>;
//# sourceMappingURL=telegram.d.ts.map