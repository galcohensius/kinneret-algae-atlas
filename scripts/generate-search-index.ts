import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildAlgaeSearchIndex } from "../lib/algae-search-index";
import { getAllAlgae } from "../lib/algae";

async function main(): Promise<void> {
  const records = await getAllAlgae();
  const entries = buildAlgaeSearchIndex(records);
  const payload = { count: entries.length, entries };
  const outDir = path.join(process.cwd(), "public", "api");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "search-index.json");
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outPath} (${entries.length} entries)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
