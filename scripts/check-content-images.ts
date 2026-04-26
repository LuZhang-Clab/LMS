import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, titleEn: true, imageFolder: true, contentZh: true, contentEn: true },
  });

  for (const p of projects) {
    const contentZh = p.contentZh ? JSON.parse(p.contentZh) : [];
    const images = contentZh
      .filter((b: any) => b.type === "images" && b.files)
      .flatMap((b: any) => b.files);

    if (images.length > 0) {
      console.log(`\n[${p.id}] ${p.titleEn} (folder: "${p.imageFolder}")`);
      console.log(`  images: ${JSON.stringify(images)}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
