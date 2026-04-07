import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@nailbook.pro';
    const existing = await prisma.user.findFirst({ where: { email } });
    
    if (existing) {
        console.log('Admin already exists.');
        return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
        data: {
            name: 'NailBook Admin',
            email,
            password: hashedPassword,
            role: 'ADMIN' // Type-checked by Prisma
        }
    });

    console.log('Admin created successfully:', admin.id);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
