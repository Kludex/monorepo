export type Sponsor = {
  avatarUrl: string;
  monthlyPriceInCents: number;
  name?: string;
  url?: string;
  description?: string;
};
export type Sponsors = Record<string, Sponsor>;

export type Context = {
  request: Request;
  env: {
    SPONSORS?: {
      get(key: string, type: "json"): Promise<Sponsors | null>;
      put(key: string, value: string): Promise<void>;
    };
    GITHUB_WEBHOOK_SECRET?: string;
    DOCUSEAL_WEBHOOK_SECRET?: string;
  };
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
};

export type Listed = {
  login: string;
  name: string;
  url: string;
  avatarUrl: string;
  description?: string;
};

export const KEY = "sponsors";
export const PARTNER = 1000_00;
const GAP = 16;

export async function tiers(
  env: Context["env"],
): Promise<{ partners: Listed[]; supporters: Listed[] }> {
  const sponsors = Object.entries((await env.SPONSORS?.get(KEY, "json").catch(() => null)) ?? {});
  const tier = (partner: boolean): Listed[] =>
    sponsors
      .filter(([, sponsor]) => sponsor.monthlyPriceInCents >= PARTNER === partner)
      .map(([login, sponsor]) => ({
        login,
        name: sponsor.name ?? login,
        url: sponsor.url ?? `https://github.com/${login}`,
        avatarUrl: sponsor.avatarUrl,
        description: sponsor.description,
      }));
  return { partners: tier(true), supporters: tier(false) };
}

/** Draws the logos as one SVG. Pass no `supporter` size to leave the Supporters out. */
export async function logos(
  { request, env, waitUntil }: Context,
  width: number,
  partner: number,
  supporter = 0,
): Promise<Response> {
  const key = new Request(new URL(new URL(request.url).pathname, request.url));
  const cached = await caches.default.match(key);
  if (cached) {
    return cached;
  }
  const { partners, supporters } = await tiers(env);
  const images: Promise<string>[] = [];
  let height = 0;
  for (const [sponsors, size] of [
    [partners, partner],
    [supporter ? supporters : [], supporter],
  ] as const) {
    const perRow = Math.floor((width + GAP) / (size + GAP));
    sponsors.forEach((sponsor, i) => {
      const x = (i % perRow) * (size + GAP);
      const y = height + Math.floor(i / perRow) * (size + GAP);
      images.push(image(sponsor, x, y, size).catch(() => ""));
    });
    height += Math.ceil(sponsors.length / perRow) * (size + GAP);
  }
  const drawn = await Promise.all(images);
  const [w, h] = drawn.length ? [width, height - GAP] : [1, 1];
  const complete = drawn.every(Boolean);
  const response = new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
      `<clipPath id="round" clipPathUnits="objectBoundingBox">` +
      `<rect width="1" height="1" rx="0.125" /></clipPath>${drawn.join("")}</svg>`,
    {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": complete ? "public, max-age=3600" : "no-store",
      },
    },
  );
  // An empty image is not cached, so the first sponsor shows up at once.
  if (complete && drawn.length) {
    waitUntil(caches.default.put(key, response.clone()));
  }
  return response;
}

export function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// An SVG shown through `<img>` cannot load external images, so the avatar is embedded.
async function image({ name, avatarUrl }: Listed, x: number, y: number, size: number) {
  const url = new URL(avatarUrl);
  if (url.protocol !== "https:") {
    throw new Error("avatar is not served over https");
  }
  url.searchParams.set("s", String(size * 2));
  const res = await fetch(url);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    throw new Error("avatar is unavailable");
  }
  let binary = "";
  for (const byte of new Uint8Array(await res.arrayBuffer())) {
    binary += String.fromCharCode(byte);
  }
  return (
    `<image x="${x}" y="${y}" width="${size}" height="${size}" clip-path="url(#round)" ` +
    `href="data:${escape(type)};base64,${btoa(binary)}"><title>${escape(name)}</title></image>`
  );
}
