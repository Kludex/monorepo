import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import remarkDirective from "remark-directive";
import { remarkCallouts } from "./src/lib/remark-callouts.mjs";

export default defineConfig({
  site: "https://marcelotryle.com",
  trailingSlash: "ignore",
  markdown: {
    remarkPlugins: [remarkDirective, remarkCallouts],
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
