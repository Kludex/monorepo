import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

/**
 * Per-network feed whose item bodies are the social copy committed in each
 * post's `social:` frontmatter. Posts without copy for the network are
 * excluded, so nothing is auto-posted unless copy was committed.
 */
export async function socialFeed(context, network) {
  const posts = (await getCollection("blog"))
    .filter((post) => post.data.social?.[network])
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: `marcelotryle.com — ${network} announcements`,
    description: `Committed ${network} copy for new blog posts. Consumed by the social automation; not meant for readers.`,
    site: context.site,
    trailingSlash: false,
    items: posts.map((post) => {
      const url = new URL(`/blog/${post.id}`, context.site).href;
      return {
        title: post.data.title,
        pubDate: post.data.date,
        link: `/blog/${post.id}`,
        description: `${post.data.social[network].trim()}\n\n${url}`,
      };
    }),
  });
}
