import type { MetadataRoute } from 'next'

/** AI crawlers: model training, AI search and AI assistants fetching pages. */
const AI_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'meta-externalagent',
  'FacebookBot',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'MistralAI-User',
  'DuckAssistBot',
  'YouBot',
  'AI2Bot',
  'Diffbot',
  'Omgilibot',
  'ImagesiftBot',
  'Timpibot',
]

/** SEO and data scrapers that crawl sites to resell what they collect. */
const SCRAPER_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'BLEXBot',
  'DataForSeoBot',
]

/** Keeps AI and scraper bots out; search engines like Google and Bing can still crawl. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: [...AI_BOTS, ...SCRAPER_BOTS], disallow: '/' },
      { userAgent: '*', allow: '/' },
    ],
  }
}
