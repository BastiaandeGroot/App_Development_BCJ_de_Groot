// Herbruikbare normalisatiefuncties. Zetten "mensvriendelijke" brondata om
// naar machineleesbare, gestructureerde waarden.

export function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function str(v: unknown): string | undefined {
  if (isBlank(v)) return undefined;
  return String(v).trim();
}

// "9.99 EUR" -> { amount: 9.99, currency: "EUR" }
export function parsePrice(v: unknown): { amount?: number; currency?: string } {
  const s = str(v);
  if (!s) return {};
  const m = s.match(/(-?\d+(?:[.,]\d+)?)\s*([A-Z]{3})?/);
  if (!m) return {};
  const amount = Number(m[1].replace(',', '.'));
  return { amount: Number.isFinite(amount) ? amount : undefined, currency: m[2] };
}

// Strip HTML-tags en normaliseer whitespace naar platte tekst.
export function stripHtml(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  const text = s
    .replace(/<br\s*\/?>(?=)/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text === '' ? undefined : text;
}

export function containsHtml(v: unknown): boolean {
  const s = str(v);
  return !!s && /<[a-z][\s\S]*>/i.test(s);
}

// Tekstuele booleans naar echte boolean. "true"/"ja"/"yes" -> true.
export function parseBool(v: unknown): boolean | undefined {
  const s = str(v)?.toLowerCase();
  if (s === undefined) return undefined;
  if (['true', 'ja', 'yes', '1', 'y'].includes(s)) return true;
  if (['false', 'nee', 'no', '0', 'n'].includes(s)) return false;
  return undefined;
}

// Availability mappen naar een vaste set (taal- en brononafhankelijk).
export function normalizeAvailability(v: unknown): NonNullable<
  'in_stock' | 'out_of_stock' | 'preorder' | 'unknown'
> {
  const s = str(v)?.toLowerCase();
  if (!s) return 'unknown';
  if (/(in.?stock|op.?voorraad|beschikbaar|leverbaar)/.test(s)) return 'in_stock';
  if (/(out.?of.?stock|uitverkocht|niet.?op.?voorraad|niet.?leverbaar)/.test(s))
    return 'out_of_stock';
  if (/(preorder|pre-?order|backorder|nabestell)/.test(s)) return 'preorder';
  return 'unknown';
}

// GTIN/EAN/UPC: alleen cijfers overhouden.
export function digitsOnly(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  const d = s.replace(/\D/g, '');
  return d === '' ? undefined : d;
}

// Geldige GTIN-lengtes zijn 8, 12, 13 of 14; laatste cijfer is checksum (mod-10).
export function isValidGtin(gtin: string): boolean {
  if (!/^\d+$/.test(gtin)) return false;
  if (![8, 12, 13, 14].includes(gtin.length)) return false;
  const digits = gtin.split('').map(Number);
  const check = digits.pop() as number;
  let sum = 0;
  // Van rechts naar links: gewichten 3,1,3,1...
  for (let i = digits.length - 1, pos = 0; i >= 0; i--, pos++) {
    sum += digits[i] * (pos % 2 === 0 ? 3 : 1);
  }
  const calc = (10 - (sum % 10)) % 10;
  return calc === check;
}

export function toNumber(v: unknown): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s.replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}
