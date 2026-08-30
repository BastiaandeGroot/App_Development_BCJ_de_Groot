// Laadt het officiële Google Product Taxonomy-bestand (taxonomy-with-ids.en-US.txt)
// en maakt er een index van: ID -> pad, en de set geldige paden. Zo kunnen we
// C2 (bestaat de waarde?) en C4 (exacte diepte) uitvoeren, ook voor ID-notatie.

export interface TaxonomyIndex {
  version: string;
  idToPath: Map<string, string>;
  paths: Set<string>;
}

export interface ResolvedCategory {
  valid: boolean;
  path?: string;
  depth?: number; // aantal niveaus in het pad
}

export function buildTaxonomyIndex(text: string): TaxonomyIndex {
  const idToPath = new Map<string, string>();
  const paths = new Set<string>();
  let version = 'onbekend';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      const m = line.match(/Version:\s*(.+)$/i);
      if (m) version = m[1].trim();
      continue;
    }
    // Formaat: "47 - Arts & Entertainment > ... > Fabric"
    const m = line.match(/^(\d+)\s*-\s*(.+)$/);
    if (m) {
      const id = m[1];
      const path = m[2].trim();
      idToPath.set(id, path);
      paths.add(path);
    } else {
      // paden-versie zonder ID's
      paths.add(line);
    }
  }
  return { version, idToPath, paths };
}

export function resolveCategory(index: TaxonomyIndex, value: string): ResolvedCategory {
  const v = value.trim();
  if (/^\d+$/.test(v)) {
    const path = index.idToPath.get(v);
    if (!path) return { valid: false };
    return { valid: true, path, depth: path.split('>').length };
  }
  if (index.paths.has(v)) return { valid: true, path: v, depth: v.split('>').length };
  return { valid: false };
}
