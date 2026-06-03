import { validateAlgaeDataFile } from "../lib/algae";
import { validateGlossaryFile } from "../lib/glossary-server";

async function main() {
  const algae = await validateAlgaeDataFile();
  const glossary = await validateGlossaryFile();
  console.log(`Validated algae data file successfully (${algae.count} records).`);
  console.log(`Validated glossary file successfully (${glossary.count} terms).`);
}

main().catch((error: unknown) => {
  console.error("Algae data validation failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
});
