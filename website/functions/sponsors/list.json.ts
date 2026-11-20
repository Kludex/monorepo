import { type Context, tiers } from "../../src/lib/company-sponsors";

/** Partners and Supporters as JSON, for any site that wants to draw its own list. */
export async function onRequestGet({ env }: Context): Promise<Response> {
  return Response.json(await tiers(env), {
    headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=600" },
  });
}
