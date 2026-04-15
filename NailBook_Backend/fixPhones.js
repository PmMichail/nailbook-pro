const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatPhoneNumber = (text) => {
  let cleaned = text.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    cleaned = '+38' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
};

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const formatted = formatPhoneNumber(user.phone);
    if (formatted !== user.phone) {
      console.log(`Updating ${user.phone} -> ${formatted}`);
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: formatted }
        });
      } catch (e) {
        console.error(e.message);
      }
    }
  }
  console.log('Done cleaning phones');
}
main();
