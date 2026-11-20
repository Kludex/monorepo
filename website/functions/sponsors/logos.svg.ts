import { type Context, logos } from "../../src/lib/company-sponsors";

/** Partner and Supporter logos as one image, for READMEs and docs pages. */
export function onRequestGet(context: Context): Promise<Response> {
  return logos(context, 800, 96, 64);
}
