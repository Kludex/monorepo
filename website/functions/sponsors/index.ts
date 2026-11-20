type Sponsor = { avatarUrl: string; monthlyPriceInCents: number };
type Sponsors = Record<string, Sponsor>;

type Context = {
  request: Request;
  env: {
    SPONSORS?: {
      get(key: string, type: "json"): Promise<Sponsors | null>;
      put(key: string, value: string): Promise<void>;
    };
    GITHUB_WEBHOOK_SECRET?: string;
  };
  next: () => Promise<Response>;
};

type SponsorshipEvent = {
  action: string;
  sponsorship: {
    privacy_level: string;
    sponsor: { login: string; avatar_url: string };
    tier: { monthly_price_in_cents: number; is_one_time: boolean };
  };
};

const KEY = "sponsors";
const SUPPORTER = 500_00;
const PARTNER = 1000_00;

/** Fills `#company-sponsors` with Partners and Supporters. Any failure serves the static page. */
export async function onRequestGet({ env, next }: Context): Promise<Response> {
  const page = await next();
  if (!page.ok || !page.headers.get("content-type")?.includes("text/html")) {
    return page;
  }
  const sponsors = Object.entries((await env.SPONSORS?.get(KEY, "json").catch(() => null)) ?? {});
  const html =
    section(
      "Partners",
      sponsors.filter(([, sponsor]) => sponsor.monthlyPriceInCents >= PARTNER),
    ) +
    section(
      "Supporters",
      sponsors.filter(([, sponsor]) => sponsor.monthlyPriceInCents < PARTNER),
    );
  if (!html) {
    return page;
  }
  return new HTMLRewriter()
    .on("#company-sponsors", {
      element(el) {
        el.setInnerContent(html, { html: true });
      },
    })
    .transform(page);
}

/** Receives GitHub Sponsors `sponsorship` webhooks and keeps the public monthly sponsors of $500 or more in KV. */
export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const body = await request.text();
  if (!(await signed(body, request.headers.get("x-hub-signature-256"), env.GITHUB_WEBHOOK_SECRET))) {
    return new Response("invalid signature", { status: 401 });
  }
  if (!env.SPONSORS) {
    return new Response("SPONSORS binding is missing", { status: 503 });
  }
  const { action, sponsorship } = JSON.parse(body) as SponsorshipEvent;
  if (
    request.headers.get("x-github-event") !== "sponsorship" ||
    !["created", "edited", "tier_changed", "cancelled"].includes(action)
  ) {
    return new Response("ignored");
  }
  const listed =
    action !== "cancelled" &&
    sponsorship.privacy_level === "public" &&
    !sponsorship.tier.is_one_time &&
    sponsorship.tier.monthly_price_in_cents >= SUPPORTER;
  // shortcut: read-modify-write can drop one of two simultaneous events, use one key per sponsor if that happens.
  const sponsors = (await env.SPONSORS.get(KEY, "json")) ?? {};
  if (listed) {
    sponsors[sponsorship.sponsor.login] = {
      avatarUrl: sponsorship.sponsor.avatar_url,
      monthlyPriceInCents: sponsorship.tier.monthly_price_in_cents,
    };
  } else {
    delete sponsors[sponsorship.sponsor.login];
  }
  await env.SPONSORS.put(KEY, JSON.stringify(sponsors));
  return new Response(listed ? "listed" : "unlisted");
}

async function signed(body: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  const hex = signature?.match(/^sha256=([0-9a-f]{64})$/)?.[1];
  if (!hex || !secret) {
    return false;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "verify",
  ]);
  const mac = Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));
  return crypto.subtle.verify("HMAC", key, mac, encoder.encode(body));
}

function section(title: string, sponsors: [string, Sponsor][]): string {
  if (!sponsors.length) {
    return "";
  }
  const cards = sponsors.map(
    ([login, sponsor]) =>
      `<a href="https://github.com/${escape(login)}" class="group w-24 text-center">` +
      `<img src="${escape(sponsor.avatarUrl)}" alt="${escape(login)}" width="80" height="80" loading="lazy" ` +
      `class="mx-auto h-20 w-20 rounded-full transition-transform group-hover:scale-105" />` +
      `<p class="mt-2 truncate font-mono text-xs text-muted group-hover:text-accent">${escape(login)}</p></a>`,
  );
  return (
    `<h2 class="mt-14 border-t border-line pt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">${title}</h2>` +
    `<div class="mt-8 flex flex-wrap gap-x-6 gap-y-8">${cards.join("")}</div>`
  );
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
