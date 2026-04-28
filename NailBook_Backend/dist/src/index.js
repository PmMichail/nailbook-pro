"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.error("\n\n==========================================\nNAILBOOK PRO BACKEND STARTING!\n==========================================\n\n");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const master_1 = __importDefault(require("./routes/master"));
const client_1 = __importDefault(require("./routes/client"));
const chats_1 = __importDefault(require("./routes/chats"));
const upload_1 = __importDefault(require("./routes/upload"));
const gallery_1 = __importDefault(require("./routes/gallery"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const payment_1 = __importDefault(require("./routes/payment"));
const telegram_1 = __importDefault(require("./routes/telegram"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const statistics_1 = __importDefault(require("./routes/statistics"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const admin_1 = __importDefault(require("./routes/admin"));
const http_1 = require("http");
const index_1 = require("./socket/index");
const path_1 = __importDefault(require("path"));
const prismaClient_1 = __importDefault(require("./models/prismaClient"));
const telegram_2 = require("./services/telegram");
const firebase_1 = require("./services/firebase");
dotenv_1.default.config();
const user_1 = __importDefault(require("./routes/user"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/master', master_1.default);
app.use('/api/client', client_1.default);
app.use('/api/chats', chats_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/gallery', gallery_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/master/payment', payment_1.default);
app.use('/api/telegram', telegram_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/calendar', calendar_1.default);
app.use('/api/master/statistics', statistics_1.default);
app.use('/api/master/subscription', subscription_1.default);
app.use('/api/webhooks', webhooks_1.default);
app.use('/api/admin', admin_1.default);
app.get('/api/version', (req, res) => res.json({ version: "V_NEW_999" }));
const server = (0, http_1.createServer)(app);
(0, index_1.initSocket)(server);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Auto-cancellation worker for unpaid prepayments
setInterval(async () => {
    try {
        const expiredApps = await prismaClient_1.default.appointment.findMany({
            where: {
                status: 'AWAITING_PREPAYMENT',
                prepaymentDeadline: { lt: new Date() }
            },
            include: {
                client: { include: { pushToken: true } },
                master: { include: { pushToken: true } }
            }
        });
        for (const app of expiredApps) {
            // Маркуємо як CANCELLED
            await prismaClient_1.default.appointment.update({
                where: { id: app.id },
                data: { status: 'CANCELLED' }
            });
            const cancelMsg = `Ваш запис на ${app.date.toISOString().split('T')[0]} о ${app.time} автоматично скасовано через відсутність передоплати.`;
            const masterMsg = `Запис клієнта ${app.client?.name || ''} на ${app.date.toISOString().split('T')[0]} о ${app.time} автоматично скасовано (час на передоплату вийшов).`;
            // Повідомлення клієнту
            (0, telegram_2.sendTelegramMessage)(app.clientId, cancelMsg);
            if (app.client?.pushToken?.token) {
                await (0, firebase_1.sendPushNotification)(app.client.pushToken.token, 'Запис скасовано', cancelMsg);
            }
            const clientSocket = (0, index_1.getSocketId)(app.clientId);
            if (clientSocket)
                (0, index_1.getIo)().to(clientSocket).emit('appointment_cancelled_auto', { id: app.id });
            // Повідомлення майстру
            (0, telegram_2.sendTelegramMessage)(app.masterId, masterMsg);
            if (app.master?.pushToken?.token) {
                await (0, firebase_1.sendPushNotification)(app.master.pushToken.token, 'Запис скасовано', masterMsg);
            }
            const masterSocket = (0, index_1.getSocketId)(app.masterId);
            if (masterSocket)
                (0, index_1.getIo)().to(masterSocket).emit('appointment_cancelled_auto', { id: app.id });
        }
    }
    catch (err) {
        console.error('Error in prepayment expiration worker:', err);
    }
}, 5 * 60 * 1000); // Check every 5 minutes
//# sourceMappingURL=index.js.map