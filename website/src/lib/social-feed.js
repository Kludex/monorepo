import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

/**
 * Per-network feed whose item bodies are committed social copy, merged from two
 * sources: blog posts with a `social:` frontmatter block (copy + post URL) and
 * standalone entries in src/content/social/ (copy only). Future-dated entries
 * are held back until a build on/after their date — the daily scheduled deploy
 * publishes them without a merge.
 */
export async function socialFeed(context, network) {
  const now = Date.now();

  const posts = (await getCollection("blog"))
    .filter((post) => post.data.social?.[network])
    .map((post) => ({
      title: post.data.title,
      date: post.data.date,
      link: `/blog/${post.id}`,
      copy: `${post.data.social[network].trim()}\n\n${new URL(`/blog/${post.id}`, context.site).href}`,
    }));

  const standalone = (await getCollection("social"))
    .filter((entry) => entry.data[network])
    .map((entry) => ({
      title: entry.id,
      date: entry.data.date,
      // guid only — nothing to read on the site; resolves to the homepage
      link: `/#${entry.id}`,
      copy: entry.data[network].trim(),
    }));

  const items = [...posts, ...standalone]
    .filter((item) => item.date.valueOf() <= now)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return rss({
    title: `marcelotryle.com — ${network} announcements`,
    description: `Committed ${network} copy. Consumed by the social automation; not meant for readers.`,
    site: context.site,
    trailingSlash: false,
    items: items.map((item) => ({
      title: item.title,
      pubDate: item.date,
      link: item.link,
      description: item.copy,
    })),
  });
}
