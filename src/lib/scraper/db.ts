import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClassifiedEvent } from './types';

export function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  }

  return createClient(url, key);
}

const BATCH_SIZE = 50;

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);
}

// `events` shares its schema with `events_staging` (event_title/start_date/location_venue/etc,
// no status/address/image_url/source_url columns) — see supabase-schema.sql in the n8n workflow project.
export async function insertEvents(
  events: ClassifiedEvent[],
  supabase: SupabaseClient
): Promise<{ inserted: number; errors: number }> {
  const validEvents = events.filter((e) => e.city !== null);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < validEvents.length; i += BATCH_SIZE) {
    const batch = validEvents.slice(i, i + BATCH_SIZE).map((e) => ({
      event_id: `${e.date}_${slugify(e.title)}`,
      event_title: e.title,
      start_date: e.date,
      end_date: e.date,
      time_start: e.time_start,
      time_end: e.time_end,
      city: e.city,
      location_venue: e.venue,
      organizer: e.organizer,
      organizer_type: e.organizer_type,
      event_type: e.event_type,
      industry_tags: e.industry_tags.join(', '),
      description: e.description,
      registration_url: e.registration_url,
      source_platform: e.source_platform,
      scraped_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('events')
      .upsert(batch, { onConflict: 'event_id', ignoreDuplicates: true });

    if (error) {
      console.error(`  ✗ Insert batch failed:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}
