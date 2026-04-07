const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backup() {
  console.log('Початок бекапу бази даних...');
  try {
    const backupData = {
      users: await prisma.user.findMany(),
      appointments: await prisma.appointment.findMany(),
      services: await prisma.service.findMany(),
      galleries: await prisma.gallery.findMany(),
      settings: await prisma.masterSetting.findMany()
    };
    
    fs.writeFileSync('database_backup.json', JSON.stringify(backupData, null, 2));
    console.log('✅ Бекап успішно збережено у database_backup.json');
  } catch (error) {
    console.error('❌ Помилка бекапу:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
