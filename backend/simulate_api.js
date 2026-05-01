const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const masterId = '23c522f1-c642-46dd-a8fc-7b006a367066';
    const items = await prisma.galleryItem.findMany({
        where: { masterId: masterId },
        orderBy: { createdAt: 'desc' }
    });

    const sub = await prisma.subscription.findUnique({ where: { masterId: masterId } });
    const isFree = !sub || sub.plan === 'FREE' || ['EXPIRED', 'CANCELLED'].includes(sub.status);

    const formatted = items.map((i, index) => ({
        ...i,
        isLocked: isFree && index >= 5, 
        imageUrl: i.imageUrl.startsWith('http') 
            ? i.imageUrl.replace(/^http:\/\//i, 'https://')
            : `https://localhost:3000/${i.imageUrl}`
    }));

    console.log("Returned for Master Portfolio:", formatted);
}
main().finally(() => prisma.$disconnect());
