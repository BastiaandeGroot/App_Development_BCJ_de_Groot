// Feed-vs-master-divergentie: vergelijkt de feed (wat de agent ziet) met de
// masterdata (Magento/PIM). Per veld: aanvulbaar uit master, echte lacune, of
// opgeplakt (schijnherstel). Levert ook een masterdata-kwaliteitssignaal.

import type {
  NormalizedProduct, Finding, MasterDataQuality, MasterFieldDivergence, QualityLabel,
} from './types.ts';
import { googleCategoryOf } from './checks/taxonomy.ts';

function hasAttr(p: NormalizedProduct, re: RegExp): boolean {
  return Object.entries(p.attributes).some(([k, v]) => re.test(k) && !!(v && v.trim()));
}

interface FieldDef {
  label: string;
  has: (p: NormalizedProduct) => boolean;
  feedOnly?: boolean; // veld dat alleen in de feed-laag hoort (master heeft het nooit)
  defaultable?: boolean; // veld dat vaak met een default wordt opgevuld
}

const FIELDS: FieldDef[] = [
  { label: 'merk', has: (p) => !!p.brand, defaultable: true },
  { label: 'GTIN/EAN', has: (p) => !!p.gtin },
  { label: 'Google-categorie', has: (p) => !!googleCategoryOf(p), feedOnly: true },
  { label: 'kleur', has: (p) => hasAttr(p, /kleur|colou?r/) },
  { label: 'maat/afmeting', has: (p) => hasAttr(p, /maat|size|breedte|hoogte|lengte/) },
  { label: 'materiaal', has: (p) => hasAttr(p, /materia|stof|fabric|samenstel/) },
  { label: 'prijs', has: (p) => p.priceAmount != null },
  { label: 'levertijd', has: (p) => !!p.deliveryTime },
];

function keyOf(p: NormalizedProduct) { return (p.sku || p.gtin || p.sourceId || '').trim(); }

function labelForScore(s: number): QualityLabel {
  if (s >= 85) return 'Sterk';
  if (s >= 65) return 'Hoog';
  if (s >= 40) return 'Middel';
  return 'Laag';
}

export function analyseDivergence(
  feed: NormalizedProduct[],
  master: NormalizedProduct[],
): MasterDataQuality {
  const mByKey = new Map<string, NormalizedProduct>();
  for (const p of master) { const k = keyOf(p); if (k) mByKey.set(k, p); }
  const pairs = feed.map((f) => ({ f, m: mByKey.get(keyOf(f)) })).filter((x) => x.m) as { f: NormalizedProduct; m: NormalizedProduct }[];
  const matched = pairs.length;

  const fields: MasterFieldDivergence[] = [];
  const findings: Finding[] = [];

  for (const def of FIELDS) {
    let feedHas = 0, both = 0, patched = 0, fixable = 0, realGap = 0, masterHas = 0;
    for (const { f, m } of pairs) {
      const fH = def.has(f); const mH = def.has(m);
      if (fH) feedHas++;
      if (mH) masterHas++;
      if (fH && mH) both++;
      else if (fH && !mH) patched++;
      else if (!fH && mH) fixable++;
      else realGap++;
    }
    const pct = (x: number) => (matched ? Math.round((x / matched) * 100) : 0);
    fields.push({
      field: def.label,
      feedPct: pct(feedHas), fromMasterPct: pct(both),
      patchedPct: pct(patched), fixablePct: pct(fixable), realGapPct: pct(realGap),
    });

    if (fixable > 0) {
      findings.push({
        code: `div.fixable.${def.label}`,
        severity: 'warn',
        field: def.label,
        message: `${def.label}: ${fixable} product(en) missen dit in de feed, maar het staat wél in de master → aanvulbaar via de feed-configuratie`,
        evidence: `${pct(fixable)}% van de gekoppelde producten`,
      });
    }
    if (def.defaultable && patched >= Math.max(10, matched * 0.2)) {
      findings.push({
        code: `div.patched.${def.label}`,
        severity: 'warn',
        field: def.label,
        message: `${def.label}: bij ${patched} product(en) is de feed gevuld terwijl de master leeg is → mogelijk schijnherstel (default/placeholder), geen echte masterdata`,
        evidence: `${pct(patched)}% opgeplakt`,
      });
    }
    if (def.feedOnly && feedHas > 0 && masterHas === 0) {
      findings.push({
        code: `div.feedonly.${def.label}`,
        severity: 'info',
        field: def.label,
        message: `${def.label} bestaat alleen in de feed, niet in de master. De logica leeft in de feed-tool i.p.v. in de bron (governance-risico).`,
      });
    }
  }

  // Masterdata-gezondheid: gemiddelde vulling van de master op agent-kritieke
  // velden (feed-only velden zoals Google-categorie tellen niet mee).
  const health = fields.filter((f) => f.field !== 'Google-categorie');
  const score = health.length
    ? Math.round(health.reduce((s, f) => s + (f.fromMasterPct + f.fixablePct), 0) / health.length)
    : 0;

  findings.unshift({
    code: 'div.masterhealth',
    severity: score < 55 ? 'warn' : 'info',
    field: 'masterdata',
    message: `Masterdata-gezondheid ${score}/100 op agent-kritieke velden. Hoe lager, hoe meer de feed gaten van de bron moet opvullen (fragiel: elk kanaal moet apart patchen).`,
    evidence: `${matched} gekoppelde producten`,
  });

  return { score, label: labelForScore(score), fields, findings };
}
