import { SupabaseClient } from '@supabase/supabase-js';
import { ClassifiedEvent } from './types.js';

export async function deduplicateEvents(
  events: ClassifiedEvent[],
  supabase: SupabaseClient
): Promise<{ newEvents: ClassifiedEvent[]; duplicates: ClassifiedEvent[] }> {
  if (events.length === 0) return { newEvents: [], duplicates: [] };

  const dates = events.map((e) => e.date).filter(Boolean).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  const { data: existing, error } = await supabase
    .from('events')
    .select('event_title, start_date, city')
    .gte('start_date', minDate)
    .lte('start_date', maxDate);

  if (error) {
    console.error('  ✗ Failed to fetch existing events for dedup:', error.message);
    // On error, assume all events are new to avoid silent data loss
    return { newEvents: events, duplicates: [] };
  }

  const existingKeys = new Set(
    (existing || []).map((e) => makeKey(e.event_title, e.start_date, e.city))
  );

  const newEvents: ClassifiedEvent[] = [];
  const duplicates: ClassifiedEvent[] = [];

  for (const event of events) {
    const key = makeKey(event.title, event.date, event.city);
    if (existingKeys.has(key)) {
      duplicates.push(event);
    } else {
      newEvents.push(event);
      existingKeys.add(key); // prevent dupes within the same batch
    }
  }

  return { newEvents, duplicates };
}

function makeKey(title: string, date: string, city: string | null): string {
  return `${title.toLowerCase().trim()}|${date}|${(city || '').toLowerCase().trim()}`;
}
