// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical URLs, Open Graph image URLs and the sitemap all need to know
  // where the site actually lives. Without this Astro has no absolute origin
  // to build them from.
  site: 'https://secureprospective.com',
});
