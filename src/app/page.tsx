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

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .not('status', 'eq', 'rejected')
    .order('date', { ascending: true })

  if (error) {
    console.error('Supabase fetch error:', error.message)
    return []
  }

  return (data as Event[]) ?? []
}

export default async function Home() {
  const events = await getEvents()
  return <EventsClient events={events} />
}
