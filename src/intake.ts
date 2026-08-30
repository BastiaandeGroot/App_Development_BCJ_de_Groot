// Intake: bepaalt automatisch of een aangeleverd bestand de FEED (Channable CSV)
// of de MASTERDATA (Magento/PIM JSON-export) is, en zet het om naar het interne model.

import type { NormalizedProduct } from './types.ts';
import { adaptChannableFeed as adaptMagentoJson } from './adapters/channable.ts';
import { adaptChannableCsv } from './adapters/channableFeed.ts';

export type SourceKind = 'feed' | 'master';

export interface Intake {
  kind: SourceKind;
  source: string;
  products: NormalizedProduct[];
}

// Detecteer op inhoud (JSON begint met { of [) met bestandsnaam als hint.
export function ingest(filename: string, text: string): Intake {
  const trimmed = text.trimStart();
  const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  const isCsv = /\.csv$/i.test(filename) || (!looksJson && /,/.test(trimmed.split('\n')[0] ?? ''));

  if (isCsv) {
    const { source, products } = adaptChannableCsv(text);
    return { kind: 'feed', source, products };
  }
  const { source, products } = adaptMagentoJson(JSON.parse(text));
  return { kind: 'master', source, products };
}
