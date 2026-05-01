const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const master = await prisma.user.findUnique({
        where: { id: '23c522f1-c642-46dd-a8fc-7b006a367066' },
        include: { subscription: true }
    });
    console.log(master);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
