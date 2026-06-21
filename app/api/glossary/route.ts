import { NextResponse } from "next/server";
import { getGlossary } from "../../../lib/glossary-server";
import { toGlossaryApi } from "../../../lib/llm-api";

export async function GET() {
  const index = await getGlossary();
  return NextResponse.json(toGlossaryApi(index.data));
}
