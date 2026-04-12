import { NextRequest, NextResponse } from 'next/server'
import { ALL_SOURCES } from '@/lib/scraper/sources'
import { scrapeSource } from '@/lib/scraper/scraper'
import { parseEventsFromMarkdown } from '@/lib/scraper/parser'
import { classifyBatch } from '@/lib/scraper/classifier'
import { deduplicateEvents } from '@/lib/scraper/deduplicator'
import { createSupabaseClient, insertEvents } from '@/lib/scraper/db'

// Max 60s — safe for Vercel Hobby. One source per call from n8n.
export const maxDuration = 60

// Cap events per source to stay within timeout
const MAX_EVENTS = 25

export async function POST(req: NextRequest) {
  // Auth
  const auth = req.headers.get('authorization')
  if (!auth || auth !== `Bearer ${process.env.SCRAPE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { sourceName } = body as { sourceName?: string }

  if (!sourceName) {
    return NextResponse.json({ error: 'sourceName required' }, { status: 400 })
  }

  const match = sourceName.toLowerCase()
  const source = ALL_SOURCES.find(
    s => s.name.toLowerCase() === match || s.platform.toLowerCase() === match
  )

  if (!source) {
    return NextResponse.json({ error: `Source not found: ${sourceName}` }, { status: 404 })
  }

  const supabase = createSupabaseClient()
  const stats = { source: source.name, extracted: 0, classified: 0, inserted: 0, dupes: 0, failed: false }

  // 1. Scrape
  const raw = await scrapeSource(source)
  if (!raw.success) {
    return NextResponse.json({ ...stats, failed: true, error: raw.error })
  }

  // 2. Parse
  const candidates = await parseEventsFromMarkdown(raw.content, source)
  const limited = candidates.slice(0, MAX_EVENTS)
  stats.extracted = limited.length

  if (limited.length === 0) {
    return NextResponse.json(stats)
  }

  // 3. Classify
  const classified = await classifyBatch(limited)
  stats.classified = classified.length

  if (classified.length === 0) {
    return NextResponse.json(stats)
  }

  // 4. Dedup
  const { newEvents, duplicates } = await deduplicateEvents(classified, supabase)
  stats.dupes = duplicates.length

  // 5. Insert
  if (newEvents.length > 0) {
    const { inserted } = await insertEvents(newEvents, supabase)
    stats.inserted = inserted
  }

  return NextResponse.json(stats)
}
