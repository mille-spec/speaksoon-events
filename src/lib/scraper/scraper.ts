import { FirecrawlClient } from 'firecrawl';
import { Source, RawScrapeResult } from './types';

function getFirecrawl() {
  return new FirecrawlClient({ apiKey: process.env.FIRECRAWL_API_KEY! });
}

export async function scrapeSource(source: Source): Promise<RawScrapeResult> {
  const firecrawl = getFirecrawl();
  try {
    const result = await firecrawl.scrape(source.url, {
      formats: ['markdown'],
      timeout: source.scrapeConfig?.timeout ?? 30000,
      waitFor: source.scrapeConfig?.waitFor,
    } as any);

    const content = (result as any).markdown || '';

    return {
      source,
      content,
      success: content.length > 0,
      scrapedAt: new Date(),
    };
  } catch (error) {
    console.error(`  ✗ Failed to scrape ${source.name}:`, error);
    return {
      source,
      content: '',
      success: false,
      error: String(error),
      scrapedAt: new Date(),
    };
  }
}
