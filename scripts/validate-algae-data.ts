import { validateAlgaeDataFile } from "../lib/algae";

async function main() {
  const result = await validateAlgaeDataFile();
  console.log(`Validated algae data file successfully (${result.count} records).`);
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
