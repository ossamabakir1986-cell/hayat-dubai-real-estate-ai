import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const sourceRoot = process.argv[2];
const outputFile = process.argv[3];
if (!sourceRoot || !outputFile) throw new Error("Usage: build-document-corpus <source-root> <output-file>");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const full = path.join(dir, item.name);
    return item.isDirectory() ? walk(full) : [full];
  });
}

const factualPattern = /\b(article|fee|fees|required|requirements|document|documents|step|steps|within|days?|months?|years?|percent|percentage|aed|dirham|commission|notice|valid|validity|shall|must|may not|eligible|eligibility|register|registration|certificate|contract|agreement|form|penalty|fine)\b|%|\d/iu;

const documents = [];
for (const pdf of walk(sourceRoot).filter((file) => file.toLowerCase().endsWith(".pdf"))) {
  const normalizedPath = pdf.replaceAll("\\", "/");
  if (/Numbering_Reference|Archived_Replaced|06_Index_Notes/i.test(normalizedPath)) continue;
  const filename = path.basename(pdf, ".pdf");
  const sourceId = filename.match(/SRC-[A-Z0-9]+-[A-Z0-9]+-\d{4}/)?.[0] || filename;
  let raw = "";
  try {
    raw = execFileSync("pdftotext", ["-layout", "-nopgbrk", pdf, "-"], {
      encoding: "utf8",
      maxBuffer: 30 * 1024 * 1024,
    });
  } catch {
    continue;
  }
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 18 && !/^[\W\d_]+$/u.test(line));
  if (!lines.length) continue;
  const selected = [];
  for (const line of lines.slice(0, 80)) selected.push(line);
  for (const line of lines) {
    if (factualPattern.test(line)) selected.push(line);
    if (selected.join("\n").length > 22000) break;
  }
  const text = [...new Set(selected)].join("\n").slice(0, 24000);
  const parts = normalizedPath.split("/");
  const packageFolder = parts.find((part) => /^\d{2}_/.test(part)) || "Official Library";
  documents.push({
    sourceId,
    title: filename
      .replace(/^SRC-[A-Z0-9]+-[A-Z0-9]+-\d{4}_V\d+_(EN|AR|BI)_/i, "")
      .replaceAll("_", " "),
    language: filename.match(/_V\d+_(EN|AR|BI)_/i)?.[1]?.toUpperCase() || "UNSPECIFIED",
    package: packageFolder.replace(/^\d{2}_/, "").replaceAll("_", " "),
    text,
  });
}

documents.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
fs.writeFileSync(outputFile, `${JSON.stringify({ generated: new Date().toISOString(), count: documents.length, documents })}\n`);
console.log(`Indexed ${documents.length} official PDF documents`);
