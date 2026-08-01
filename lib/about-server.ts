import { readFile } from "fs/promises";
import path from "path";
import type { AboutData } from "./about-types";

export async function getAbout(): Promise<AboutData> {
  const filePath = path.join(process.cwd(), "data", "processed", "about.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as AboutData;
}
