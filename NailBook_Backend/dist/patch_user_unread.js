"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
let content = fs_1.default.readFileSync('src/routes/user.ts', 'utf8');
const unreadEndpoint = `
// GET /api/user/unread-count
router.get('/unread-count', async (req: any, res) => {
  try {
    const userId = req.user.id;
    // Count unread messages in all chats where user is a participant and not the sender
    const unreadMessages = await prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        chat: {
          OR: [
            { masterId: userId },
            { clientId: userId }
          ]
        }
      }
    });

    // We can also count pending appointments if they are a master
    let pendingAppointments = 0;
    if (req.user.role === 'MASTER') {
       pendingAppointments = await prisma.appointment.count({
         where: { masterId: userId, status: 'PENDING' }
       });
    }

    res.json({ count: unreadMessages + pendingAppointments });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});
`;
content = content.replace('export default router;', unreadEndpoint + '\nexport default router;');
fs_1.default.writeFileSync('src/routes/user.ts', content);
console.log('patched user');
//# sourceMappingURL=patch_user_unread.js.map