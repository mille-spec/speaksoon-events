'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import type { Event } from '@/lib/types'

const MONTHS_ABB = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function parseDate(s: string | null) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function dateChip(s: string | null) {
  const d = parseDate(s)
  if (!d) return { mon: '', day: '?' }
  return { mon: MONTHS_ABB[d.getMonth()], day: d.getDate() }
}
function monthGroup(s: string | null) {
  const d = parseDate(s)
  if (!d) return 'Date TBD'
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
}
function fmtType(t: string | null) {
  if (!t) return ''
  return ({ networking:'Networking', trade_show:'Trade Show', conference:'Conference',
    meetup:'Meetup', mixer:'Mixer', pitch_event:'Pitch', other:'Other' })[t] ?? t
}
function fmtOrg(t: string | null) {
  if (!t || t === 'unknown') return ''
  return ({ chamber:'Chamber', federation:'Federation', community:'Community',
    company:'Company', government:'Government', startup_ecosystem:'Startup Ecosystem' })[t] ?? t
}

const ALL_TYPES = ['networking','conference','meetup','trade_show','pitch_event','mixer','other']
const ALL_INDUSTRIES = ['tech','SaaS','energy','health_tech','manufacturing','real_estate','construction','logistics','cybersecurity','professional_services','finance','hospitality','food','general']
const IND_LABEL: Record<string,string> = {
  tech:'Tech', SaaS:'SaaS', energy:'Energy', health_tech:'Health Tech',
  manufacturing:'Manufacturing', real_estate:'Real Estate', construction:'Construction',
  logistics:'Logistics', cybersecurity:'Cybersecurity', professional_services:'Prof. Services',
  finance:'Finance', hospitality:'Hospitality', food:'Food', general:'General'
}

type FK = 'source' | 'city' | 'type' | 'industry'
interface Filters { source:string; city:string; type:string; industry:string }

function SourceBadge({ platform }: { platform: string | null }) {
  if (!platform) return null
  const p = platform.charAt(0).toUpperCase() + platform.slice(1)
  if (p === 'Eventbrite') return (
    <span className="src-badge src-Eventbrite">
      <Image src="/logo-eventbrite.png" alt="Eventbrite" width={52} height={13} style={{height:13,width:'auto'}} />
    </span>
  )
  if (p === 'Meetup') return (
    <span className="src-badge src-Meetup">
      <Image src="/logo-meetup.png" alt="Meetup" width={52} height={18} style={{height:18,width:'auto'}} />
    </span>
  )
  if (p === 'Luma') return (
    <span className="src-badge src-Luma">
      <Image src="/logo-luma.png" alt="Luma" width={70} height={24} style={{height:24,width:'auto',minWidth:64}} />
    </span>
  )
  return <span className="etag">{p}</span>
}

export default function EventsClient({ events }: { events: Event[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date-asc')
  const [filters, setFilters] = useState<Filters>({ source:'all', city:'all', type:'all', industry:'all' })

  const cities = useMemo(() => {
    const s = new Set(events.map(e => e.city).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [events])

  const setFilter = useCallback((key: FK, value: string) => {
    setFilters(f => ({ ...f, [key]: value }))
  }, [])

  const clearAll = useCallback(() => {
    setFilters({ source:'all', city:'all', type:'all', industry:'all' })
    setSearch('')
  }, [])

  const filtered = useMemo(() => {
    let list = events.filter(e => {
      if (filters.source !== 'all' && e.source_platform?.toLowerCase() !== filters.source.toLowerCase()) return false
      if (filters.city !== 'all' && e.city !== filters.city) return false
      if (filters.type !== 'all' && e.event_type !== filters.type) return false
      if (filters.industry !== 'all' && !e.industry_tags?.includes(filters.industry)) return false
      if (search) {
        const q = search.toLowerCase()
        return !!(
          e.title?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.organizer?.toLowerCase().includes(q) ||
          e.industry_tags?.some(t => t.toLowerCase().includes(q))
        )
      }
      return true
    })
    if (sort === 'date-asc') list.sort((a,b) => (a.date||'').localeCompare(b.date||''))
    else if (sort === 'date-desc') list.sort((a,b) => (b.date||'').localeCompare(a.date||''))
    else if (sort === 'city') list.sort((a,b) => (a.city||'').localeCompare(b.city||''))
    else if (sort === 'az') list.sort((a,b) => (a.title||'').localeCompare(b.title||''))
    return list
  }, [events, filters, search, sort])

  const grouped = useMemo(() => {
    const groups: { month: string; items: Event[] }[] = []
    filtered.forEach(e => {
      const m = monthGroup(e.date)
      const last = groups[groups.length - 1]
      if (!last || last.month !== m) groups.push({ month: m, items: [e] })
      else last.items.push(e)
    })
    return groups
  }, [filtered])

  const activeTags = useMemo(() => {
    const tags: { key: FK; label: string }[] = []
    if (filters.source !== 'all') tags.push({ key:'source', label:filters.source })
    if (filters.city !== 'all') tags.push({ key:'city', label:filters.city })
    if (filters.type !== 'all') tags.push({ key:'type', label:fmtType(filters.type) })
    if (filters.industry !== 'all') tags.push({ key:'industry', label:IND_LABEL[filters.industry]||filters.industry })
    return tags
  }, [filters])

  const total = events.length
  const uniqueCities = useMemo(() => new Set(filtered.map(e => e.city).filter(Boolean)).size, [filtered])
  const uniqueSources = useMemo(() => new Set(filtered.map(e => e.source_platform).filter(Boolean)).size, [filtered])

  return (
    <div className="shell">

      {/* SIDEBAR */}
      <aside className={`sb${collapsed ? ' collapsed' : ''}`}>
        <div className="sb-logo-wrap">
          <div className="sb-logo">
            <Image src="/logo-speaksoon.png" alt="SpeakSoon" width={140} height={28} style={{height:28,width:'auto'}} />
          </div>
          <button className="sb-collapse-btn" onClick={() => setCollapsed(c => !c)}>
            <svg fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.6"><path d="M8 2.5L4 6.5l4 4"/></svg>
          </button>
        </div>
        <nav className="sb-nav">
          <div className="sb-grp">Main</div>
          <div className="sb-item">
            <svg className="sb-ico" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><path d="M2 6.5L8 2l6 4.5V14a.5.5 0 01-.5.5h-4V10H6.5v4.5h-4A.5.5 0 012 14V6.5z"/></svg>
            <span className="sb-lbl">Network</span>
          </div>
          <div className="sb-item">
            <svg className="sb-ico" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"/></svg>
            <span className="sb-lbl">Profile</span>
          </div>
          <div className="sb-item">
            <svg className="sb-ico" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
            <span className="sb-lbl">Company</span>
          </div>
          <div className="sb-grp">Discover</div>
          <div className="sb-item on">
            <svg className="sb-ico" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="3" width="13" height="11" rx="1.5"/><path d="M5 1.5v3M11 1.5v3M1.5 7h13"/></svg>
            <span className="sb-lbl">Events</span>
            <span className="sb-badge">{total}</span>
          </div>
          <div className="sb-item">
            <svg className="sb-ico" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3.5 3.5"/></svg>
            <span className="sb-lbl">Explore</span>
          </div>
          <div className="sb-grp">Tools</div>
          <div className="sb-item">
            <svg className="sb-ico" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><path d="M8 2v12M2 8h12"/></svg>
            <span className="sb-lbl">Add Contact</span>
          </div>
          <div className="sb-item">
            <svg className="sb-ico" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 11.5l3-3 2.5 2.5 5-6"/><rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/></svg>
            <span className="sb-lbl">Follow-up</span>
          </div>
        </nav>
        <div className="sb-foot">
          <div className="sb-av">SS</div>
          <div>
            <div className="sb-name">SpeakSoon</div>
            <div className="sb-email">events@speaksoon.app</div>
          </div>
          <div className="sb-online"></div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="tb-l">
            <span className="tb-title">Discover Events</span>
            <span className="tb-count">{filtered.length} events</span>
          </div>
          <div className="tb-r">
            <div className="search-wrap">
              <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3.5 3.5"/></svg>
              <input type="text" placeholder="Search events, venues, topics…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-ghost" onClick={clearAll}>
              <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              Reset
            </button>
            <button className="btn-add">+ Add Event</button>
          </div>
        </div>

        {/* HERO */}
        <div className="hero">
          <Image className="hero-img" src="/header-image.jpg" alt="Networking" width={180} height={110} style={{objectFit:'cover'}} />
          <div className="hero-l">
            <div className="hero-eyebrow">Event Discovery · Belgium &amp; Netherlands</div>
            <div className="hero-h">Find your next networking opportunity</div>
            <div className="hero-sub">Curated B2B events — Eventbrite, Luma &amp; Meetup</div>
            <button className="hero-rec-link">✦ Not sure where to go? Let SpeakSoon recommend →</button>
          </div>
          <div className="hero-r">
            <div className="hero-stats">
              <div className="hstat"><div className="hstat-v">{filtered.length}</div><div className="hstat-l">Events</div></div>
              <div className="hstat"><div className="hstat-v">{uniqueCities}</div><div className="hstat-l">Cities</div></div>
              <div className="hstat"><div className="hstat-v">{uniqueSources}</div><div className="hstat-l">Sources</div></div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters">
          <div className="frow">
            <span className="flabel">Source</span>
            <button className={`pill${filters.source==='all'?' on':''}`} onClick={() => setFilter('source','all')}>All</button>
            <button className={`src-pill src-pill-eb${filters.source==='Eventbrite'?' on':''}`} onClick={() => setFilter('source','Eventbrite')}>
              <Image src="/logo-eventbrite.png" alt="Eventbrite" width={52} height={14} style={{height:14,width:'auto'}} />
            </button>
            <button className={`src-pill src-pill-lu${filters.source==='Luma'?' on':''}`} onClick={() => setFilter('source','Luma')}>
              <Image src="/logo-luma.png" alt="Luma" width={70} height={28} style={{height:28,width:'auto',minWidth:68}} />
            </button>
            <button className={`src-pill src-pill-me${filters.source==='Meetup'?' on':''}`} onClick={() => setFilter('source','Meetup')}>
              <Image src="/logo-meetup.png" alt="Meetup" width={52} height={20} style={{height:20,width:'auto'}} />
            </button>
            <button className={`pill${filters.source==='BECI'?' on':''}`} onClick={() => setFilter('source','BECI')}>BECI</button>
          </div>
          <div className="frow">
            <span className="flabel">City</span>
            <button className={`pill${filters.city==='all'?' on':''}`} onClick={() => setFilter('city','all')}>All</button>
            {cities.map(c => (
              <button key={c} className={`pill${filters.city===c?' on':''}`} onClick={() => setFilter('city',c)}>{c}</button>
            ))}
          </div>
          <div className="frow">
            <span className="flabel">Type</span>
            <button className={`pill${filters.type==='all'?' on':''}`} onClick={() => setFilter('type','all')}>All</button>
            {ALL_TYPES.map(t => (
              <button key={t} className={`pill${filters.type===t?' on':''}`} onClick={() => setFilter('type',t)}>{fmtType(t)}</button>
            ))}
          </div>
          <div className="frow">
            <span className="flabel">Sector</span>
            <button className={`pill${filters.industry==='all'?' on':''}`} onClick={() => setFilter('industry','all')}>All</button>
            {ALL_INDUSTRIES.map(i => (
              <button key={i} className={`pill${filters.industry===i?' on':''}`} onClick={() => setFilter('industry',i)}>{IND_LABEL[i]||i}</button>
            ))}
          </div>
        </div>

        {/* ACTIVE FILTERS */}
        {activeTags.length > 0 && (
          <div className="abar show">
            <span className="abar-lbl">Active:</span>
            {activeTags.map(tag => (
              <span key={tag.key} className="atag">
                {tag.label}
                <button className="atag-x" onClick={() => setFilter(tag.key,'all')}>×</button>
              </span>
            ))}
            <button className="clear-btn" onClick={clearAll}>Clear all</button>
          </div>
        )}

        {/* GRID */}
        <div className="content">
          <div className="content-hd">
            <div>
              <span className="content-title">{activeTags.length > 0 || search ? 'Filtered Events' : 'All Events'}</span>
              {filtered.length !== total && <span className="content-sub">· {filtered.length} of {total}</span>}
            </div>
            <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="date-asc">Soonest first</option>
              <option value="date-desc">Latest first</option>
              <option value="city">By city</option>
              <option value="az">A – Z</option>
            </select>
          </div>

          <div className="grid">
            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔍</div>
                <div className="empty-h">No events found</div>
                <div className="empty-s">Try adjusting your filters or search</div>
              </div>
            ) : (
              grouped.map(({ month, items }) => (
                <React.Fragment key={month}>
                  <div className="m-div">
                    <span className="m-lbl">{month.toUpperCase()}</span>
                    <div className="m-line" />
                  </div>
                  {items.map(event => <EventCard key={event.id} event={event} />)}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  const { mon, day } = dateChip(event.date)
  return (
    <div className="ecard">
      <div className="ecard-head">
        <div className="ecard-head-top">
          <div className="date-chip">
            <span className="dc-mon">{mon}</span>
            <span className="dc-day">{day}</span>
          </div>
          <div className="src-row">
            <SourceBadge platform={event.source_platform} />
          </div>
        </div>
        <div className="ecard-title">{event.title}</div>
      </div>

      <div className="ecard-meta">
        {event.city && (
          <div className="mrow">
            <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><path d="M8 2C5.79 2 4 3.79 4 6c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"/><circle cx="8" cy="6" r="1.5"/></svg>
            <span><strong>{event.city}</strong>{event.venue ? ` · ${event.venue}` : ''}</span>
          </div>
        )}
        {event.organizer && (
          <div className="mrow">
            <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5" r="2.5"/><path d="M2.5 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/></svg>
            <span>{event.organizer}</span>
          </div>
        )}
        {event.time_start && (
          <div className="mrow">
            <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.5l2.5 1.5"/></svg>
            <span>{event.time_start}{event.time_end ? ` – ${event.time_end}` : ''}</span>
          </div>
        )}
      </div>

      {event.description && <div className="ecard-desc">{event.description}</div>}

      <div className="ecard-tags">
        {fmtType(event.event_type) && <span className="etag etag-type">{fmtType(event.event_type)}</span>}
        {fmtOrg(event.organizer_type) && <span className="etag etag-org">{fmtOrg(event.organizer_type)}</span>}
        {event.industry_tags?.slice(0,3).map(tag => (
          <span key={tag} className="etag etag-ind">{IND_LABEL[tag]||tag}</span>
        ))}
      </div>

      <div className="ecard-foot">
        <span className="foot-city">
          <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><path d="M8 2C5.79 2 4 3.79 4 6c0 3 4 8 4 8s4-5 4-8z"/></svg>
          {event.city}
        </span>
        {event.registration_url
          ? <a className="foot-reg" href={event.registration_url} target="_blank" rel="noopener noreferrer">
              Register
              <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </a>
          : <span className="foot-no-reg">No link</span>
        }
      </div>
    </div>
  )
}
