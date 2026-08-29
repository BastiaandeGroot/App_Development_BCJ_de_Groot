// Taxonomiechecks op basis van docs/taxonomyandconstraints.md en
// docs (02) Google Product Taxonomy.
//
// Rule-based en deterministisch. Semantische juistheid (hoort dit product
// inhoudelijk in deze node?) en feed-site-consistentie vragen om de AI-/site-laag
// en zitten hier bewust nog niet in.

import type { NormalizedProduct, Finding } from '../types.ts';
import { str } from '../normalize.ts';

// Zoekt een Google Product Category-waarde in het bronrecord (id of pad).
export function googleCategoryOf(p: NormalizedProduct): string | undefined {
  for (const [k, v] of Object.entries(p.raw)) {
    if (/google.*(product)?.*categor|g[:_]?product_category|taxonomy/i.test(k)) {
      const s = str(v);
      if (s) return s;
    }
  }
  return undefined;
}

// Diepste niveau van de aanwezige (interne of Google) categoriepaden.
function maxPathDepth(p: NormalizedProduct): number {
  let max = 0;
  for (const c of p.categories) {
    const depth = c.path.split('>').filter((s) => s.trim() !== '').length;
    if (depth > max) max = depth;
  }
  return max;
}

// Aantal verschillende hoofdcategorieën (level-1 verticals) waar het product in zit.
function distinctVerticals(p: NormalizedProduct): string[] {
  const tops = new Set<string>();
  for (const c of p.categories) {
    const top = c.path.split('>')[0]?.trim();
    if (top) tops.add(top);
  }
  return [...tops];
}

export function checkTaxonomy(p: NormalizedProduct): Finding[] {
  const findings: Finding[] = [];
  const gcat = googleCategoryOf(p);

  if (!gcat) {
    // Ontbrekende Google-categorie + eigen categoriepad zonder mapping.
    if (p.categories.length > 0) {
      findings.push({
        code: 'taxonomy.google_category.missing',
        severity: 'error',
        field: 'google_product_category',
        message: 'Geen Google Product Category; er is alleen een eigen categoriepad zonder mapping naar de officiële taxonomie',
        evidence: p.mainCategoryPath ?? p.categories[0]?.path,
      });
    } else {
      findings.push({
        code: 'taxonomy.category.missing',
        severity: 'error',
        field: 'category',
        message: 'Product heeft helemaal geen categorie',
      });
    }
  } else {
    // Specificiteit: te breed als het pad maar 1-2 niveaus diep is.
    const depth = gcat.includes('>') ? gcat.split('>').filter((s) => s.trim()).length : 1;
    if (depth <= 2) {
      findings.push({
        code: 'taxonomy.too_broad',
        severity: 'warn',
        field: 'google_product_category',
        message: 'Google-categorie lijkt te breed; kies de meest specifieke passende node (niveau 3 of dieper)',
        evidence: gcat,
      });
    }
  }

  // Meerdere (mogelijk niet-logische) verticals.
  const verticals = distinctVerticals(p);
  if (verticals.length > 1) {
    findings.push({
      code: 'taxonomy.multiple_verticals',
      severity: 'info',
      field: 'categories',
      message: `Product staat in ${verticals.length} verschillende hoofdcategorieën; controleer of dat logisch is`,
      evidence: verticals.join(' | '),
    });
  }

  // Interne categorie wel aanwezig maar erg ondiep.
  if (!gcat && p.categories.length > 0 && maxPathDepth(p) <= 1) {
    findings.push({
      code: 'taxonomy.internal_shallow',
      severity: 'warn',
      field: 'category',
      message: 'Eigen categorie is erg ondiep (alleen een hoofdniveau); te weinig specificiteit voor betrouwbare classificatie',
    });
  }

  return findings;
}
