import type { MetadataRoute } from "next";
import { getAllAlgae } from "../lib/algae";
import { getAllSupplements } from "../lib/supplements";
import { absoluteUrl } from "../lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [algae, supplements] = await Promise.all([getAllAlgae(), getAllSupplements()]);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/about/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/glossary/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/supplements/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const speciesPages: MetadataRoute.Sitemap = algae.map((record) => ({
    url: absoluteUrl(`/algae/${record.slug}/`),
    lastModified: record.recordUpdated
      ? new Date(record.recordUpdated)
      : now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const supplementPages: MetadataRoute.Sitemap = supplements.map((supplement) => ({
    url: absoluteUrl(`/supplements/${supplement.slug}/`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...speciesPages, ...supplementPages];
}
