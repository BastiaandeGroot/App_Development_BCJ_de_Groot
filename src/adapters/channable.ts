// Adapter: Magento 2 / Magmodules_Channable JSON-feed -> NormalizedProduct[].
// Voor een nieuwe bron (CSV, XML, PIM) schrijf je een nieuwe adapter met dezelfde
// output; de rest van de pijplijn blijft ongewijzigd.

import type { NormalizedProduct, NormalizedCategory } from '../types.ts';
import {
  str,
  parsePrice,
  stripHtml,
  normalizeAvailability,
  digitsOnly,
  toNumber,
} from '../normalize.ts';

type Raw = Record<string, unknown>;

// Bronvelden die op een vaste plek in het model landen; overige velden gaan
// naar `attributes` (categorie-/agent-specifiek).
const MAPPED_KEYS = new Set([
  'id', 'sku', 'ean', 'gtin', 'upc', 'mpn', 'brand', 'title', 'description',
  'short_description', 'categories', 'main_category', 'link', 'url', 'image_link',
  'additional_imagelinks', 'price', 'sale_price', 'min_price', 'max_price',
  'currency', 'qty', 'availability', 'status', 'is_bundle', 'type_id',
]);

function mapCategories(raw: Raw): NormalizedCategory[] {
  const cats = raw.categories;
  if (!Array.isArray(cats)) return [];
  return cats
    .map((c) => {
      if (typeof c === 'string') return { path: c };
      const o = c as Raw;
      return {
        path: str(o.path) ?? '',
        level: typeof o.level === 'number' ? o.level : undefined,
        id: str(o.id),
        url: str(o.url),
      };
    })
    .filter((c) => c.path !== '');
}

function mapAdditionalImages(raw: Raw): string[] {
  const a = raw.additional_imagelinks;
  if (Array.isArray(a)) return a.map((x) => str(x)).filter((x): x is string => !!x);
  const single = str(a);
  return single ? [single] : [];
}

function mapAttributes(raw: Raw): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (MAPPED_KEYS.has(k)) continue;
    const s = str(v);
    if (s !== undefined) out[k] = s;
  }
  return out;
}

export function adaptChannableProduct(raw: Raw): NormalizedProduct {
  const price = parsePrice(raw.price);
  const sale = parsePrice(raw.sale_price);
  const mainCat = raw.main_category as Raw | undefined;

  return {
    raw,
    sourceId: str(raw.id),
    sku: str(raw.sku),
    gtin: digitsOnly(raw.ean ?? raw.gtin ?? raw.upc),
    mpn: str(raw.mpn),
    brand: str(raw.brand),
    title: str(raw.title),
    descriptionHtml: str(raw.description),
    descriptionText: stripHtml(raw.description),
    shortDescription: str(raw.short_description),
    categories: mapCategories(raw),
    mainCategoryPath: mainCat ? str(mainCat.path) : undefined,
    url: str(raw.link ?? raw.url),
    imageLink: str(raw.image_link),
    additionalImages: mapAdditionalImages(raw),
    priceAmount: price.amount,
    currency: price.currency ?? str(raw.currency),
    salePriceAmount: sale.amount,
    stockQty: toNumber(raw.qty),
    availability: normalizeAvailability(raw.availability),
    deliveryTime: str(raw.delivery_time ?? raw.levertijd),
    returnInfo: str(raw.return_info ?? raw.retour),
    warranty: str(raw.warranty ?? raw.garantie),
    isVariantParent: str(raw.type_id) === 'configurable' || str(raw.is_bundle) === 'true',
    variants: [], // deze feed levert alleen 'simple' producten aan
    reviewScore: toNumber(raw.review_score ?? raw.rating),
    reviewCount: toNumber(raw.review_count ?? raw.reviews),
    attributes: mapAttributes(raw),
  };
}

export function adaptChannableFeed(json: unknown): {
  source: string;
  products: NormalizedProduct[];
} {
  const obj = json as Raw;
  const products = Array.isArray(obj.products) ? (obj.products as Raw[]) : [];
  const config = obj.config as Raw | undefined;
  const source = config
    ? `${str(config.system) ?? 'onbekend'} / ${str(config.extension) ?? 'feed'}`
    : 'Channable-feed';
  return { source, products: products.map(adaptChannableProduct) };
}
