// Constraint coverage (docs/taxonomyandconstraints.md).
//
// Aanpak: een bibliotheek van constraints (universeel + policy + categorie).
// Per constraint bepalen we of die BEANTWOORDBAAR is uit de beschikbare data:
//   Ja        = volledig uit gestructureerde data
//   Deels     = alleen uit vrije tekst / onvolledig
//   Nee       = niet uit de data
//   Indicatief= alleen met aannames af te leiden
//
// De categorie-constraints zijn INDICATIEF: bij gebrek aan echte klantvragen
// (zoeklogs, reviews, Q&A) genereren we ze op basis van de categorie, precies
// zoals het document toestaat. De AI-laag kan dit later vervangen door echte,
// categoriespecifieke klantvragen.

import type {
  NormalizedProduct,
  ConstraintResult,
  ConstraintCoverage,
  Answerability,
  QualityLabel,
} from './types.ts';
import { googleCategoryOf } from './checks/taxonomy.ts';

interface Resolution {
  answerable: Answerability;
  reason?: string;
  evidence?: string;
}

interface Constraint {
  id: string;
  label: string;
  group: ConstraintResult['group'];
  intent?: string;
  indicative?: boolean;
  resolve: (p: NormalizedProduct) => Resolution;
}

// --- Resolver-helpers -------------------------------------------------------

function present<T>(v: T | undefined | null): boolean {
  return !(v === undefined || v === null || (typeof v === 'string' && v.trim() === ''));
}

// Beantwoordbaar uit een gestructureerd veld, anders "Nee".
function fromField(get: (p: NormalizedProduct) => unknown, missingReason: string) {
  return (p: NormalizedProduct): Resolution => {
    const v = get(p);
    if (present(v)) return { answerable: 'Ja', evidence: String(v).slice(0, 60) };
    return { answerable: 'Nee', reason: missingReason };
  };
}

function findAttr(p: NormalizedProduct, keyPattern: RegExp): [string, string] | undefined {
  for (const [k, v] of Object.entries(p.attributes)) {
    if (keyPattern.test(k) && present(v)) return [k, v];
  }
  return undefined;
}

function textMentions(p: NormalizedProduct, words: RegExp): boolean {
  const hay = `${p.title ?? ''} ${p.descriptionText ?? ''} ${p.shortDescription ?? ''}`;
  return words.test(hay);
}

// Gestructureerd attribuut -> Ja; alleen in vrije tekst -> Deels; anders Nee.
function fromAttrOrText(keyPattern: RegExp, textWords: RegExp) {
  return (p: NormalizedProduct): Resolution => {
    const attr = findAttr(p, keyPattern);
    if (attr) return { answerable: 'Ja', evidence: `${attr[0]}=${attr[1]}`.slice(0, 60) };
    if (textMentions(p, textWords))
      return { answerable: 'Deels', reason: 'attribuut staat alleen in vrije tekst' };
    return { answerable: 'Nee', reason: 'attribuut ontbreekt' };
  };
}

// --- Constraint-bibliotheek -------------------------------------------------

const CONSTRAINTS: Constraint[] = [
  // Universeel
  {
    id: 'u.price', label: 'Wat kost dit product (incl. valuta)?', group: 'universeel', intent: 'prijs vergelijken',
    resolve: (p) => (present(p.priceAmount) && present(p.currency)
      ? { answerable: 'Ja', evidence: `${p.priceAmount} ${p.currency}` }
      : { answerable: present(p.priceAmount) ? 'Deels' : 'Nee', reason: present(p.priceAmount) ? 'valuta ontbreekt' : 'prijs ontbreekt' }),
  },
  {
    id: 'u.stock', label: 'Is dit product op voorraad?', group: 'universeel', intent: 'voorraad controleren',
    resolve: fromField((p) => p.stockQty, 'voorraad of levertijd ontbreekt'),
  },
  {
    id: 'u.availability', label: 'Is dit product beschikbaar/leverbaar?', group: 'universeel', intent: 'voorraad controleren',
    resolve: (p) => (p.availability && p.availability !== 'unknown'
      ? { answerable: 'Ja', evidence: p.availability }
      : { answerable: 'Nee', reason: 'beschikbaarheid ontbreekt of niet genormaliseerd' }),
  },
  {
    id: 'u.brand', label: 'Van welk merk is dit product?', group: 'universeel', intent: 'vergelijken',
    resolve: fromField((p) => p.brand, 'attribuut ontbreekt'),
  },
  {
    id: 'u.identifier', label: 'Kan dit product uniek gematcht worden (GTIN/EAN)?', group: 'universeel', intent: 'vergelijken',
    resolve: fromField((p) => p.gtin, 'GTIN/EAN ontbreekt'),
  },
  {
    id: 'u.category', label: 'In welke (Google) categorie valt dit product?', group: 'universeel', intent: 'filteren',
    resolve: (p) => {
      if (googleCategoryOf(p)) return { answerable: 'Ja', evidence: googleCategoryOf(p) };
      if (p.categories.length > 0)
        return { answerable: 'Deels', reason: 'eigen categoriepad zonder mapping naar Google-taxonomie', evidence: p.mainCategoryPath ?? p.categories[0]?.path };
      return { answerable: 'Nee', reason: 'categorie ontbreekt' };
    },
  },

  // Policy (uit §Policyvragen) — cruciaal voor vertrouwen en aanbevelingen.
  { id: 'p.delivery', label: 'Wat is de levertijd?', group: 'policy', intent: 'levertijd controleren', resolve: fromField((p) => p.deliveryTime, 'voorraad of levertijd ontbreekt') },
  { id: 'p.shippingcost', label: 'Wat zijn de verzendkosten?', group: 'policy', intent: 'policyvraag', resolve: fromAttrOrText(/verzend|shipping.*cost|shipping_fee/, /verzendkost|gratis verzend|shipping/i) },
  { id: 'p.returnterm', label: 'Wat is de retourtermijn?', group: 'policy', intent: 'retourrisico inschatten', resolve: fromField((p) => p.returnInfo, 'policydata is niet machineleesbaar') },
  { id: 'p.returnconds', label: 'Wat zijn de retourvoorwaarden?', group: 'policy', intent: 'retourrisico inschatten', resolve: fromField((p) => p.returnInfo, 'policydata is niet machineleesbaar') },
  { id: 'p.warranty', label: 'Welke garantie geldt er?', group: 'policy', intent: 'garantie begrijpen', resolve: fromField((p) => p.warranty, 'policydata is niet machineleesbaar') },
  { id: 'p.compat', label: 'Waarmee is dit product compatibel?', group: 'policy', intent: 'compatibiliteit controleren', resolve: fromAttrOrText(/compat|geschikt.*voor|passend/, /compatibel|geschikt voor|past (op|bij)/i) },
  { id: 'p.sizing', label: 'Is er maatadvies?', group: 'policy', intent: 'maat of pasvorm bepalen', resolve: fromAttrOrText(/maatadvies|size.?guide|pasvorm|fit/, /maatadvies|valt (klein|groot)|pasvorm/i) },

  // Categorie-relevant — INDICATIEF gegenereerd o.b.v. categorie.
  { id: 'c.material', label: 'Van welk materiaal/samenstelling is het?', group: 'categorie', intent: 'geschiktheid', indicative: true, resolve: fromAttrOrText(/materia|stof|samenstel|fabric|composition/, /materiaal|katoen|polyester|wol|linnen|\d+%\s*(katoen|polyester)/i) },
  { id: 'c.color', label: 'Welke kleur heeft het?', group: 'categorie', intent: 'filteren', indicative: true, resolve: fromAttrOrText(/kleur|colou?r/, /\b(zwart|wit|blauw|rood|groen|grijs|beige)\b/i) },
  { id: 'c.dimensions', label: 'Wat zijn de afmetingen/maat?', group: 'categorie', intent: 'maat of pasvorm bepalen', indicative: true, resolve: fromAttrOrText(/maat|size|breedte|hoogte|afmeting|lengte|width|height/, /\b\d+\s?cm\b|breedte|afmeting/i) },
  { id: 'c.weight', label: 'Wat is het gewicht?', group: 'categorie', intent: 'vergelijken', indicative: true, resolve: fromAttrOrText(/gewicht|weight/, /\b\d+\s?(g|kg|gram|g\/m)/i) },
];

// --- Aggregatie -------------------------------------------------------------

const WEIGHT: Record<Answerability, number> = { Ja: 1, Deels: 0.5, Indicatief: 0.25, Nee: 0 };

function labelForCoverage(score: number): QualityLabel {
  if (score >= 85) return 'Sterk';
  if (score >= 65) return 'Hoog';
  if (score >= 40) return 'Middel';
  return 'Laag';
}

export function evaluateConstraints(p: NormalizedProduct): ConstraintCoverage {
  const results: ConstraintResult[] = CONSTRAINTS.map((c) => {
    const r = c.resolve(p);
    return {
      id: c.id, label: c.label, group: c.group, intent: c.intent, indicative: c.indicative,
      answerable: r.answerable, reason: r.reason, evidence: r.evidence,
    };
  });

  const counts: Record<Answerability, number> = { Ja: 0, Deels: 0, Nee: 0, Indicatief: 0 };
  for (const r of results) counts[r.answerable]++;
  const total = results.length;
  const weighted = results.reduce((s, r) => s + WEIGHT[r.answerable], 0);
  const score = total ? Math.round((weighted / total) * 100) : 0;

  const topGaps = results
    .filter((r) => r.answerable === 'Nee' || r.answerable === 'Deels')
    .sort((a, b) => (a.answerable === 'Nee' ? 0 : 1) - (b.answerable === 'Nee' ? 0 : 1))
    .slice(0, 6)
    .map((r) => `${r.label} (${r.answerable}${r.reason ? ': ' + r.reason : ''})`);

  return {
    results,
    counts,
    total,
    answerableRatio: `${counts.Ja}/${total}`,
    score,
    label: labelForCoverage(score),
    topGaps,
  };
}

// Feed-brede coverage: gemiddelde per constraint over alle producten.
export function aggregateConstraints(perProduct: ConstraintCoverage[]): ConstraintCoverage {
  const n = perProduct.length;
  if (n === 0) {
    return { results: [], counts: { Ja: 0, Deels: 0, Nee: 0, Indicatief: 0 }, total: 0, answerableRatio: '0/0', score: 0, label: 'Laag', topGaps: [] };
  }

  // Per constraint: het meest voorkomende (dominante) antwoord over de feed.
  const byId = new Map<string, ConstraintResult[]>();
  for (const cov of perProduct) for (const r of cov.results) {
    if (!byId.has(r.id)) byId.set(r.id, []);
    byId.get(r.id)!.push(r);
  }

  const results: ConstraintResult[] = [];
  for (const [, rs] of byId) {
    const tally: Record<Answerability, number> = { Ja: 0, Deels: 0, Nee: 0, Indicatief: 0 };
    for (const r of rs) tally[r.answerable]++;
    const dominant = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]) as Answerability;
    const base = rs[0];
    const pctJa = Math.round((tally.Ja / rs.length) * 100);
    results.push({
      id: base.id, label: base.label, group: base.group, intent: base.intent, indicative: base.indicative,
      answerable: dominant,
      reason: base.reason,
      evidence: `Ja bij ${pctJa}% van de producten`,
    });
  }

  const counts: Record<Answerability, number> = { Ja: 0, Deels: 0, Nee: 0, Indicatief: 0 };
  for (const r of results) counts[r.answerable]++;
  const total = results.length;
  const avgScore = Math.round(perProduct.reduce((s, c) => s + c.score, 0) / n);

  const topGaps = results
    .filter((r) => r.answerable === 'Nee' || r.answerable === 'Deels')
    .map((r) => `${r.label} (${r.answerable})`)
    .slice(0, 6);

  return {
    results,
    counts,
    total,
    answerableRatio: `${counts.Ja}/${total}`,
    score: avgScore,
    label: labelForCoverage(avgScore),
    topGaps,
  };
}
