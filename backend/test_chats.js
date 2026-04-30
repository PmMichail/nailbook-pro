const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const masterId = '031a1e76-1921-442e-ba7d-955ee2e87b18';
  const chats = await prisma.chat.findMany({ 
    where: { roomId: { contains: masterId } },
    include: { messages: true }
  });
  for (const c of chats) {
    console.log("Room:", c.roomId, "Messages:", c.messages.length);
  }
}
main();
