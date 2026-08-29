# Agentic Commerce — Productdata Readiness Checker

Checkt of productdata (uit een feed, PIM-export, CSV/XML/JSON) volledig, consistent
en machineleesbaar genoeg is voor **agentic commerce**: kan een AI-agent hiermee
betrouwbaar zoeken, vergelijken, filteren en een aankoop doen voor een consument?

De checks zijn een implementatie van `docs/dataqualitychecks.md` (de "meetlat").
De uitkomst is een oordeel per product en feed-breed, met de labels
**Laag / Middel / Hoog / Sterk**, telkens met toelichting en bewijs.

## Snel draaien

Vereist Node 22+ (draait TypeScript direct, geen build-stap nodig).

```bash
# Op de meegeleverde voorbeeldfeed:
node src/run.ts fixtures/sample_feed.json

# Op je eigen feed, met een volledig JSON-rapport erbij:
node src/run.ts pad/naar/feed.json --json rapport.json --max 10
```

Opties: `--json <bestand>` schrijft het volledige rapport weg, `--max <n>` bepaalt
hoeveel voorbeeldproducten in de console komen (`--max 0` = alleen samenvatting).

## Architectuur (bewust gelaagd)

Zo hoeven de kwaliteitsregels maar één keer geschreven te worden, ongeacht de bron:

```
bron (JSON/CSV/XML/PIM)
   │
   ▼
adapters/*.ts   → vertaalt bron naar één intern model (NormalizedProduct)
   │
   ▼
normalize.ts    → prijs splitsen, HTML strippen, EAN valideren, booleans, taal
   │
   ▼
checks/*.ts     → basisvelden, identifiers, machineleesbaarheid, varianten
   │
   ▼
score.ts        → strafpunten → score → label (Laag/Middel/Hoog/Sterk)
   │
   ▼
report.ts       → per product + feed-breed (vulgraad, dubbele identifiers)
   │
   ▼
run.ts          → CLI die het rapport print / wegschrijft
```

Een nieuwe bron toevoegen = één nieuwe adapter in `src/adapters/` schrijven die
`NormalizedProduct[]` teruggeeft. De rest blijft ongewijzigd.

## Wat er nu wél en (nog) niet is

De engine meet tegen twee meetlatten:
- **Meetlat 1 — `docs/dataqualitychecks.md`**: volledigheid, identifiers, machineleesbaarheid.
- **Meetlat 2 — `docs/taxonomyandconstraints.md`**: taxonomie (Google Product
  Category) en constraint coverage (kan een agent klantvragen beantwoorden?).

De **output** volgt `docs/reportingstandard.md`: een vast contract (drie niveaus,
vaste labels, `reportVersion`, deterministische volgorde en afronding) zodat elke
scan op dezelfde manier rapporteert.

**Wel (v1, rule-based):**
- Magento 2 / Channable JSON-adapter.
- Basisvelden, identifier-validatie (GTIN-checksum, dubbele/ongeldige GTIN's, SKU's).
- Attribuut-/vulgraadanalyse feed-breed.
- Machineleesbaarheid: signalen voor "te veel in vrije tekst" en varianten-in-tekst.
- Taxonomiecheck: aanwezigheid Google Product Category, specificiteit, meerdere
  verticals, eigen categoriepad zonder mapping.
- Constraint coverage: universele + policy + (indicatieve) categorie-constraints,
  beantwoordbaarheid per constraint (Ja/Deels/Nee/Indicatief) met faalreden,
  per product én feed-breed.
- Alles op twee niveaus: per product én feed-breed, met de 4 labels + bewijs.

**Nog niet (volgende stappen):**
- Verbetersuggesties per bevinding ("Verbeteractie") — bewust geparkeerd; komt
  in een aparte stap met input van de opdrachtgever.
- Adapters voor CSV, XML en generieke PIM-export.
- AI/Claude-laag: echte klantvragen genereren, semantische categoriejuistheid,
  subjectief kwaliteitsoordeel.
- Feed-site-consistentie (vergelijk feed met de live productpagina).
- Web-UI (Next.js) bovenop deze engine.

## Afstellen

De belangrijkste knoppen staan in `src/score.ts`:
- `PENALTY` — strafpunten per ernst (error/warn/info).
- `labelForScore` — de drempels voor Laag/Middel/Hoog/Sterk.

Het gewicht van elk basisveld (critical/important/optional) staat in
`src/checks/product.ts` (`BASE_FIELDS`).
