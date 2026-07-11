import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

function excerpt(body) {
  const paragraph = body
    .replace(/^:::.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#]/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block.length > 40);
  if (!paragraph) return undefined;
  return paragraph.length > 280 ? `${paragraph.slice(0, 277)}...` : paragraph;
}

export async function GET(context) {
  const posts = (await getCollection("blog")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: "Marcelo Trylesinski",
    description: "Notes from the ASGI trenches — FastAPI, Starlette, Uvicorn, and open source maintenance.",
    site: context.site,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: `/blog/${post.id}`,
      description: excerpt(post.body),
      categories: post.data.categories,
    })),
  });
}
