import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login', '/api', '/actions'],
    },
    sitemap: 'https://zoraferrs.vercel.app/sitemap.xml',
  }
}
