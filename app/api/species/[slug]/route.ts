import { NextResponse } from "next/server";
import { getAlgaBySlug } from "../../../../lib/algae";
import { toSpeciesDetail } from "../../../../lib/llm-api";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const record = await getAlgaBySlug(slug);
  if (!record) {
    return NextResponse.json({ error: "Species not found" }, { status: 404 });
  }
  return NextResponse.json(toSpeciesDetail(record));
}
