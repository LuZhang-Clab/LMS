/**
 * migrate-to-html.ts
 *
 * ONE-TIME MIGRATION: converts all ContentBlock[] JSON stored in the DB
 * to HTML strings, so the entire codebase can drop all conversion logic
 * and work with plain HTML end-to-end.
 *
 * Run: npx tsx scripts/migrate-to-html.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ─── ContentBlock[] → HTML ───────────────────────────────────────────────────

type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "images"; files: string[] }
  | { type: "link"; text: string; url: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentBlocksToHtml(blocks: ContentBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h3>${escapeHtml(block.text ?? "")}</h3>`;
        case "text":
          return `<p>${(block.text ?? "").split("\n").map(escapeHtml).join("<br>")}</p>`;
        case "images": {
          const files = block.files ?? [];
          if (files.length === 0) return "";
          return files.map((f) => `<p><img src="${escapeHtml(f)}" alt="" /></p>`).join("");
        }
        case "link":
          return `<p><a href="${escapeHtml(block.url ?? "")}">${escapeHtml(block.text ?? "")}</a></p>`;
        default:
          return "";
      }
    })
    .join("");
}

function isContentBlockJson(value: string): boolean {
  if (!value || !value.trim()) return false;
  try {
    const parsed = JSON.parse(value.trim());
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

function migrateContent(raw: string | null): string {
  if (!raw || !raw.trim()) return "";
  if (isContentBlockJson(raw)) {
    try {
      const blocks: ContentBlock[] = JSON.parse(raw.trim());
      return contentBlocksToHtml(blocks);
    } catch {
      return raw; // fallback to existing
    }
  }
  return raw; // already HTML
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting migration: ContentBlock[] JSON → HTML\n");

  // Projects
  const projects = await prisma.project.findMany();
  let projectsUpdated = 0;
  for (const p of projects) {
    const migratedZh = migrateContent(p.contentZh);
    const migratedEn = migrateContent(p.contentEn);
    if (migratedZh !== p.contentZh || migratedEn !== p.contentEn) {
      await prisma.project.update({
        where: { id: p.id },
        data: { contentZh: migratedZh, contentEn: migratedEn },
      });
      projectsUpdated++;
    }
  }
  console.log(`  Projects: ${projectsUpdated} updated (total ${projects.length})`);

  // WorkExperience
  const work = await prisma.workExperience.findMany();
  let workUpdated = 0;
  for (const w of work) {
    const migratedZh = migrateContent(w.contentZh);
    const migratedEn = migrateContent(w.contentEn);
    if (migratedZh !== w.contentZh || migratedEn !== w.contentEn) {
      await prisma.workExperience.update({
        where: { id: w.id },
        data: { contentZh: migratedZh, contentEn: migratedEn },
      });
      workUpdated++;
    }
  }
  console.log(`  WorkExperience: ${workUpdated} updated (total ${work.length})`);

  // Verify: confirm no JSON content remains
  const remainingProjects = await prisma.project.findMany({
    where: {
      OR: [
        { contentZh: { not: "" } },
        { contentEn: { not: "" } },
      ],
    },
  });

  const stillJson: string[] = [];
  for (const p of remainingProjects) {
    if (isContentBlockJson(p.contentZh) || isContentBlockJson(p.contentEn)) {
      stillJson.push(p.id);
    }
  }

  if (stillJson.length > 0) {
    console.log(`\n⚠  WARNING: ${stillJson.length} projects still have JSON content: ${stillJson.join(", ")}`);
  } else {
    console.log("\n✓ Migration complete. No ContentBlock JSON remaining in DB.");
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
