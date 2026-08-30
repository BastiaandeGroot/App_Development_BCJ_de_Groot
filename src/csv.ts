// Kleine, afhankelijkheidsvrije CSV-parser (werkt ook client-side in de browser).
// Ondersteunt quotes, komma's en newlines binnen quotes, en "" als escape.

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // ontsnapte quote
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      record.push(field); field = '';
    } else if (ch === '\n') {
      record.push(field); field = '';
      rows.push(record); record = [];
    } else if (ch === '\r') {
      // negeer; \r\n wordt via \n afgehandeld
    } else {
      field += ch;
    }
  }
  // laatste veld/record afronden
  if (field !== '' || record.length > 0) { record.push(field); rows.push(record); }
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => !(r.length === 1 && r[0].trim() === '')) // lege regels weg
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
      return obj;
    });
}
