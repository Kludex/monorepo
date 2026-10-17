import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { codeToHtml } from "shiki";

const [source, output] = process.argv.slice(2);
if (!source || !output) {
  console.error("Usage: node website/scripts/snippet.mjs <code file> <image.png>");
  process.exit(1);
}

const chrome =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const fonts = resolve(import.meta.dirname, "../node_modules/@fontsource/ibm-plex-mono/files");
const logo = resolve(import.meta.dirname, "pydantic-logo.svg");

const color = {
  sugar: "#FBFFEA",
  grey: "#8F888E",
  lithium: "#E520E9",
  calcium: "#FF6550",
  purple: "#9B77FF",
  aqua: "#77FFD8",
  paraffin: "#1D0214",
  darkPurple: "#36182D",
  elementPurple: "#49353F",
};

const theme = {
  name: "pydantic",
  type: "dark",
  colors: { "editor.background": color.paraffin, "editor.foreground": color.sugar },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: color.grey, fontStyle: "italic" } },
    { scope: ["punctuation", "keyword.operator"], settings: { foreground: color.grey } },
    { scope: ["keyword", "storage.type", "storage.modifier", "keyword.operator.logical"], settings: { foreground: color.calcium } },
    { scope: ["string", "punctuation.definition.string"], settings: { foreground: color.aqua } },
    { scope: ["constant", "support.type", "support.function.builtin", "variable.language"], settings: { foreground: color.purple } },
    {
      scope: ["entity.name", "entity.name.function.decorator", "punctuation.definition.decorator", "meta.function-call.generic"],
      settings: { foreground: color.lithium },
    },
    { scope: ["variable.parameter.function-call"], settings: { foreground: color.sugar } },
  ],
};

const code = await codeToHtml(readFileSync(source, "utf8").trimEnd(), {
  lang: extname(source).slice(1),
  theme,
});

const html = `<!doctype html>
<style>
  @font-face { font-family: "IBM Plex Mono"; font-weight: 400; src: url("file://${fonts}/ibm-plex-mono-latin-400-normal.woff2"); }
  @font-face { font-family: "IBM Plex Mono"; font-weight: 500; src: url("file://${fonts}/ibm-plex-mono-latin-500-normal.woff2"); }
  html, body { margin: 0; width: 1600px; height: 900px; }
  body {
    display: flex; align-items: center; justify-content: center; position: relative;
    box-sizing: border-box; padding: 120px 80px 80px;
    background:
      radial-gradient(circle at 0% 0%, ${color.lithium}aa, transparent 45%),
      radial-gradient(circle at 100% 100%, ${color.calcium}88, transparent 45%),
      ${color.darkPurple};
  }
  .logo { position: absolute; top: 48px; right: 56px; height: 40px; }
  .shiki {
    margin: 0; padding: 44px 56px; border-radius: 20px; border: 1px solid ${color.elementPurple};
    box-shadow: 0 30px 80px #0008;
  }
  .shiki code { font: 500 26px/1.55 "IBM Plex Mono", monospace; }
</style>
<img class="logo" src="file://${logo}">
${code}
<script>
  const pre = document.querySelector(".shiki");
  const scale = Math.min(1, 1440 / pre.offsetWidth, 700 / pre.offsetHeight);
  pre.style.zoom = scale;
</script>`;

const page = join(mkdtempSync(join(tmpdir(), "snippet-")), "snippet.html");
writeFileSync(page, html);
execFileSync(chrome, [
  "--headless=new",
  "--hide-scrollbars",
  "--force-device-scale-factor=2",
  "--window-size=1600,900",
  "--virtual-time-budget=2000",
  `--screenshot=${resolve(output)}`,
  `file://${page}`,
], { stdio: "ignore" });
console.log(`Wrote ${output}`);
