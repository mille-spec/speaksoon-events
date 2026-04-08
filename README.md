# SpeakSoon Events

B2B networking event discovery for Belgium & the Netherlands.

**Frontend** — Next.js app deployed on Vercel, reads events from Supabase.  
**Scraper** — Node.js CLI in `scraper/`, writes events to Supabase. Triggered manually or via n8n.

```
speaksoon-events/
├── src/              ← Next.js frontend (deployed to Vercel)
│   ├── app/
│   ├── components/
│   └── lib/
├── scraper/          ← Scraper CLI (run locally or via n8n)
│   └── src/
└── public/           ← Logos + header image
```

---

## Frontend setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase values
npm run dev                          # http://localhost:3000
```

**Environment variables** (`.env.local` / Vercel project settings):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## Scraper setup

```bash
cd scraper
npm install
cp .env.example .env   # fill in all four values
```

**Environment variables** (`scraper/.env`):
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
FIRECRAWL_API_KEY=...
ANTHROPIC_API_KEY=...
```

**Run the scraper:**
```bash
cd scraper
npm run dev         # dry-run (no DB writes)
npm start           # full run, all 27 sources
npm run tier1       # Tier 1 sources only (Eventbrite, Luma, Meetup, aggregators)
npm run tier2       # Tier 2 sources only (VOKA, BECI, chambers, federations)

# Single source:
npx tsx src/index.ts --source eventbrite
npx tsx src/index.ts --source voka --dry-run
```

---

## Vercel deployment

See the step-by-step guide in the project notes. Required env vars in Vercel:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

The page revalidates every hour — scraped events appear automatically.
