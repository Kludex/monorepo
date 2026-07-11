// One-shot migration of mkdocs-material blog posts to Astro content collection markdown.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = new URL("../../docs/blog/posts", import.meta.url).pathname;
const DEST = new URL("../src/content/blog", import.meta.url).pathname;

const EMOJI = {
  heart: "❤️",
  pray: "🙏",
  nerd: "🤓",
  sweat_smile: "😅",
  tada: "🎉",
  wink: "😉",
  eyes: "👀",
  thinking: "🤔",
  sparkles: "✨",
  rocket: "🚀",
  raised_hands: "🙌",
  partying_face: "🥳",
  sunglasses: "😎",
  warning: "⚠️",
  bulb: "💡",
  wave: "👋",
};

function dedent(lines) {
  return lines.map((line) => (line.startsWith("    ") ? line.slice(4) : line.trimStart() === "" ? "" : line));
}

function consumeIndentedBlock(lines, start) {
  const block = [];
  let i = start;
  while (i < lines.length && (lines[i].trim() === "" || lines[i].startsWith("    "))) {
    block.push(lines[i]);
    i += 1;
  }
  while (block.length > 0 && block[block.length - 1].trim() === "") {
    block.pop();
    i -= 1;
  }
  return [dedent(block), i];
}

function transformBlocks(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const admonition = line.match(/^!!!\s+(\w+)(?:\s+"(.*)")?\s*$/);
    const tab = line.match(/^===\s+"(.*)"\s*$/);
    if (admonition) {
      const [block, next] = consumeIndentedBlock(lines, i + 1);
      const title = admonition[2] ? `[${admonition[2]}]` : "";
      out.push(`:::${admonition[1]}${title}`, ...transformBlocks(block.join("\n")).split("\n"), ":::");
      i = next;
    } else if (tab) {
      const [block, next] = consumeIndentedBlock(lines, i + 1);
      out.push(`**${tab[1]}**`, "", ...transformBlocks(block.join("\n")).split("\n"));
      i = next;
    } else {
      out.push(line);
      i += 1;
    }
  }
  return out.join("\n");
}

function transformInline(text) {
  return text
    .replace(/:([a-z_]+):/g, (match, name) => EMOJI[name] ?? match)
    .replace(/\{:?[^}]*\}/g, "")
    .replace(/\s*# \(\d+\)!/g, "")
    .replace(/^```(\w+)[^\n]*title="([^"]+)"[^\n]*$/gm, "`$2`\n\n```$1")
    .replace(/^```(\w+)\s+linenums="\d+"\s*$/gm, "```$1")
    .replace(/\]\(assets\//g, "](/blog/assets/");
}

mkdirSync(DEST, { recursive: true });

for (const file of readdirSync(SRC).filter((name) => name.endsWith(".md"))) {
  const raw = readFileSync(join(SRC, file), "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`no frontmatter in ${file}`);
  const [, frontmatter, body] = match;

  const date = frontmatter.match(/^date:\s*(\S+)/m)?.[1];
  const categories = [...frontmatter.matchAll(/^- (.+)$/gm)].map((entry) => entry[1]);
  const title = body.match(/^# (.+)$/m)?.[1];
  if (!date || !title) throw new Error(`missing date or title in ${file}`);

  const content = transformInline(transformBlocks(body.replace(/^# .+$/m, "").trim()));
  const fm = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${date}`,
    `categories: [${categories.map((category) => `"${category}"`).join(", ")}]`,
    "---",
  ].join("\n");

  writeFileSync(join(DEST, file), `${fm}\n\n${content.trim()}\n`);
  console.log(`migrated ${file}`);
}
