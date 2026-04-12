import { SupabaseClient } from '@supabase/supabase-js';
import { ClassifiedEvent } from './types';

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
    .select('title, date, city')
    .gte('date', minDate)
    .lte('date', maxDate);

  if (error) {
    return { newEvents: events, duplicates: [] };
  }

  const existingKeys = new Set(
    (existing || []).map((e) => makeKey(e.title, e.date, e.city))
  );

  const newEvents: ClassifiedEvent[] = [];
  const duplicates: ClassifiedEvent[] = [];

  for (const event of events) {
    const key = makeKey(event.title, event.date, event.city);
    if (existingKeys.has(key)) {
      duplicates.push(event);
    } else {
      newEvents.push(event);
      existingKeys.add(key);
    }
  }

  return { newEvents, duplicates };
}

function makeKey(title: string, date: string, city: string | null): string {
  return `${title.toLowerCase().trim()}|${date}|${(city || '').toLowerCase().trim()}`;
}
