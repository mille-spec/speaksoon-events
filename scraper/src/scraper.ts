import { FirecrawlClient } from 'firecrawl';
import { Source, RawScrapeResult } from './types.js';

const firecrawl = new FirecrawlClient({ apiKey: process.env.FIRECRAWL_API_KEY });

const DELAY_MS = 2000;

export async function scrapeSource(source: Source): Promise<RawScrapeResult> {
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

export async function scrapeAll(sources: Source[]): Promise<RawScrapeResult[]> {
  const results: RawScrapeResult[] = [];

  for (const source of sources) {
    const result = await scrapeSource(source);
    results.push(result);
    if (sources.indexOf(source) < sources.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  return results;
}
