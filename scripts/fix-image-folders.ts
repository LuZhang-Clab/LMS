import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map of known folder names (from public/images/projects/)
const KNOWN_FOLDERS = [
  "50days",
  "brand-day",
  "cibaoo",
  "conqueror",
  "film-festival",
  "instaknow",
  "narrative",
  "nature",
  "night-ode",
  "olympic",
  "puzzle",
  "resonance",
  "science-friend",
];

async function main() {
  console.log("Starting imageFolder migration...\n");

  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
  });

  console.log(`Found ${projects.length} projects in database.\n`);

  for (const project of projects) {
    const currentFolder = project.imageFolder || "";

    // If imageFolder is empty, try to find a matching folder
    if (!currentFolder || currentFolder === "projects" || currentFolder === "uploads") {
      // Try to match by project ID (case-insensitive)
      const matched = KNOWN_FOLDERS.find(
        (f) => f.toLowerCase() === project.id.toLowerCase() ||
              f.toLowerCase() === project.titleEn?.toLowerCase().replace(/\s+/g, "-") ||
              f.toLowerCase() === project.titleZh?.toLowerCase().replace(/\s+/g, "-")
      );

      if (matched) {
        await prisma.project.update({
          where: { id: project.id },
          data: { imageFolder: matched },
        });
        console.log(`✅ Updated "${project.titleEn}" (${project.id}): "" → "${matched}"`);
      } else {
        console.log(`⚠️  No match for "${project.titleEn}" (${project.id}), imageFolder: "${currentFolder}"`);
      }
    } else {
      // Verify the folder exists
      if (!KNOWN_FOLDERS.includes(currentFolder)) {
        console.log(`⚠️  Folder "${currentFolder}" for "${project.titleEn}" not found in filesystem`);
      } else {
        console.log(`✅ "${project.titleEn}" already has imageFolder: "${currentFolder}"`);
      }
    }
  }

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
