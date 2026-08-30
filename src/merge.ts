// Combineer feed (primair) en optionele masterdata tot één dataset voor analyse.
// Koppelen op SKU (sterkste sleutel), met EAN/GTIN als verificatie.

import type { NormalizedProduct } from './types.ts';
import type { Intake } from './intake.ts';

export interface CombinedProduct {
  key: string; // koppelsleutel (SKU, anders GTIN)
  feed?: NormalizedProduct; // uit de Channable-feed
  master?: NormalizedProduct; // uit Magento/PIM
  eanMatches?: boolean; // klopt de EAN tussen beide bronnen?
}

export interface CombineResult {
  // De bron waarop de audit draait: de feed als die er is, anders de master.
  primary: NormalizedProduct[];
  primaryKind: 'feed' | 'master';
  combined: CombinedProduct[];
  summary: {
    feedCount: number;
    masterCount: number;
    matched: number;
    onlyFeed: number;
    onlyMaster: number;
    eanConflicts: number;
  };
}

function keyOf(p: NormalizedProduct): string {
  return (p.sku || p.gtin || p.sourceId || '').trim();
}

export function combineSources(feed: Intake | null, master: Intake | null): CombineResult {
  const feedProducts = feed?.products ?? [];
  const masterProducts = master?.products ?? [];

  const feedByKey = new Map<string, NormalizedProduct>();
  for (const p of feedProducts) { const k = keyOf(p); if (k) feedByKey.set(k, p); }
  const masterByKey = new Map<string, NormalizedProduct>();
  for (const p of masterProducts) { const k = keyOf(p); if (k) masterByKey.set(k, p); }

  const keys = new Set<string>([...feedByKey.keys(), ...masterByKey.keys()]);
  const combined: CombinedProduct[] = [];
  let matched = 0, onlyFeed = 0, onlyMaster = 0, eanConflicts = 0;

  for (const key of keys) {
    const f = feedByKey.get(key);
    const m = masterByKey.get(key);
    let eanMatches: boolean | undefined;
    if (f && m) {
      matched++;
      if (f.gtin && m.gtin) {
        eanMatches = f.gtin === m.gtin;
        if (!eanMatches) eanConflicts++;
      }
    } else if (f) onlyFeed++;
    else onlyMaster++;
    combined.push({ key, feed: f, master: m, eanMatches });
  }

  return {
    primary: feedProducts.length > 0 ? feedProducts : masterProducts,
    primaryKind: feedProducts.length > 0 ? 'feed' : 'master',
    combined,
    summary: {
      feedCount: feedProducts.length,
      masterCount: masterProducts.length,
      matched,
      onlyFeed,
      onlyMaster,
      eanConflicts,
    },
  };
}
