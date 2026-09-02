import { getAlgaeIndexRecords } from "../../lib/algae";
import AlgaeIndexSection from "./AlgaeIndexSection";

export default async function AlgaeIndexSectionShell() {
  const records = await getAlgaeIndexRecords();
  return <AlgaeIndexSection records={records} />;
}
