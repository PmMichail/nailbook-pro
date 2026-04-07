const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB DEBUG SCRIPT ===");
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true, phone: true } });
  console.log(`Users total: ${users.length}`);
  // console.log("Users:", users);

  const appointments = await prisma.appointment.findMany({
    include: { client: { select: { name: true } }, master: { select: { name: true } } }
  });
  console.log(`Appointments total: ${appointments.length}`);
  console.log("Appointments:", JSON.stringify(appointments, null, 2));

  const chats = await prisma.chat.findMany({ include: { messages: true } });
  console.log(`Chats total: ${chats.length}`);
  console.log("Chats:", JSON.stringify(chats, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
