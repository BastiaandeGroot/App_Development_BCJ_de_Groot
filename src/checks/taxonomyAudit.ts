// Feed-brede taxonomie-audit (docs/taxonomyandconstraints.md, C1–C11).
// Met het officiële Google-taxonomiebestand (TaxonomyIndex) worden C2 (validatie)
// en C4 (exacte diepte) uitgevoerd — ook voor ID-notatie. Zonder index vallen we
// terug op formaat-/heuristische checks.

import type { NormalizedProduct, Finding, TaxonomyAudit } from '../types.ts';
import { googleCategoryOf } from './taxonomy.ts';
import { resolveCategory, type TaxonomyIndex } from '../taxonomyData.ts';

const isId = (v: string) => /^\d+$/.test(v);
const isPath = (v: string) => v.includes('>');

export function auditTaxonomy(products: NormalizedProduct[], index?: TaxonomyIndex): TaxonomyAudit {
  const n = products.length;
  const findings: Finding[] = [];
  const values = products.map((p) => googleCategoryOf(p)).filter((v): v is string => !!v);
  const withCat = values.length;
  const fillPct = n ? Math.round((withCat / n) * 100) : 0;

  // C1 — vulgraad.
  if (fillPct < 100) {
    findings.push({
      code: 'tax.C1.fill', severity: fillPct === 0 ? 'error' : 'warn', field: 'google_product_category',
      message: `Google Product Category ontbreekt bij ${100 - fillPct}% van de producten`,
      evidence: `${withCat}/${n} gevuld`,
    });
  }

  // C3 — notatieconsistentie.
  const ids = values.filter(isId).length;
  const paths = values.filter(isPath).length;
  const notation: TaxonomyAudit['notation'] = withCat === 0 ? 'none' : ids === withCat ? 'id' : paths === withCat ? 'path' : 'mixed';
  if (notation === 'mixed') {
    findings.push({
      code: 'tax.C3.notation', severity: 'warn', field: 'google_product_category',
      message: 'Gemengde notatie: sommige producten gebruiken een categorie-ID, andere een pad. Kies één consistente notatie.',
      evidence: `${ids} ID's, ${paths} paden`,
    });
  }

  // C5 — meerdere waarden in één veld.
  const multi = values.filter((v) => /[;,]/.test(v)).length;
  if (multi > 0) {
    findings.push({
      code: 'tax.C5.multiple', severity: 'warn', field: 'google_product_category',
      message: `${multi} product(en) hebben meerdere categoriewaarden in één veld; er mag er precies één zijn`,
    });
  }

  // C2 — validatie tegen de officiële taxonomie (indien beschikbaar), anders formaat.
  if (index) {
    const invalid = values.filter((v) => !resolveCategory(index, v).valid).length;
    if (invalid > 0) {
      findings.push({
        code: 'tax.C2.invalid', severity: 'error', field: 'google_product_category',
        message: `${invalid} categorie-waarde(n) komen niet voor in de officiële Google-taxonomie (${index.version})`,
      });
    }
  } else {
    const badFormat = values.filter((v) => !isId(v) && !isPath(v)).length;
    if (badFormat > 0) {
      findings.push({
        code: 'tax.C2.format', severity: 'warn', field: 'google_product_category',
        message: `${badFormat} categorie-waarde(n) zijn geen geldig ID of volledig pad`,
      });
    }
  }

  // Verdeling (voor C7).
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const distinctValues = counts.size;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topShare = withCat ? Math.round(((top?.[1] ?? 0) / withCat) * 100) : 0;
  const topResolved = top && index ? resolveCategory(index, top[0]) : undefined;
  const topLabel = topResolved?.path ? `${top![0]} = ${topResolved.path}` : top?.[0];

  // C4 — specificiteit / diepte.
  if (index) {
    const shallow = values.filter((v) => { const r = resolveCategory(index, v); return r.valid && (r.depth ?? 0) <= 2; }).length;
    if (shallow > 0) {
      findings.push({
        code: 'tax.C4.depth', severity: 'warn', field: 'google_product_category',
        message: `${shallow} product(en) staan op een te breed niveau (1–2); classificeer zo specifiek mogelijk (niveau 3+)`,
      });
    }
  } else if (notation === 'path') {
    const shallow = values.filter((v) => v.split('>').filter((s) => s.trim()).length <= 2).length;
    if (shallow > 0) {
      findings.push({
        code: 'tax.C4.depth', severity: 'warn', field: 'google_product_category',
        message: `${shallow} product(en) staan op een te breed niveau (1–2)`,
      });
    }
  } else if (notation === 'id') {
    findings.push({
      code: 'tax.C4.depth_unknown', severity: 'info', field: 'google_product_category',
      message: 'Categorieën staan als ID genoteerd; lever het officiële Google-taxonomiebestand aan om diepte/geldigheid exact te bepalen.',
    });
  }

  // C7 — spreiding/concentratie, mét context.
  if (topShare >= 60 && distinctValues <= 5) {
    const topDepth = topResolved?.depth ?? 0;
    if (index && topResolved?.valid && topDepth >= 3) {
      // Concentratie op een diepe, geldige node: passend bij een gespecialiseerde shop.
      findings.push({
        code: 'tax.C7.concentrated_ok', severity: 'info', field: 'google_product_category',
        message: `${topShare}% van de producten valt onder één specifieke, geldige categorie (niveau ${topDepth}). Voor een gespecialiseerde webshop is dat passend, geen bulk-probleem.`,
        evidence: topLabel,
      });
    } else {
      findings.push({
        code: 'tax.C7.bulk', severity: 'warn', field: 'google_product_category',
        message: `${topShare}% van de producten hangt onder dezelfde categorie (${distinctValues} verschillende in totaal)${index ? ' op een te breed niveau' : ''}; indicatie van bulk-toewijzing i.p.v. specifieke classificatie`,
        evidence: topLabel,
      });
    }
  }

  // C11 — eigen categoriestructuur (product_type).
  const withType = products.filter((p) => p.categories.length > 0).length;
  const productTypeFillPct = n ? Math.round((withType / n) * 100) : 0;
  if (productTypeFillPct < 90) {
    findings.push({
      code: 'tax.C11.product_type', severity: 'info', field: 'product_type',
      message: `Eigen categoriestructuur (product_type) is bij ${productTypeFillPct}% gevuld`,
    });
  }

  return { findings, googleCategoryFillPct: fillPct, notation, distinctValues, topShare, productTypeFillPct };
}
