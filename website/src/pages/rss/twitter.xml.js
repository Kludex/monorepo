import { socialFeed } from "../../lib/social-feed.js";

export function GET(context) {
  return socialFeed(context, "twitter");
}
