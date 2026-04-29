import { getTools } from '@/lib/get-tools';

export async function GET() {
  const baseUrl = 'https://peakly.vercel.app';
  const tools = await getTools();

  // Define all static routes
  const staticRoutes = [
    '',
    '/index',
    '/trends',
    '/categories',
    '/compare',
    '/advisor',
    '/collections',
    '/alerts',
    '/auth',
  ];

  // Generate tool routes
  const toolRoutes = tools.map((tool) => `/tool/${tool.id}`);
  const alternativesRoutes = tools.slice(0, 20).map((tool) => `/alternatives-to/${tool.id}`);
  const compareRoutes = tools
    .slice(0, 8)
    .flatMap((left, idx, arr) =>
      arr
        .slice(idx + 1, idx + 3)
        .map((right) => `/compare/${encodeURIComponent(left.id)}/vs/${encodeURIComponent(right.id)}`)
    );

  const useCases = ['customer-support', 'content-creation', 'developer-productivity'];
  const programmaticRoutes = useCases.map((useCase) => `/best-ai-tools-for/${useCase}`);

  // Combine all routes
  const allRoutes = [...staticRoutes, ...toolRoutes, ...programmaticRoutes, ...alternativesRoutes, ...compareRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes
    .map((route) => {
      const url = `${baseUrl}${route}`;
      const priority = route === '' ? '1.0' : route.startsWith('/tool/') ? '0.6' : '0.8';

      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${route.startsWith('/tool/') ? 'daily' : 'weekly'}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
