import { type Context, logos } from "../../src/lib/company-sponsors";

/** Partner logos, two per row, for a docs sidebar. */
export function onRequestGet(context: Context): Promise<Response> {
  return logos(context, 240, 112);
}
