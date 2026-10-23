type Context = {
  request: Request;
  env: { CVEDEXD_URL?: string };
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
};

type CveRecord = {
  cveMetadata: { cveId: string; datePublished?: string };
  containers: {
    cna: {
      title?: string;
      descriptions?: { value: string }[];
      affected?: { product?: string }[];
      references?: { url: string }[];
    };
  };
};

const MAX_AGE = 600;

/** Fills `#advisory-list` with the CNA's published CVEs. Any failure serves the static page. */
export async function onRequestGet({ request, env, next, waitUntil }: Context): Promise<Response> {
  const page = await next();
  if (!env.CVEDEXD_URL || !page.ok || !page.headers.get("content-type")?.includes("text/html")) {
    return page;
  }
  const key = new Request(new URL("/cna/__advisories", request.url));
  let cached = await caches.default.match(key);
  if (!cached) {
    const html = await advisories(env.CVEDEXD_URL).catch(() => null);
    if (html === null) {
      return page;
    }
    cached = new Response(html, { headers: { "cache-control": `public, max-age=${MAX_AGE}` } });
    waitUntil(caches.default.put(key, cached.clone()));
  }
  const html = await cached.text();
  if (!html) {
    return page;
  }
  return new HTMLRewriter()
    .on("#advisory-list", {
      element(el) {
        el.setInnerContent(html, { html: true });
      },
    })
    .transform(page);
}

async function advisories(cvedexd: string): Promise<string | null> {
  const feed = await fetch(new URL("/api/cvedexd/published", cvedexd));
  if (!feed.ok) {
    return null;
  }
  const ids = await feed.json<string[]>();
  const records = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`https://cveawg.mitre.org/api/cve/${encodeURIComponent(id)}`);
      return res.ok ? res.json<CveRecord>() : null;
    }),
  );
  const rows = records
    .filter((record): record is CveRecord => record !== null)
    .sort((a, b) => (b.cveMetadata.datePublished ?? "").localeCompare(a.cveMetadata.datePublished ?? ""))
    .map(row);
  if (!rows.length) {
    return "";
  }
  return `<table><thead><tr><th>CVE</th><th>Advisory</th><th>Project</th><th>Published</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function row({ cveMetadata: { cveId, datePublished }, containers: { cna } }: CveRecord): string {
  const record = `https://www.cve.org/CVERecord?id=${encodeURIComponent(cveId)}`;
  const links = (cna.references ?? []).map((ref) => ref.url).filter((url) => url.startsWith("https://"));
  const advisory = links.find((url) => url.includes("/security/advisories/")) ?? links[0] ?? record;
  const summary = cna.title ?? cna.descriptions?.[0]?.value ?? cveId;
  const products = [...new Set((cna.affected ?? []).map((a) => a.product).filter(Boolean))].join(", ");
  return (
    `<tr><td><a href="${escape(record)}">${escape(cveId)}</a></td>` +
    `<td><a href="${escape(advisory)}">${escape(summary)}</a></td>` +
    `<td>${escape(products)}</td><td>${escape(datePublished?.slice(0, 10) ?? "")}</td></tr>`
  );
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
