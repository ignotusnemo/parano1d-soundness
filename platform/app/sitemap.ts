import type { MetadataRoute } from "next";
import { derivePlatformState } from "@/lib/derive";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const state = derivePlatformState(process.cwd());
  const lastModified = new Date(state.generatedAt);
  return [
    {
      url: "https://noid.network/",
      lastModified,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: "https://noid.network/submit/",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7
    },
    ...state.records.map((record) => ({
      url: `https://noid.network/submissions/${record.id}/`,
      lastModified: new Date(record.acceptedAt),
      changeFrequency: "yearly" as const,
      priority: 0.6
    }))
  ];
}
