// CLI-runner: lees een feed-bestand, voer de analyse uit en print een rapport.
//
// Gebruik:
//   node src/run.ts [pad-naar-feed.json] [--json uit.json] [--max N]
//
// Standaard draait het op fixtures/sample_feed.json.

import { readFileSync, writeFileSync } from 'node:fs';
import { adaptChannableFeed } from './adapters/channable.ts';
import { buildFeedReport } from './report.ts';
import type { FeedReport, Finding } from './types.ts';

function parseArgs(argv: string[]) {
  const args = { input: 'fixtures/sample_feed.json', json: '', max: 5 };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') args.json = argv[++i];
    else if (argv[i] === '--max') args.max = Number(argv[++i]);
    else rest.push(argv[i]);
  }
  if (rest[0]) args.input = rest[0];
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

  // Meetlat 2A: taxonomie.
  console.log(`\nTaxonomie (Google Product Category bij ${r.taxonomy.googleCategoryFillPct}% van de producten):`);
  for (const f of r.taxonomy.findings) {
    console.log(`  [${ICON[f.severity]}] ${f.message}${f.evidence ? `  (${f.evidence})` : ''}`);
  }
  if (r.taxonomy.findings.length === 0) console.log('  [✓] alle producten hebben een Google-categorie');

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
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(args.input, 'utf8'));
  } catch (e) {
    console.error(`Kan feed niet lezen/parsen: ${args.input}\n${(e as Error).message}`);
    process.exit(1);
  }

  const { source, products } = adaptChannableFeed(json);
  if (products.length === 0) {
    console.error('Geen producten gevonden in de feed. Is dit een Channable/Magento-JSON met een "products"-array?');
    process.exit(1);
  }

  const report = buildFeedReport(source, products);
  printReport(report, args.max);

  if (args.json) {
    writeFileSync(args.json, JSON.stringify(report, null, 2));
    console.log(`Volledig JSON-rapport geschreven naar: ${args.json}`);
  }
}

main();
