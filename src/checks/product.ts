// Checks op productniveau. Elke check levert Findings met toelichting en bewijs.
// Gebaseerd op het document "Data quality checks — productdata en machineleesbaarheid".

import type { NormalizedProduct, Finding } from '../types.ts';
import { isValidGtin } from '../normalize.ts';

export type FieldWeight = 'critical' | 'important' | 'optional';

export interface FieldSpec {
  key: string;
  label: string;
  weight: FieldWeight;
  present: (p: NormalizedProduct) => boolean;
}

// De basisvelden uit het document, met hun gewicht voor agentic commerce.
export const BASE_FIELDS: FieldSpec[] = [
  { key: 'productId', label: 'product-ID', weight: 'important', present: (p) => !!p.sourceId },
  { key: 'sku', label: 'SKU', weight: 'important', present: (p) => !!p.sku },
  { key: 'gtin', label: 'GTIN/EAN/UPC', weight: 'critical', present: (p) => !!p.gtin },
  { key: 'brand', label: 'merk', weight: 'critical', present: (p) => !!p.brand },
  { key: 'title', label: 'titel', weight: 'critical', present: (p) => !!p.title },
  { key: 'description', label: 'beschrijving', weight: 'critical', present: (p) => !!p.descriptionText },
  { key: 'category', label: 'categorie', weight: 'critical', present: (p) => p.categories.length > 0 },
  { key: 'categoryPath', label: 'categoriepad', weight: 'important', present: (p) => p.categories.some((c) => c.path.includes('>')) || !!p.mainCategoryPath },
  { key: 'url', label: 'product-URL', weight: 'critical', present: (p) => !!p.url },
  { key: 'image', label: 'afbeelding', weight: 'critical', present: (p) => !!p.imageLink },
  { key: 'price', label: 'prijs', weight: 'critical', present: (p) => p.priceAmount != null },
  { key: 'currency', label: 'valuta', weight: 'critical', present: (p) => !!p.currency },
  { key: 'stock', label: 'voorraad', weight: 'important', present: (p) => p.stockQty != null },
  { key: 'availability', label: 'beschikbaarheid', weight: 'critical', present: (p) => !!p.availability && p.availability !== 'unknown' },
  { key: 'deliveryTime', label: 'levertijd', weight: 'important', present: (p) => !!p.deliveryTime },
  { key: 'returnInfo', label: 'retourinformatie', weight: 'important', present: (p) => !!p.returnInfo },
  { key: 'warranty', label: 'garantie', weight: 'important', present: (p) => !!p.warranty },
  { key: 'specifications', label: 'specificaties', weight: 'important', present: (p) => Object.keys(p.attributes).length > 0 },
  { key: 'reviewScore', label: 'reviewscore', weight: 'optional', present: (p) => p.reviewScore != null },
  { key: 'reviewCount', label: 'aantal reviews', weight: 'optional', present: (p) => p.reviewCount != null },
];

function severityForWeight(w: FieldWeight): Finding['severity'] {
  return w === 'critical' ? 'error' : w === 'important' ? 'warn' : 'info';
}

// 1. Basisvelden: aanwezig of niet?
export function checkBaseFields(p: NormalizedProduct): Finding[] {
  const findings: Finding[] = [];
  for (const f of BASE_FIELDS) {
    if (!f.present(p)) {
      findings.push({
        code: `field.${f.key}.missing`,
        severity: severityForWeight(f.weight),
        field: f.key,
        message: `${f.label} ontbreekt of is leeg`,
      });
    }
  }
  return findings;
}

// 2. Identifiers: geldigheid en risico's.
export function checkIdentifiers(p: NormalizedProduct): Finding[] {
  const findings: Finding[] = [];
  if (p.gtin) {
    if (![8, 12, 13, 14].includes(p.gtin.length)) {
      findings.push({
        code: 'identifier.gtin.length',
        severity: 'warn',
        field: 'gtin',
        message: `GTIN heeft een ongeldige lengte (${p.gtin.length}); verwacht 8, 12, 13 of 14 cijfers`,
        evidence: p.gtin,
      });
    } else if (!isValidGtin(p.gtin)) {
      findings.push({
        code: 'identifier.gtin.checksum',
        severity: 'warn',
        field: 'gtin',
        message: 'GTIN-checksum klopt niet; identifier is mogelijk onbetrouwbaar',
        evidence: p.gtin,
      });
    }
  } else {
    // Risico: identifier lijkt alleen in tekst te staan.
    const text = `${p.title ?? ''} ${p.descriptionText ?? ''}`;
    const m = text.match(/\b\d{12,14}\b/);
    if (m) {
      findings.push({
        code: 'identifier.gtin.text_only',
        severity: 'info',
        field: 'gtin',
        message: 'Mogelijk staat een identifier alleen in vrije tekst, niet als apart veld',
        evidence: m[0],
      });
    }
  }
  if (!p.mpn) {
    findings.push({
      code: 'identifier.mpn.missing',
      severity: 'info',
      field: 'mpn',
      message: 'Geen MPN; merk+MPN-matching is niet mogelijk',
    });
  }
  return findings;
}

// 3. Machineleesbaarheid: kan een agent dit lezen zonder visuele interpretatie?
export function checkMachineReadability(p: NormalizedProduct): Finding[] {
  const findings: Finding[] = [];
  const descLen = p.descriptionText?.length ?? 0;
  const structuredCount = Object.keys(p.attributes).length;

  if (descLen > 1500 && structuredCount < 5) {
    findings.push({
      code: 'machine.freetext_heavy',
      severity: 'warn',
      field: 'description',
      message: 'Veel informatie zit in vrije tekst terwijl er weinig gestructureerde attributen zijn; een agent moet dan interpreteren',
      evidence: `beschrijving ${descLen} tekens, ${structuredCount} attributen`,
    });
  }

  // "verkrijgbaar in ..." wijst vaak op varianten die alleen in tekst staan.
  if (p.descriptionText && /\b(verkrijgbaar in|ook leverbaar in|keuze uit|beschikbaar in de maten)\b/i.test(p.descriptionText)) {
    findings.push({
      code: 'machine.variants_in_text',
      severity: 'info',
      field: 'description',
      message: 'Mogelijke varianten worden in vrije tekst genoemd in plaats van als gestructureerde varianten',
    });
  }
  return findings;
}

// 4. Varianten / parent-child.
export function checkVariants(p: NormalizedProduct): Finding[] {
  const findings: Finding[] = [];
  if (p.isVariantParent && p.variants.length === 0) {
    findings.push({
      code: 'variant.parent_without_children',
      severity: 'warn',
      field: 'variants',
      message: 'Product is een variant-parent maar heeft geen gekoppelde variantrecords',
    });
  }
  return findings;
}

export function runProductChecks(p: NormalizedProduct): Finding[] {
  return [
    ...checkBaseFields(p),
    ...checkIdentifiers(p),
    ...checkMachineReadability(p),
    ...checkVariants(p),
  ];
}
