// Stelt het volledige feed-rapport samen: per product + feed-brede analyse.

import type {
  NormalizedProduct,
  FeedReport,
  FieldFillRate,
  Finding,
  ProductReport,
  QualityLabel,
} from './types.ts';
import { BASE_FIELDS } from './checks/product.ts';
import { buildProductReport, labelForScore } from './score.ts';
import { isValidGtin } from './normalize.ts';

function computeFillRates(products: NormalizedProduct[]): FieldFillRate[] {
  const total = products.length;
  return BASE_FIELDS.map((f) => {
    const filled = products.filter((p) => f.present(p)).length;
    return { field: f.label, filled, total, pct: total ? Math.round((filled / total) * 100) : 0 };
  }).sort((a, b) => a.pct - b.pct);
}

// Feed-brede bevindingen die je per product niet ziet (bv. dubbele identifiers).
function computeFeedFindings(products: NormalizedProduct[]): Finding[] {
  const findings: Finding[] = [];
  const total = products.length;

  // Dubbele GTIN's.
  const gtinCounts = new Map<string, number>();
  for (const p of products) if (p.gtin) gtinCounts.set(p.gtin, (gtinCounts.get(p.gtin) ?? 0) + 1);
  const dupGtins = [...gtinCounts.entries()].filter(([, n]) => n > 1);
  if (dupGtins.length > 0) {
    findings.push({
      code: 'feed.gtin.duplicates',
      severity: 'error',
      field: 'gtin',
      message: `${dupGtins.length} GTIN('s) komen op meerdere producten voor; GTIN's horen uniek te zijn`,
      evidence: dupGtins.slice(0, 5).map(([g, n]) => `${g}×${n}`).join(', '),
    });
  }

  // Ongeldige GTIN's.
  const invalid = products.filter((p) => p.gtin && !isValidGtin(p.gtin));
  if (invalid.length > 0) {
    findings.push({
      code: 'feed.gtin.invalid',
      severity: 'warn',
      field: 'gtin',
      message: `${invalid.length} product(en) met een ongeldige GTIN (lengte of checksum)`,
      evidence: invalid.slice(0, 5).map((p) => p.gtin).join(', '),
    });
  }

  // Dubbele SKU's.
  const skuCounts = new Map<string, number>();
  for (const p of products) if (p.sku) skuCounts.set(p.sku, (skuCounts.get(p.sku) ?? 0) + 1);
  const dupSkus = [...skuCounts.entries()].filter(([, n]) => n > 1);
  if (dupSkus.length > 0) {
    findings.push({
      code: 'feed.sku.duplicates',
      severity: 'warn',
      field: 'sku',
      message: `${dupSkus.length} SKU('s) komen meerdere keren voor`,
      evidence: dupSkus.slice(0, 5).map(([s, n]) => `${s}×${n}`).join(', '),
    });
  }

  // Lage vulgraad van agent-kritieke velden.
  for (const key of ['brand', 'gtin'] as const) {
    const spec = BASE_FIELDS.find((f) => f.key === key)!;
    const filled = products.filter((p) => spec.present(p)).length;
    const pct = total ? Math.round((filled / total) * 100) : 0;
    if (pct < 50) {
      findings.push({
        code: `feed.fillrate.${key}`,
        severity: 'warn',
        field: key,
        message: `${spec.label} is maar bij ${pct}% van de producten gevuld; dit beperkt matching en vergelijking door een agent`,
        evidence: `${filled}/${total}`,
      });
    }
  }
  return findings;
}

function summarize(
  overallLabel: QualityLabel,
  fillRates: FieldFillRate[],
  dist: Record<QualityLabel, number>,
  total: number,
): string {
  const weakest = fillRates.filter((f) => f.pct < 60).slice(0, 4).map((f) => `${f.field} (${f.pct}%)`);
  const parts = [
    `Feed-oordeel: ${overallLabel}.`,
    `Verdeling: Sterk ${dist.Sterk}, Hoog ${dist.Hoog}, Middel ${dist.Middel}, Laag ${dist.Laag} (van ${total}).`,
  ];
  if (weakest.length) parts.push(`Zwakste velden: ${weakest.join(', ')}.`);
  return parts.join(' ');
}

export function buildFeedReport(source: string, products: NormalizedProduct[]): FeedReport {
  const productReports: ProductReport[] = products.map(buildProductReport);
  const total = products.length;

  const dist: Record<QualityLabel, number> = { Laag: 0, Middel: 0, Hoog: 0, Sterk: 0 };
  for (const r of productReports) dist[r.label]++;

  const avg = total ? Math.round(productReports.reduce((s, r) => s + r.score, 0) / total) : 0;
  const fillRates = computeFillRates(products);
  const feedFindings = computeFeedFindings(products);
  const overallLabel = labelForScore(avg, feedFindings.some((f) => f.severity === 'error'));

  return {
    source,
    generatedAt: new Date().toISOString(),
    productCount: total,
    overall: { label: overallLabel, score: avg, summary: summarize(overallLabel, fillRates, dist, total) },
    fillRates,
    feedFindings,
    labelDistribution: dist,
    products: productReports,
  };
}
