import { getAllAlgae } from "../../lib/algae";
import AlgaeIndexSection from "./AlgaeIndexSection";

export default async function AlgaeIndexSectionShell() {
  const records = await getAllAlgae();
  return <AlgaeIndexSection records={records} />;
}
