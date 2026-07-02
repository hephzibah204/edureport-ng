import { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/admin/', '/api/'],
    },
    sitemap: 'https://reportsheet.com.ng/sitemap.xml',
  };
}
