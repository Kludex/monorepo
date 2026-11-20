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
- Partners and Supporters on `/sponsors` come from GitHub Sponsors webhooks, received by `functions/sponsors/index.ts` at `POST /sponsors`. It needs a KV namespace bound as `SPONSORS` and the webhook's secret as `GITHUB_WEBHOOK_SECRET`. The webhook also stores each sponsor's name, website and description from their public GitHub profile. `GET /sponsors/logos.svg` (all logos, for READMEs and docs), `GET /sponsors/partners.svg` (Partner logos, for a docs sidebar) and `GET /sponsors/list.json` serve the same list; the shared code is in `src/lib/company-sponsors.ts`, outside `functions/`, so it is not a route.
- Slide decks are served as static HTML from `public/slides/`.
- `public/_redirects` maps the old MkDocs blog URLs to the new ones on Cloudflare Pages.
