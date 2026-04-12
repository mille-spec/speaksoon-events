import Anthropic from '@anthropic-ai/sdk';
import { Source, EventCandidate } from './types';

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

const SYSTEM_PROMPT = `You are an event data extractor. Given markdown content scraped from an event listing page, extract all individual events into structured JSON.

Return a JSON object with key "events" containing an array. Each event object must have:
- title: string (exact title)
- date: string (YYYY-MM-DD format, best guess from context)
- time_start: string | null (HH:MM 24h format)
- time_end: string | null (HH:MM 24h format)
- city: string | null (standardized: Brussels, Antwerp, Ghent, etc.)
- venue: string | null (venue name)
- address: string | null (street address if available)
- organizer: string | null
- description: string | null (brief, max 200 words)
- registration_url: string | null (direct link to event page)
- image_url: string | null

Rules:
- Only extract PHYSICAL events (must have a venue/city). Skip virtual/online/webinar events.
- Only include events in Belgium or Netherlands.
- Skip events with no date or "TBD" dates.
- If a date range is given (multi-day event), use the start date.
- Standardize city names: use English names (Brussels not Brussel, Antwerp not Antwerpen, Ghent not Gent).
- If you can't determine a field, set it to null.
- Do NOT invent or hallucinate data. Only extract what's clearly in the content.
- Respond with valid JSON only. No markdown, no explanation.`;

export async function parseEventsFromMarkdown(
  markdown: string,
  source: Source
): Promise<EventCandidate[]> {
  if (!markdown || markdown.trim().length < 100) return [];

  const anthropic = getAnthropic();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Source: ${source.name} (${source.platform})\n\nContent:\n${markdown.slice(0, 15000)}`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const parsed = JSON.parse(text);
    const events: any[] = parsed.events || [];

    return events
      .filter((e) => e.title && e.date)
      .map((e) => ({
        title: e.title,
        date: e.date,
        time_start: e.time_start ?? null,
        time_end: e.time_end ?? null,
        city: e.city ?? null,
        venue: e.venue ?? null,
        address: e.address ?? null,
        organizer: e.organizer ?? null,
        description: e.description ?? null,
        registration_url: e.registration_url ?? null,
        image_url: e.image_url ?? null,
        source_platform: source.platform,
        source_url: source.url,
      }));
  } catch (error) {
    console.error(`  ✗ Parse failed for ${source.name}:`, error);
    return [];
  }
}
