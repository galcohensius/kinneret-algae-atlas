import type { MetadataRoute } from "next";
import { getAllAlgae } from "../lib/algae";

const BASE = "https://kinneret-algae-atlas.org";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const algae = await getAllAlgae();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/about/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/glossary/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/visual-index/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE}/supplements/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const speciesPages: MetadataRoute.Sitemap = algae.map((record) => ({
    url: `${BASE}/algae/${record.slug}/`,
    lastModified: record.recordUpdated
      ? new Date(record.recordUpdated)
      : now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...speciesPages];
}
