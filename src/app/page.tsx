import { createClient } from '@supabase/supabase-js'
import EventsClient from '@/components/EventsClient'
import type { Event } from '@/lib/types'

// Revalidate every hour — new scraped events appear without redeploying
export const revalidate = 3600

async function getEvents(): Promise<Event[]> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    console.warn('SUPABASE_URL / SUPABASE_SERVICE_KEY not set — no events loaded')
    return []
  }

  const supabase = createClient(url, key)

  // Reads events_staging directly — same table the Lovable public site reads,
  // and the only table the n8n workflow actually writes to. The separate `events`
  // table (this app's own scraper output) is unused; one shared table, one writer.
  const { data, error } = await supabase
    .from('events_staging')
    .select('*')
    .neq('status', 'rejected')
    .order('start_date', { ascending: true })
    .order('time_start', { ascending: true })

  if (error) {
    console.error('Supabase fetch error:', error.message)
    return []
  }

  return (data ?? []).map((row): Event => ({
    id: row.id,
    title: row.event_title,
    date: row.start_date,
    time_start: row.time_start,
    time_end: row.time_end,
    city: row.city,
    venue: row.location_venue,
    organizer: row.organizer,
    organizer_type: row.organizer_type || null,
    event_type: row.event_type || null,
    industry_tags: row.industry_tags
      ? row.industry_tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [],
    description: row.description,
    registration_url: row.registration_url,
    source_platform: row.source_platform,
    also_listed_on: row.also_listed_on
      ? row.also_listed_on.split(',').map((t: string) => t.trim()).filter(Boolean)
      : null,
    scraped_at: row.scraped_at,
  }))
}

export default async function Home() {
  const events = await getEvents()
  return <EventsClient events={events} />
}
