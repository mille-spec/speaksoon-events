import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClassifiedEvent } from './types.js';

export function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  }

  return createClient(url, key);
}

const BATCH_SIZE = 50;

export async function insertEvents(
  events: ClassifiedEvent[],
  supabase: SupabaseClient
): Promise<{ inserted: number; errors: number }> {
  const validEvents = events.filter((e) => e.city !== null);
  if (validEvents.length < events.length) {
    console.log(`  (skipped ${events.length - validEvents.length} events with no city)`);
  }

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < validEvents.length; i += BATCH_SIZE) {
    const batch = validEvents.slice(i, i + BATCH_SIZE).map((e) => ({
      title: e.title,
      date: e.date,
      time_start: e.time_start,
      time_end: e.time_end,
      city: e.city,
      venue: e.venue,
      address: e.address,
      organizer: e.organizer,
      organizer_type: e.organizer_type,
      event_type: e.event_type,
      industry_tags: e.industry_tags,
      description: e.description,
      registration_url: e.registration_url,
      image_url: e.image_url,
      source_platform: e.source_platform,
      source_url: e.source_url,
      status: 'pending',
    }));

    const { error } = await supabase
      .from('events')
      .upsert(batch, { onConflict: 'title,date,city', ignoreDuplicates: true });

    if (error) {
      console.error(`  ✗ Insert batch ${i}–${i + batch.length} failed:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}
