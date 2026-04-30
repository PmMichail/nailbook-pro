const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  const masterId = '031a1e76-1921-442e-ba7d-955ee2e87b18';
  const token = jwt.sign({ id: masterId, role: 'MASTER' }, process.env.JWT_SECRET || 'secret123');
  
  const req = { user: { id: masterId, role: 'MASTER' } };
  
  const userAppointments = await prisma.appointment.findMany({
      where: { OR: [{ masterId: req.user.id }, { clientId: req.user.id }] },
      select: { id: true }
  });
  const appointmentIds = userAppointments.map(a => a.id);

  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        { roomId: { contains: req.user.id } },
        { roomId: { in: appointmentIds } },
        { messages: { some: { senderId: req.user.id } } }
      ]
    },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });

  const enrichedChats = await Promise.all(chats.map(async (chat) => {
    let otherUser = null;
    if (chat.roomId && chat.roomId.includes('_')) {
       const ids = chat.roomId.split('_');
       const otherId = ids.find(id => id !== req.user.id);
       if (otherId) {
          otherUser = await prisma.user.findUnique({
             where: { id: otherId },
             select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true }
          });
       }
    } else if (chat.roomId && chat.roomId.startsWith('direct-')) {
       const stripped = chat.roomId.replace('direct-', '');
       let otherId = null;
       if (stripped.includes(req.user.id)) {
           otherId = stripped.replace(req.user.id, '').replace(/^-|-$/g, '');
       }
       if (otherId && otherId !== 'null' && otherId.length > 5) {
           otherUser = await prisma.user.findUnique({
               where: { id: otherId },
               select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true }
           });
       }
    }

    return {
      id: chat.id,
      roomId: chat.roomId,
      lastMessage: chat.messages[0]?.text || '',
      updatedAt: chat.updatedAt,
      otherUser: otherUser || { name: 'Невідомий користувач' }
    };
  }));

  console.log(JSON.stringify(enrichedChats, null, 2));
}
main();
