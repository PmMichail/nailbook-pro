const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const items = await prisma.galleryItem.findMany();
    console.log("Total gallery items:", items.length);
    items.forEach(i => console.log(i));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
