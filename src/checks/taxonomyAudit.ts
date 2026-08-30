// Feed-brede taxonomie-audit (docs/taxonomyandconstraints.md, C1–C11).
// Deterministisch waar mogelijk zonder het officiële Google-taxonomiebestand;
// checks die dat bestand vereisen (exacte validatie C2, exacte diepte per ID C4)
// worden expliciet als "nog te valideren" gemarkeerd.

import type { NormalizedProduct, Finding, TaxonomyAudit } from '../types.ts';
import { googleCategoryOf } from './taxonomy.ts';

const isId = (v: string) => /^\d+$/.test(v);
const isPath = (v: string) => v.includes('>');

export function auditTaxonomy(products: NormalizedProduct[]): TaxonomyAudit {
  const n = products.length;
  const findings: Finding[] = [];
  const values = products.map((p) => googleCategoryOf(p)).filter((v): v is string => !!v);
  const withCat = values.length;
  const fillPct = n ? Math.round((withCat / n) * 100) : 0;

  // C1 — vulgraad google_product_category.
  if (fillPct < 100) {
    findings.push({
      code: 'tax.C1.fill',
      severity: fillPct === 0 ? 'error' : 'warn',
      field: 'google_product_category',
      message: `Google Product Category ontbreekt bij ${100 - fillPct}% van de producten`,
      evidence: `${withCat}/${n} gevuld`,
    });
  }

  // C3 — notatieconsistentie (ID vs pad vs gemengd).
  const ids = values.filter(isId).length;
  const paths = values.filter(isPath).length;
  const notation: TaxonomyAudit['notation'] = withCat === 0 ? 'none' : ids === withCat ? 'id' : paths === withCat ? 'path' : 'mixed';
  if (notation === 'mixed') {
    findings.push({
      code: 'tax.C3.notation',
      severity: 'warn',
      field: 'google_product_category',
      message: 'Gemengde notatie: sommige producten gebruiken een categorie-ID, andere een pad. Kies één consistente notatie.',
      evidence: `${ids} ID's, ${paths} paden`,
    });
  }

  // C5 — meer dan één categoriewaarde in het veld.
  const multi = values.filter((v) => /[;,]/.test(v)).length;
  if (multi > 0) {
    findings.push({
      code: 'tax.C5.multiple',
      severity: 'warn',
      field: 'google_product_category',
      message: `${multi} product(en) hebben meerdere categoriewaarden in één veld; er mag er precies één zijn`,
    });
  }

  // C2 (light) — formaatgeldigheid (numeriek ID of pad met " > ").
  const badFormat = values.filter((v) => !isId(v) && !isPath(v)).length;
  if (badFormat > 0) {
    findings.push({
      code: 'tax.C2.format',
      severity: 'warn',
      field: 'google_product_category',
      message: `${badFormat} categorie-waarde(n) zijn geen geldig ID of volledig pad`,
    });
  }

  // C7 — spreiding / bulk-toewijzing.
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const distinctValues = counts.size;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topShare = withCat ? Math.round(((top?.[1] ?? 0) / withCat) * 100) : 0;
  if (topShare >= 60 && distinctValues <= 5) {
    findings.push({
      code: 'tax.C7.bulk',
      severity: 'warn',
      field: 'google_product_category',
      message: `${topShare}% van de producten hangt onder dezelfde categorie (${distinctValues} verschillende in totaal); sterke indicatie van bulk-toewijzing i.p.v. specifieke classificatie`,
      evidence: top ? `waarde "${top[0]}" ×${top[1]}` : undefined,
    });
  }

  // C4 — specificiteit. Voor pad-waarden meten we de diepte; voor ID's kan dat
  // niet zonder het officiële bestand.
  if (notation === 'path') {
    const shallow = values.filter((v) => v.split('>').filter((s) => s.trim()).length <= 2).length;
    if (shallow > 0) {
      findings.push({
        code: 'tax.C4.depth',
        severity: 'warn',
        field: 'google_product_category',
        message: `${shallow} product(en) staan op een te breed niveau (1–2); classificeer zo specifiek mogelijk (niveau 3+)`,
      });
    }
  } else if (notation === 'id' && withCat > 0) {
    findings.push({
      code: 'tax.C4.depth_unknown',
      severity: 'info',
      field: 'google_product_category',
      message: 'Categorieën staan als ID genoteerd; de exacte diepte/geldigheid is pas te bepalen met het officiële Google-taxonomiebestand (vervolgstap).',
    });
  }

  // C11 — eigen categoriestructuur (product_type) aanwezig.
  const withType = products.filter((p) => p.categories.length > 0).length;
  const productTypeFillPct = n ? Math.round((withType / n) * 100) : 0;
  if (productTypeFillPct < 90) {
    findings.push({
      code: 'tax.C11.product_type',
      severity: 'info',
      field: 'product_type',
      message: `Eigen categoriestructuur (product_type) is bij ${productTypeFillPct}% gevuld; naast de Google-categorie is ook de eigen indeling nuttig`,
    });
  }

  return { findings, googleCategoryFillPct: fillPct, notation, distinctValues, topShare, productTypeFillPct };
}
