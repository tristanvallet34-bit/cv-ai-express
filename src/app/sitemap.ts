import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { EXAMPLES } from "@/lib/cv/examples";
import { ARTICLES } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/modeles", "/lettre", "/analyse", "/entretien", "/exemples", "/conseils", "/tarifs", "/faq", "/contact", "/mentions-legales", "/cgv", "/confidentialite"];
  return [
    ...pages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...EXAMPLES.map((e) => ({ url: `${SITE.url}/exemples/${e.slug}`, priority: 0.6 })),
    ...ARTICLES.map((a) => ({ url: `${SITE.url}/conseils/${a.slug}`, priority: 0.6 })),
  ];
}
