export interface Event {
  id: string
  title: string
  date: string
  time_start: string | null
  time_end: string | null
  city: string
  venue: string | null
  organizer: string | null
  organizer_type: 'chamber' | 'federation' | 'community' | 'company' | 'government' | 'startup_ecosystem' | 'unknown' | null
  event_type: 'networking' | 'trade_show' | 'conference' | 'meetup' | 'mixer' | 'pitch_event' | 'other' | null
  industry_tags: string[] | null
  description: string | null
  registration_url: string | null
  source_platform: string | null
  also_listed_on: string[] | null
  scraped_at: string | null
}
