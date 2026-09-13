// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical URLs, Open Graph image URLs and the sitemap all need to know
  // where the site actually lives. Without this Astro has no absolute origin
  // to build them from.
  site: 'https://secureprospective.com',

  markdown: {
    // The security architecture report is the only markdown page on the site,
    // and it is most of the way through a locked palette. Shiki's default
    // github-dark theme paints its own background and its own greens and
    // purples inline, which puts a second colour system inside the one page
    // that is nothing but evidence blocks. The css-variables theme emits
    // var(--astro-code-*) instead, so the highlighting is defined from
    // tokens.css in src/styles/pages/architecture.css and stays on brand.
    shikiConfig: {
      theme: 'css-variables',
      wrap: false,
    },
  },
});
