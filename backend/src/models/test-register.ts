import prisma from './prismaClient';
import bcrypt from 'bcrypt';

async function testRegister() {
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: 'test_script',
        phone: '+380990000000',
        password: hashedPassword,
        role: 'CLIENT',
        isActiveClient: true
      }
    });
    console.log('Successfully created:', user.id);
    await prisma.user.delete({ where: { id: user.id } });
  } catch (err) {
    console.error('Registration error:', err);
  }
}

testRegister();
