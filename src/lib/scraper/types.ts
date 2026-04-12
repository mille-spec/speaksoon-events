export interface Source {
  name: string;
  platform: string;
  url: string;
  tier: 1 | 2;
  scrapeConfig?: {
    waitFor?: number;
    timeout?: number;
  };
}

export interface RawScrapeResult {
  source: Source;
  content: string;
  success: boolean;
  error?: string;
  scrapedAt: Date;
}

export interface EventCandidate {
  title: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  city: string | null;
  venue: string | null;
  address: string | null;
  organizer: string | null;
  description: string | null;
  registration_url: string | null;
  image_url: string | null;
  source_platform: string;
  source_url: string;
}

export interface ClassifiedEvent extends EventCandidate {
  organizer_type: string;
  event_type: string;
  industry_tags: string[];
}

export interface RunStats {
  totalNew: number;
  totalDupes: number;
  totalFailed: number;
  totalExtracted: number;
  totalClassified: number;
}
