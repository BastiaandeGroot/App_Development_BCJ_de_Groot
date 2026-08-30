// Schijn-volledigheid: een veld lijkt goed gevuld, maar bevat grotendeels
// dezelfde (default/placeholder) waarde. Dat maskeert een echt datagat.

import type { NormalizedProduct, Finding } from '../types.ts';

function dominant(values: string[]): { value: string; share: number; distinct: number } | null {
  const filled = values.filter((v) => v && v.trim());
  if (filled.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of filled) counts.set(v, (counts.get(v) ?? 0) + 1);
  const [value, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { value, share: Math.round((count / filled.length) * 100), distinct: counts.size };
}

// Velden die "verdacht" zijn als één waarde domineert (agent kan dan niet filteren/matchen).
const SUSPECT_FIELDS: { label: string; get: (p: NormalizedProduct) => string | undefined; threshold: number }[] = [
  { label: 'merk', get: (p) => p.brand, threshold: 50 },
];

export function detectPlaceholders(products: NormalizedProduct[]): Finding[] {
  const findings: Finding[] = [];
  for (const f of SUSPECT_FIELDS) {
    const d = dominant(products.map((p) => f.get(p) ?? ''));
    if (d && d.distinct > 1 && d.share >= f.threshold) {
      findings.push({
        code: `placeholder.${f.label}`,
        severity: 'warn',
        field: f.label,
        message: `${f.label} is bij ${d.share}% van de gevulde producten dezelfde waarde ("${d.value}") — waarschijnlijk een default/placeholder in plaats van de echte waarde. Het veld lijkt volledig, maar is dat inhoudelijk niet.`,
        evidence: `${d.distinct} verschillende waarden`,
      });
    }
  }
  return findings;
}
