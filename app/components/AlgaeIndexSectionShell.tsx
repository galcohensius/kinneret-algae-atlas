import { getAlgaeCatalogRecords } from "../../lib/algae";
import AlgaeIndexSection from "./AlgaeIndexSection";

export default async function AlgaeIndexSectionShell() {
  const records = await getAlgaeCatalogRecords();
  return <AlgaeIndexSection records={records} />;
}
