import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, titleEn: true, cover: true, imageFolder: true, images: true },
  });

  for (const p of projects) {
    console.log(`\n[${p.id}] ${p.titleEn}`);
    console.log(`  cover: "${p.cover}"`);
    console.log(`  imageFolder: "${p.imageFolder}"`);
    console.log(`  images: "${p.images}"`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
