import { NextResponse } from "next/server";
import { getAllAlgae } from "../../../lib/algae";
import { toSpeciesIndexItem } from "../../../lib/llm-api";

export async function GET() {
  const records = await getAllAlgae();
  const species = records.map(toSpeciesIndexItem);
  return NextResponse.json({
    count: species.length,
    species,
  });
}
