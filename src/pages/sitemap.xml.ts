import type { APIRoute } from 'astro';

/*
 * The sitemap is generated here rather than by an integration. @astrojs/sitemap's
 * current release reads a build hook Astro 4 does not pass, so it fails the build;
 * the public surface of this site is five pages and one legal page, which is small
 * enough that owning the list outright is clearer than pinning a version match.
 *
 * The back office is deliberately absent. Those pages are invite-only, carry
 * noindex, and are disallowed in robots.txt.
 */

const SITE = 'https://secureprospective.com';

const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/services/', priority: '0.9', changefreq: 'monthly' },
  { path: '/the-work/', priority: '0.9', changefreq: 'weekly' },
  { path: '/the-method/', priority: '0.8', changefreq: 'monthly' },
  { path: '/the-operator/', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact/', priority: '0.9', changefreq: 'monthly' },
  { path: '/privacy/', priority: '0.3', changefreq: 'yearly' },
];

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${SITE}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
