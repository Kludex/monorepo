# marcelotryle.com

Astro + Tailwind site, replacing the previous MkDocs Material setup in `docs/`.

```bash
npm install
npm run dev     # local dev server
npm run build   # static build to dist/
```

- Blog posts live in `src/content/blog/` (plain markdown; `:::note` / `:::info` / `:::tip` containers render as callouts).
- Talks are data in `src/data/talks.ts`.
- The YouTube grid is built from the channel RSS feed at build time; the sponsors grid from the GitHub GraphQL API (needs `GH_TOKEN`). Both degrade gracefully when unavailable.
- Slide decks are served as static HTML from `public/slides/`.
- `public/_redirects` maps the old MkDocs blog URLs to the new ones on Cloudflare Pages.
- New posts are auto-shared to LinkedIn and X via the RSS feed (`/rss.xml`) - see [SOCIAL.md](SOCIAL.md).
