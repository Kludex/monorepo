import { type Context, type Listed, KEY, escape, tiers } from "../../src/lib/company-sponsors";

type SponsorshipEvent = {
  action: string;
  sponsorship: {
    privacy_level: string;
    sponsor: { login: string; avatar_url: string };
    tier: { monthly_price_in_cents: number; is_one_time: boolean };
  };
};

const SUPPORTER = 500_00;

/** Fills `#company-sponsors` with Partners and Supporters. Any failure serves the static page. */
export async function onRequestGet({ env, next }: Context): Promise<Response> {
  const page = await next();
  if (!page.ok || !page.headers.get("content-type")?.includes("text/html")) {
    return page;
  }
  const { partners, supporters } = await tiers(env);
  const html =
    section("Partners", "grid gap-6 sm:grid-cols-2", partners.map(card)) +
    section("Supporters", "flex flex-wrap gap-x-6 gap-y-8", supporters.map(logo));
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
  const { login } = sponsorship.sponsor;
  const details = listed ? await profile(login).catch(() => ({})) : {};
  // shortcut: read-modify-write can drop one of two simultaneous events, use one key per sponsor if that happens.
  const sponsors = (await env.SPONSORS.get(KEY, "json")) ?? {};
  if (listed) {
    sponsors[login] = {
      ...sponsors[login],
      ...details,
      avatarUrl: sponsorship.sponsor.avatar_url,
      monthlyPriceInCents: sponsorship.tier.monthly_price_in_cents,
    };
  } else {
    delete sponsors[login];
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

/** Reads the name, website and description from the sponsor's public GitHub profile. */
async function profile(login: string): Promise<Partial<Listed>> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
    headers: { "user-agent": "marcelotryle.com" },
  });
  if (!res.ok) {
    return {};
  }
  const { name, blog, bio } = await res.json<Record<"name" | "blog" | "bio", string | null>>();
  const url = blog && URL.parse(blog.includes("://") ? blog : `https://${blog}`);
  return {
    name: name || undefined,
    url: url && /^https?:$/.test(url.protocol) ? url.href : undefined,
    description: bio?.trim() || undefined,
  };
}

function section(title: string, layout: string, sponsors: string[]): string {
  if (!sponsors.length) {
    return "";
  }
  return (
    `<h2 class="mt-14 border-t border-line pt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">${title}</h2>` +
    `<div class="mt-8 ${layout}">${sponsors.join("")}</div>`
  );
}

function card({ name, url, avatarUrl, description }: Listed): string {
  return (
    `<a href="${escape(url)}" class="group panel flex items-start gap-5 p-5">` +
    `<img src="${escape(avatarUrl)}" alt="" width="80" height="80" loading="lazy" ` +
    `class="h-20 w-20 shrink-0 rounded-lg" /><div class="min-w-0">` +
    `<p class="font-display text-xl font-semibold group-hover:text-accent">${escape(name)}</p>` +
    (description ? `<p class="mt-1 text-sm text-muted">${escape(description)}</p>` : "") +
    `</div></a>`
  );
}

function logo({ name, url, avatarUrl }: Listed): string {
  return (
    `<a href="${escape(url)}" class="group w-24 text-center">` +
    `<img src="${escape(avatarUrl)}" alt="" width="80" height="80" loading="lazy" ` +
    `class="mx-auto h-20 w-20 rounded-full transition-transform group-hover:scale-105" />` +
    `<p class="mt-2 truncate font-mono text-xs text-muted group-hover:text-accent">` +
    `${escape(name)}</p></a>`
  );
}
