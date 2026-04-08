import 'dotenv/config';
import { Command } from 'commander';
import { ALL_SOURCES, TIER_1_SOURCES, TIER_2_SOURCES } from './sources.js';
import { scrapeSource } from './scraper.js';
import { parseEventsFromMarkdown } from './parser.js';
import { classifyBatch } from './classifier.js';
import { deduplicateEvents } from './deduplicator.js';
import { createSupabaseClient, insertEvents } from './db.js';
import { Source, RunStats } from './types.js';

const program = new Command();

program
  .option('--tier <number>', 'Only scrape sources of this tier (1 or 2)')
  .option('--source <platform>', 'Only scrape sources matching this platform name')
  .option('--dry-run', 'Parse and classify but do not write to database')
  .parse();

const opts = program.opts();

function selectSources(): Source[] {
  let sources = ALL_SOURCES;

  if (opts.tier) {
    const tier = parseInt(opts.tier);
    sources = tier === 1 ? TIER_1_SOURCES : TIER_2_SOURCES;
  }

  if (opts.source) {
    const match = opts.source.toLowerCase();
    sources = sources.filter(
      (s) => s.platform.toLowerCase().includes(match) || s.name.toLowerCase().includes(match)
    );
  }

  return sources;
}

async function main() {
  console.log('SpeakSoon Event Scraper — Starting run');

  const isDryRun = !!opts.dryRun;
  if (isDryRun) console.log('DRY RUN — no data will be written\n');

  const sources = selectSources();
  console.log(`${sources.length} source(s) to scrape\n`);

  if (sources.length === 0) {
    console.error('No sources matched. Check --source or --tier flags.');
    process.exit(1);
  }

  const supabase = isDryRun ? null : createSupabaseClient();

  const stats: RunStats = {
    totalNew: 0,
    totalDupes: 0,
    totalFailed: 0,
    totalExtracted: 0,
    totalClassified: 0,
  };

  for (const source of sources) {
    console.log(`Scraping: ${source.name}...`);

    // 1. Scrape
    const raw = await scrapeSource(source);
    if (!raw.success) {
      stats.totalFailed++;
      continue;
    }

    // 2. Parse
    const candidates = await parseEventsFromMarkdown(raw.content, source);
    stats.totalExtracted += candidates.length;
    console.log(`  ${candidates.length} events extracted`);

    if (candidates.length === 0) continue;

    // 3. Classify + filter B2B
    const classified = await classifyBatch(candidates);
    stats.totalClassified += classified.length;
    console.log(`  ${classified.length} passed B2B filter`);

    if (classified.length === 0) continue;

    if (isDryRun) {
      console.log('  [dry-run] Sample events:');
      classified.slice(0, 3).forEach((e) =>
        console.log(`    - ${e.title} | ${e.date} | ${e.city} | ${e.event_type}`)
      );
      stats.totalNew += classified.length;
      continue;
    }

    // 4. Deduplicate
    const { newEvents, duplicates } = await deduplicateEvents(classified, supabase!);
    console.log(`  ${newEvents.length} new, ${duplicates.length} duplicates`);

    // 5. Insert
    if (newEvents.length > 0) {
      const { inserted } = await insertEvents(newEvents, supabase!);
      stats.totalNew += inserted;
    }

    stats.totalDupes += duplicates.length;

    // Rate limit between sources
    if (sources.indexOf(source) < sources.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log('\n--- Run complete ---');
  console.log(`Sources:    ${sources.length - stats.totalFailed} ok, ${stats.totalFailed} failed`);
  console.log(`Extracted:  ${stats.totalExtracted} events`);
  console.log(`Classified: ${stats.totalClassified} passed B2B filter`);
  if (!isDryRun) {
    console.log(`New:        ${stats.totalNew} inserted`);
    console.log(`Duplicates: ${stats.totalDupes} skipped`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
