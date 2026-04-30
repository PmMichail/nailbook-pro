const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const galleries = await prisma.galleryItem.findMany();
  let deleted = 0;
  for (const g of galleries) {
    if (!g.imageUrl || g.imageUrl.trim() === '' || g.imageUrl.includes('placeholder') || !g.imageUrl.startsWith('http')) {
      await prisma.favorite.deleteMany({ where: { galleryId: g.id } });
      await prisma.like.deleteMany({ where: { galleryId: g.id } });
      await prisma.galleryItem.delete({ where: { id: g.id } });
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} test/broken images globally`);
}
main();
