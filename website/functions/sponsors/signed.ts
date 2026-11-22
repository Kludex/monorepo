import { type Context } from "../../src/lib/company-sponsors";

type FormEvent = {
  event_type: string;
  data: {
    role: string;
    email: string | null;
    completed_at: string;
    submission: { id: number; url: string };
    template: { external_id: string | null };
    values: { field: string; value: unknown }[];
    documents: { url: string }[];
  };
};

/** Receives DocuSeal `form.completed` webhooks and records in KV who signed the confidentiality term. */
export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!(await same(request.headers.get("x-webhook-secret"), env.DOCUSEAL_WEBHOOK_SECRET))) {
    return new Response("invalid secret", { status: 401 });
  }
  if (!env.SPONSORS) {
    return new Response("SPONSORS binding is missing", { status: 503 });
  }
  const { event_type, data } = await request.json<FormEvent>();
  if (
    event_type !== "form.completed" ||
    data.template.external_id !== "confidentiality-term" ||
    data.role !== "Sponsor"
  ) {
    return new Response("ignored");
  }
  await env.SPONSORS.put(
    `term:${data.submission.id}`,
    JSON.stringify({
      signedAt: data.completed_at,
      email: data.email,
      values: Object.fromEntries(data.values.map(({ field, value }) => [field, value])),
      document: data.documents[0]?.url,
      submission: data.submission.url,
    }),
  );
  return new Response("recorded");
}

async function same(given: string | null, secret: string | undefined): Promise<boolean> {
  if (!given || !secret) {
    return false;
  }
  const [a, b] = await Promise.all(
    [given, secret].map((text) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
  );
  return crypto.subtle.timingSafeEqual(a, b);
}
