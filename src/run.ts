// CLI-runner: lees één of twee bronbestanden, combineer ze en analyseer de feed.
//
// Gebruik:
//   node src/run.ts <feed.csv> [master.json] [--json uit.json] [--combined comb.json] [--max N]
//
// De feed (Channable CSV) is primair. Een optionele master (Magento/PIM JSON)
// wordt bijgekoppeld op SKU/EAN. Zonder argumenten draait het op de voorbeeldfeed.

import { readFileSync, writeFileSync } from 'node:fs';
import { ingest } from './intake.ts';
import { combineSources } from './merge.ts';
import { buildFeedReport } from './report.ts';
import type { FeedReport, Finding } from './types.ts';

function parseArgs(argv: string[]) {
  const args = { inputs: [] as string[], json: '', combined: '', max: 5 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') args.json = argv[++i];
    else if (argv[i] === '--combined') args.combined = argv[++i];
    else if (argv[i] === '--max') args.max = Number(argv[++i]);
    else args.inputs.push(argv[i]);
  }
  if (args.inputs.length === 0) args.inputs = ['fixtures/sample_feed.json'];
  return args;
}

const ICON: Record<Finding['severity'], string> = { error: '✗', warn: '!', info: 'i', ok: '✓' };

function bar(pct: number, width = 20): string {
  const n = Math.round((pct / 100) * width);
  return '█'.repeat(n) + '░'.repeat(width - n);
}

function printReport(r: FeedReport, maxProducts: number): void {
  const line = '─'.repeat(64);
  console.log(line);
  console.log('  AGENTIC COMMERCE — PRODUCTDATA READINESS');
  console.log(line);
  console.log(`Rapportversie: ${r.reportVersion}`);
  console.log(`Bron:        ${r.source}`);
  console.log(`Producten:   ${r.productCount}`);
  console.log(`Oordeel:     ${r.overall.label}  (score ${r.overall.score}/100)`);
  console.log(`Samenvatting:${' '}${r.overall.summary}`);

  console.log(`\nVulgraad basisvelden (oplopend):`);
  for (const f of r.fillRates) {
    console.log(`  ${bar(f.pct)} ${String(f.pct).padStart(3)}%  ${f.field}`);
  }

  if (r.feedFindings.length) {
    console.log(`\nFeed-brede bevindingen (volledigheid & identifiers):`);
    for (const f of r.feedFindings) {
      console.log(`  [${ICON[f.severity]}] ${f.message}${f.evidence ? `  (${f.evidence})` : ''}`);
    }
  }

  // Meetlat 2A: taxonomie-audit (C1–C11-subset).
  const ta = r.taxonomyAudit;
  console.log(`\nTaxonomie-audit (Google-categorie ${ta.googleCategoryFillPct}%, notatie: ${ta.notation}, ${ta.distinctValues} verschillende waarden, top ${ta.topShare}%):`);
  for (const f of ta.findings) {
    console.log(`  [${ICON[f.severity]}] ${f.message}${f.evidence ? `  (${f.evidence})` : ''}`);
  }
  if (ta.findings.length === 0) console.log('  [✓] geen taxonomie-problemen');

  // Meetlat 2B: constraint coverage (feed-breed).
  const cc = r.constraintCoverage;
  console.log(`\nConstraint coverage (kan een agent klantvragen beantwoorden?): ${cc.label}  (score ${cc.score}/100)`);
  console.log(`  Ja ${cc.counts.Ja} · Deels ${cc.counts.Deels} · Nee ${cc.counts.Nee} · Indicatief ${cc.counts.Indicatief}  (van ${cc.total} constraints)`);
  if (cc.topGaps.length) console.log(`  Grootste gaten: ${cc.topGaps.join('; ')}`);

  console.log(`\nVoorbeelden (eerste ${Math.min(maxProducts, r.products.length)} producten):`);
  for (const p of r.products.slice(0, maxProducts)) {
    console.log(`\n  • ${p.id}  ${p.title ?? ''}`);
    console.log(`    → volledigheid: ${p.label} (${p.score}/100) | constraint coverage: ${p.constraintCoverage.label} (${p.constraintCoverage.score}/100, beantwoordbaar ${p.constraintCoverage.answerableRatio})`);
    const all = [...p.findings, ...p.taxonomy];
    for (const f of all) {
      console.log(`      [${ICON[f.severity]}] ${f.message}${f.evidence ? `  (${f.evidence})` : ''}`);
    }
    if (all.length === 0) console.log('      geen bevindingen');
  }
  console.log('\n' + line);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  // Lees en detecteer elk bestand (feed of master).
  let feed = null as ReturnType<typeof ingest> | null;
  let master = null as ReturnType<typeof ingest> | null;
  for (const path of args.inputs) {
    let intake;
    try {
      intake = ingest(path, readFileSync(path, 'utf8'));
    } catch (e) {
      console.error(`Kan bestand niet lezen/parsen: ${path}\n${(e as Error).message}`);
      process.exit(1);
    }
    if (intake.kind === 'feed') feed = intake;
    else master = intake;
    console.log(`Ingelezen: ${path} → ${intake.kind === 'feed' ? 'FEED' : 'MASTERDATA'} (${intake.products.length} producten)`);
  }

  const merged = combineSources(feed, master);
  if (merged.primary.length === 0) {
    console.error('Geen producten gevonden.');
    process.exit(1);
  }

  // Combineersamenvatting tonen als beide bronnen aanwezig zijn.
  if (feed && master) {
    const s = merged.summary;
    console.log('\n── Bronnen gecombineerd (koppeling op SKU/EAN) ──');
    console.log(`  gekoppeld: ${s.matched} · alleen feed: ${s.onlyFeed} · alleen master: ${s.onlyMaster} · EAN-conflicten: ${s.eanConflicts}`);
  }

  const source = feed?.source ?? master?.source ?? 'onbekend';
  const masterProducts = merged.primaryKind === 'feed' && master ? master.products : undefined;
  const report = buildFeedReport(`${source} [${merged.primaryKind}]`, merged.primary, masterProducts);
  printReport(report, args.max);

  if (report.masterQuality) {
    const mq = report.masterQuality;
    console.log(`\nMasterdata-kwaliteit: ${mq.label} (${mq.score}/100)`);
    for (const f of mq.findings) {
      console.log(`  [${ICON[f.severity]}] ${f.message}${f.evidence ? `  (${f.evidence})` : ''}`);
    }
  }

  if (args.json) {
    writeFileSync(args.json, JSON.stringify(report, null, 2));
    console.log(`Volledig JSON-rapport geschreven naar: ${args.json}`);
  }
  if (args.combined) {
    writeFileSync(args.combined, JSON.stringify(merged.combined, null, 2));
    console.log(`Gecombineerd databestand geschreven naar: ${args.combined}`);
  }
}

main();
