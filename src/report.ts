// Stelt het volledige feed-rapport samen: per product + feed-brede analyse.

import type {
  NormalizedProduct,
  FeedReport,
  FieldFillRate,
  Finding,
  ProductReport,
  QualityLabel,
  CategoryBreakdown,
} from './types.ts';
import { BASE_FIELDS } from './checks/product.ts';
import { buildProductReport, labelForScore, sortFindings } from './score.ts';
import { isValidGtin } from './normalize.ts';
import { googleCategoryOf } from './checks/taxonomy.ts';
import { aggregateConstraints, labelForCoverage } from './constraints.ts';
import { auditTaxonomy } from './checks/taxonomyAudit.ts';
import { detectPlaceholders } from './checks/placeholders.ts';
import { analyseDivergence } from './divergence.ts';
import type { TaxonomyIndex } from './taxonomyData.ts';

// Versie van de rapportagestandaard (docs/reportingstandard.md).
export const REPORT_VERSION = '1.1';

// Stabiele productvolgorde op id: numeriek waar mogelijk, anders alfabetisch.
function compareIds(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b);
}

function computeFillRates(products: NormalizedProduct[]): FieldFillRate[] {
  const total = products.length;
  return BASE_FIELDS.map((f) => {
    const filled = products.filter((p) => f.present(p)).length;
    return { field: f.label, filled, total, pct: total ? Math.round((filled / total) * 100) : 0 };
  }).sort((a, b) => a.pct - b.pct || a.field.localeCompare(b.field));
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

// Onderverdeling naar de eigen categorie-indeling van de webshop (product_type).
function computeCategories(
  products: NormalizedProduct[],
  reports: ProductReport[],
): CategoryBreakdown[] {
  const groups = new Map<string, { reports: ProductReport[]; products: NormalizedProduct[] }>();
  reports.forEach((r, i) => {
    const key = r.category ?? '(zonder categorie)';
    if (!groups.has(key)) groups.set(key, { reports: [], products: [] });
    const g = groups.get(key)!;
    g.reports.push(r);
    if (products[i]) g.products.push(products[i]);
  });

  const out: CategoryBreakdown[] = [];
  for (const [category, g] of groups) {
    const n = g.reports.length;
    const avgScore = Math.round(g.reports.reduce((s, r) => s + r.score, 0) / n);
    const avgCoverage = Math.round(g.reports.reduce((s, r) => s + r.constraintCoverage.score, 0) / n);
    const withGoogle = g.products.filter((p) => !!googleCategoryOf(p)).length;
    out.push({
      category,
      productCount: n,
      avgScore,
      label: labelForScore(avgScore, false),
      avgCoverage,
      coverageLabel: labelForCoverage(avgCoverage),
      googleCategoryPct: g.products.length ? Math.round((withGoogle / g.products.length) * 100) : 0,
    });
  }
  // Zwakste categorieën eerst; dat is waar de meeste winst zit.
  return out.sort((a, b) => a.avgScore - b.avgScore || b.productCount - a.productCount);
}

// Feed-brede taxonomiebevindingen (meetlat 2, deel A).
function computeTaxonomyFeed(products: NormalizedProduct[]): {
  findings: Finding[];
  googleCategoryFillPct: number;
} {
  const total = products.length;
  const withGoogle = products.filter((p) => !!googleCategoryOf(p)).length;
  const pct = total ? Math.round((withGoogle / total) * 100) : 0;
  const findings: Finding[] = [];
  if (pct < 100) {
    findings.push({
      code: 'feed.taxonomy.google_category',
      severity: pct === 0 ? 'error' : 'warn',
      field: 'google_product_category',
      message: `Google Product Category is bij ${pct}% van de producten aanwezig; zonder mapping naar de officiële taxonomie is filteren/vergelijken door externe kanalen en agents onbetrouwbaar`,
      evidence: `${withGoogle}/${total}`,
    });
  }
  return { findings, googleCategoryFillPct: pct };
}

export function buildFeedReport(
  source: string,
  products: NormalizedProduct[],
  master?: NormalizedProduct[],
  taxonomyIndex?: TaxonomyIndex,
): FeedReport {
  const productReports: ProductReport[] = products.map(buildProductReport);
  const total = products.length;

  const dist: Record<QualityLabel, number> = { Laag: 0, Middel: 0, Hoog: 0, Sterk: 0 };
  for (const r of productReports) dist[r.label]++;

  const avg = total ? Math.round(productReports.reduce((s, r) => s + r.score, 0) / total) : 0;
  const fillRates = computeFillRates(products);
  // Feed-brede bevindingen + schijn-volledigheid (placeholders/defaults).
  const feedFindings = sortFindings([...computeFeedFindings(products), ...detectPlaceholders(products)]);
  const overallLabel = labelForScore(avg, feedFindings.some((f) => f.severity === 'error'));
  const taxonomyRaw = computeTaxonomyFeed(products);
  const taxonomy = { ...taxonomyRaw, findings: sortFindings(taxonomyRaw.findings) };
  const taxonomyAudit = auditTaxonomy(products, taxonomyIndex);
  taxonomyAudit.findings = sortFindings(taxonomyAudit.findings);
  const constraintCoverage = aggregateConstraints(productReports.map((r) => r.constraintCoverage));
  const masterQuality = master && master.length > 0
    ? (() => { const q = analyseDivergence(products, master); q.findings = sortFindings(q.findings); return q; })()
    : undefined;

  // Onderverdeling per eigen categorie (vóór het sorteren, zodat de index van
  // productReports nog overeenkomt met die van products).
  const categories = computeCategories(products, productReports);

  // Stabiele productvolgorde op id (rapportagestandaard §6).
  productReports.sort((a, b) => compareIds(a.id, b.id));

  return {
    reportVersion: REPORT_VERSION,
    source,
    generatedAt: new Date().toISOString(),
    productCount: total,
    overall: { label: overallLabel, score: avg, summary: summarize(overallLabel, fillRates, dist, total) },
    fillRates,
    feedFindings,
    taxonomy,
    constraintCoverage,
    taxonomyAudit,
    masterQuality,
    categories,
    labelDistribution: dist,
    products: productReports,
  };
}
