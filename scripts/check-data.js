const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const cats = await prisma.category.findMany({ include: { projects: true } });
  const about = await prisma.about.findFirst();
  const work = await prisma.workExperience.findMany();
  const services = await prisma.service.findMany();
  const links = await prisma.link.findMany();

  console.log('=== CATEGORIES (' + cats.length + ') ===');
  cats.forEach(c => console.log('  ' + c.nameZh + ' (' + c.projects.length + ' projects)'));
  console.log('=== ABOUT === ' + about.nameZh);
  console.log('=== WORK (' + work.length + ') ===');
  work.forEach(w => console.log('  ' + w.titleZh + ' | ' + w.period));
  console.log('=== SERVICES (' + services.length + ') ===');
  services.forEach(s => console.log('  ' + s.titleZh));
  console.log('=== LINKS (' + links.length + ') ===');
  links.forEach(l => console.log('  ' + l.platform + ': ' + l.url));
  console.log('=== PROJECT COVERS SAMPLE ===');
  cats.forEach(c => c.projects.slice(0,2).forEach(p => console.log('  ' + p.titleZh + ' -> ' + p.cover)));
  await prisma.$disconnect();
}

check().catch(console.error);
