// Adapter: Channable output-feed (Google Shopping CSV met g:-velden) -> NormalizedProduct[].
// Dit is de feed die daadwerkelijk naar kanalen/agents gaat — de primaire analysebron.

import type { NormalizedProduct, NormalizedCategory } from '../types.ts';
import { str, parsePrice, stripHtml, normalizeAvailability, digitsOnly, toNumber } from '../normalize.ts';
import { parseCsv } from '../csv.ts';

type Row = Record<string, string>;

// g:-velden die op een vaste plek in het model landen; de rest gaat naar attributes.
const MAPPED = new Set([
  'g:id', 'g:gtin', 'g:mpn', 'g:brand', 'title', 'description', 'g:price', 'g:sale_price',
  'g:availability', 'g:image_link', 'g:additional_image_link', 'link', 'g:product_type',
  'g:google_product_category', 'g:item_group_id', 'g:is_bundle',
  'g:shipping.min_transit_time', 'g:shipping.max_transit_time',
]);

function mapCategories(row: Row): NormalizedCategory[] {
  const pt = str(row['g:product_type']);
  if (!pt) return [];
  // Meerdere paden kunnen met komma of newline gescheiden zijn.
  return pt.split(/[\n]|,(?=\s*[A-Z])/).map((s) => s.trim()).filter(Boolean).map((path) => ({ path }));
}

function mapAttributes(row: Row): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (MAPPED.has(k)) continue;
    const val = str(v);
    if (val === undefined) continue;
    const key = k.startsWith('g:') ? k.slice(2) : k; // "g:color" -> "color"
    out[key] = val;
  }
  return out;
}

export function adaptChannableRow(row: Row): NormalizedProduct {
  const price = parsePrice(row['g:price']);
  const sale = parsePrice(row['g:sale_price']);
  const addImages = str(row['g:additional_image_link']);

  return {
    raw: row, // bevat o.a. g:google_product_category, zodat de taxonomiecheck 'm vindt
    sourceId: str(row['g:id']),
    sku: str(row['g:id']),
    gtin: digitsOnly(row['g:gtin']),
    mpn: str(row['g:mpn']),
    brand: str(row['g:brand']),
    title: str(row['title']),
    descriptionHtml: str(row['description']),
    descriptionText: stripHtml(row['description']),
    shortDescription: undefined,
    categories: mapCategories(row),
    mainCategoryPath: mapCategories(row)[0]?.path,
    url: str(row['link']),
    imageLink: str(row['g:image_link']),
    additionalImages: addImages ? addImages.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) : [],
    priceAmount: price.amount,
    currency: price.currency,
    salePriceAmount: sale.amount,
    stockQty: undefined, // feed heeft doorgaans geen exacte voorraadaantallen
    availability: normalizeAvailability(row['g:availability']),
    deliveryTime: str(row['g:shipping.min_transit_time']),
    returnInfo: undefined,
    warranty: undefined,
    isVariantParent: !!str(row['g:item_group_id']),
    variants: [],
    reviewScore: toNumber(row['g:product_rating']),
    reviewCount: toNumber(row['g:number_of_ratings']),
    attributes: mapAttributes(row),
  };
}

export function adaptChannableCsv(text: string): { source: string; products: NormalizedProduct[] } {
  const rows = parseCsv(text);
  return { source: 'Channable-feed (Google Shopping CSV)', products: rows.map(adaptChannableRow) };
}
