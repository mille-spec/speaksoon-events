import Anthropic from '@anthropic-ai/sdk';
import { EventCandidate, ClassifiedEvent } from './types';

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

const SYSTEM_PROMPT = `Classify this B2B event. Return a JSON object with:
- organizer_type: one of 'chamber', 'federation', 'community', 'company', 'government', 'startup_ecosystem', 'unknown'
- event_type: one of 'networking', 'trade_show', 'conference', 'meetup', 'mixer', 'pitch_event', 'other'
- industry_tags: array of relevant tags from: 'cybersecurity', 'SaaS', 'energy', 'construction', 'hospitality', 'manufacturing', 'professional_services', 'tech', 'finance', 'healthcare', 'real_estate', 'logistics', 'food', 'general'
- is_b2b: boolean (true if this is a legitimate B2B networking/professional event)

Be conservative with is_b2b. Mark false for: consumer events, family/leisure events, pure academic lectures, political rallies, charity fundraisers without business networking, internal company events, pure training/workshops without networking, virtual/online/webinar events.

Respond with valid JSON only. No markdown, no explanation.`;

export async function classifyEvent(event: EventCandidate): Promise<ClassifiedEvent | null> {
  const anthropic = getAnthropic();
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Title: ${event.title}\nOrganizer: ${event.organizer || 'unknown'}\nDescription: ${event.description || 'none'}\nCity: ${event.city || 'unknown'}`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const text = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const result = JSON.parse(text);

    if (!result.is_b2b) return null;

    return {
      ...event,
      organizer_type: result.organizer_type || 'unknown',
      event_type: result.event_type || 'other',
      industry_tags: result.industry_tags || [],
    };
  } catch (error) {
    console.error(`  ✗ Classification failed for "${event.title}":`, error);
    return null;
  }
}

export async function classifyBatch(events: EventCandidate[]): Promise<ClassifiedEvent[]> {
  const results: (ClassifiedEvent | null)[] = [];
  for (const event of events) {
    results.push(await classifyEvent(event));
    await new Promise(r => setTimeout(r, 1200)); // ~50 req/min
  }
  return results.filter((e): e is ClassifiedEvent => e !== null);
}
