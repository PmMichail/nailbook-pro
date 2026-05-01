const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const newItem = await prisma.galleryItem.create({
            data: {
                masterId: '23c522f1-c642-46dd-a8fc-7b006a367066',
                imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
                tags: [],
                isPublic: false
            }
        });
        console.log("Created successfully:", newItem);
    } catch(e) {
        console.error("Error creating item:", e);
    }
}
main().finally(() => prisma.$disconnect());
