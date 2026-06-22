import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { generateSitemapEntries } from "@/lib/domain-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, banks, cards, offers] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }
    }),
    prisma.bank.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }
    }),
    prisma.card.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }
    }),
    prisma.offer.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true }
    })
  ]);

  const entries = generateSitemapEntries(categories, banks, cards, offers);

  return entries.map((entry) => ({
    url: entry.loc,
    lastModified: entry.lastmod,
    priority: entry.priority,
    changeFrequency: entry.changefreq
  }));
}
