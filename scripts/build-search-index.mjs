import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/@oai+artifact-tool@file+local-deps+-oai-artifact-tool-oai-artifact_tool-2.8.21.tgz/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const inputRoot =
  "/workspace/scratch/1299cfaec36c/work/web_library_input/Dubai_Real_Estate_Knowledge_Base(1)/Dubai_Real_Estate_Knowledge_Base/01_Knowledge_Entry_Batches";
const masterPath =
  "/workspace/scratch/1299cfaec36c/work/web_library_input/New folder(2)/New folder/00_Master_Index/00_Master_Index/Master_Register_V71.xlsx";
const outputPath =
  "/workspace/sites/dubai-real-estate-knowledge-hub/app/knowledge-data.json";

async function walk(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function excelDate(value) {
  if (typeof value !== "number") return value || "";
  const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  return date.toISOString().slice(0, 10);
}

const workbooks = (await walk(inputRoot))
  .filter((file) => /\/Knowledge_Entry_Batch_\d{3}\.xlsx$/.test(file))
  .sort();
const entries = [];

for (const file of workbooks) {
  const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
  for (const sheet of wb.worksheets.items) {
    const values = sheet.getUsedRange()?.values || [];
    if (!values.length || values[0][0] !== "Entry ID") continue;
    const headers = values[0].map(String);
    for (const row of values.slice(1)) {
      if (!row[0]) continue;
      const record = Object.fromEntries(headers.map((header, i) => [header, row[i] ?? ""]));
      entries.push({
        id: record["Entry ID"],
        sectionId: record["Section ID"],
        section: record["Section Title"],
        title: record["Entry Title"],
        priority: record["Priority"],
        status: record["Completion Status"],
        type: record["Knowledge Type"],
        answer: record["Simple Explanation"],
        practical: record["Practical Scope / Real Estate Relevance"],
        authority: record["Primary Authority / Owner"],
        jurisdiction: record["Jurisdiction"],
        use: record["When to Use"],
        sourceIds: String(record["Existing Source IDs"] || "")
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean),
        packages: String(record["Existing Package References"] || "")
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean),
        officialUrl: record["Official URL / Control Channel"],
        english: record["English Source Status"],
        arabic: record["Arabic Source Status"],
        verification: record["Verification Basis"],
        verified: excelDate(record["Last Verified"]),
        review: record["Review Trigger / Frequency"],
        audience: record["Audience"],
        disclaimer: record["Disclaimer / Risk"],
        gap: record["Missing Information / Gap"],
        next: record["Next Action"],
        batch: record["Batch ID"],
      });
    }
  }
}

const unique = [...new Map(entries.map((entry) => [entry.id, entry])).values()].sort((a, b) =>
  a.id.localeCompare(b.id),
);
const sections = [...new Map(unique.map((entry) => [entry.sectionId, entry.section])).entries()]
  .map(([id, title]) => ({ id, title, count: unique.filter((entry) => entry.sectionId === id).length }))
  .sort((a, b) => a.id.localeCompare(b.id));

let sourceCount = 583;
try {
  const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(masterPath));
  sourceCount = Math.max(0, wb.worksheets.getItem("Official Sources").getUsedRange().values.length - 1);
} catch {}

await fs.writeFile(
  outputPath,
  JSON.stringify({
    generated: "2026-07-28",
    checkpoint: "V71",
    coverage: "V52",
    sourceCount,
    entryCount: unique.length,
    sectionCount: sections.length,
    sections,
    entries: unique,
  }),
);
console.log(
  JSON.stringify({
    workbooks: workbooks.length,
    entries: unique.length,
    sections: sections.length,
    sources: sourceCount,
  }),
);
