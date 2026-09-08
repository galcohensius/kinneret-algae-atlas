import { getAlgaeCatalogRecords, getAllAlgae } from "../../lib/algae";
import { buildVisualIndexSections } from "../../lib/visual-index-layout";
import AlgaeIndexSection from "./AlgaeIndexSection";

export default async function AlgaeIndexSectionShell() {
  const [records, allRecords] = await Promise.all([getAlgaeCatalogRecords(), getAllAlgae()]);
  return (
    <AlgaeIndexSection records={records} visualSections={buildVisualIndexSections(allRecords)} />
  );
}
