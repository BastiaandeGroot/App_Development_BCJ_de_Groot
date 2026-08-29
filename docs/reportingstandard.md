# Rapportagestandaard — vaste output van de Product Data Readiness Scan

**Onderdeel van:** Product Catalog Readiness Scan
**Type:** output-contract (hoe de scan rapporteert, niet wát er gecheckt wordt)
**Status:** vastgesteld — versie 1.0

## 1. Doel

Vastleggen dat de scan resultaten **altijd op dezelfde, voorspelbare manier**
teruggeeft: dezelfde structuur, dezelfde labels, dezelfde volgorde en dezelfde
rekenregels — ongeacht de webshop, de bron of het moment. Zo zijn scans onderling
en over tijd vergelijkbaar, en bouwen alle weergaven (web, PDF) op één bron.

## 2. Principes

- **Deterministisch:** dezelfde input → exact dezelfde output.
- **Eén bron van waarheid:** het JSON-rapport is leidend. Web en PDF zijn
  *weergaven* van dezelfde JSON; ze voegen inhoudelijk niets toe of weg.
- **Alleen constateren:** het rapport benoemt wát er niet klopt, met bewijs —
  (nog) géén verbetersuggesties (zie §7).
- **Bewijs verplicht:** elke bevinding en elk label heeft een korte toelichting
  en, waar mogelijk, concreet bewijs uit de data.
- **Taal:** presentatie in het Nederlands; de veldnamen in het JSON-schema
  blijven stabiel (Engels) en worden niet stilzwijgend hernoemd.

## 3. Vaste rapportniveaus

Elk rapport heeft altijd **drie niveaus**, in deze volgorde:

1. **Feed-niveau** — totaaloordeel + samenvattende cijfers over de hele set.
2. **Product-niveau** — per product een eigen oordeel en bevindingen.
3. **Constraint-niveau** — binnen een product: per klantvraag/constraint de
   beantwoordbaarheid.

## 4. Vaste labels (niet vrij invulbaar)

- **Kwaliteitslabel** (feed + product): `Laag` · `Middel` · `Hoog` · `Sterk`.
- **Beantwoordbaarheid** (constraint): `Ja` · `Deels` · `Nee` · `Indicatief`.
- **Ernst** (bevinding): `error` · `warn` · `info` · `ok`.

De definities van deze labels komen uit de meetlat-documenten en veranderen niet
per scan.

## 5. Vaste structuur (het contract)

### Feed-niveau
- `reportVersion` — versie van deze standaard (bv. `"1.0"`)
- `source` — herkomst (systeem/bron)
- `generatedAt` — tijdstip (ISO 8601)
- `productCount`
- `overall` — `{ label, score (0–100), summary }`
- `fillRates[]` — vulgraad per basisveld
- `feedFindings[]` — feed-brede bevindingen (volledigheid & identifiers)
- `taxonomy` — `{ googleCategoryFillPct, findings[] }`
- `constraintCoverage` — geaggregeerd `{ score, label, counts, answerableRatio, topGaps[] }`
- `labelDistribution` — aantal producten per kwaliteitslabel
- `products[]` — **alle** producten (zie §7)

### Product-niveau (`products[]`)
- `id`, `title`
- `score (0–100)`, `label`
- `findings[]` — volledigheid & identifiers
- `taxonomy[]` — taxonomiebevindingen
- `constraintCoverage` — `{ score, label, counts, answerableRatio, results[] }`

### Bevinding (`finding`) — altijd dezelfde velden
- `code` — stabiele, unieke code (bv. `field.brand.missing`)
- `severity` — error/warn/info/ok
- `field` — het betrokken veld
- `message` — korte toelichting (NL)
- `evidence` — concreet bewijs (indien beschikbaar)

### Constraint (`constraintResult`)
- `id`, `label`, `group` (universeel/policy/categorie), `intent`
- `answerable` — Ja/Deels/Nee/Indicatief
- `reason` — faalreden (bij Deels/Nee/Indicatief)
- `evidence`, `indicative` (true/false)

## 6. Vaste volgorde- en rekenregels

- **Scores:** gehele getallen 0–100.
- **Percentages:** gehele getallen; **ratio's:** notatie `"x/y"`.
- **Afronding:** rekenkundig, halve naar boven, op één vaste plek toegepast.
- **Bevindingen** gesorteerd op ernst (error → warn → info → ok), daarbinnen op `code`.
- **Vulgraad** oplopend op percentage.
- **Producten** in een stabiele volgorde op `id`.

## 7. Detailniveau en scope

- **Altijd alle producten.** Het JSON-rapport bevat standaard elk product met de
  volledige per-product-analyse; er wordt niets weggelaten of samengevat weg.
  (Web en PDF mogen de weergave pagineren/filteren, maar de onderliggende data is
  compleet.)
- **Wel in het rapport:** constateringen, labels, scores, bewijs, op alle drie
  niveaus.
- **(Nog) niet, bewust geparkeerd:** verbeteracties/aanbevelingen, door AI
  gegenereerde klantvragen, feed-site-consistentie. Het schema houdt hier ruimte
  voor (bv. een optioneel `recommendation`-veld) zodat toevoegen later geen breuk
  in de structuur is.

## 8. Outputformaten

- **Canoniek:** JSON — de bron van waarheid.
- **Verplichte weergaven:**
  - **Web** — interactieve weergave (feed-samenvatting + doorklikbare productlijst).
  - **PDF** — deelbaar rapport voor de webshop.
- Beide weergaven worden 1-op-1 uit de JSON opgebouwd, zonder eigen interpretatie
  of aanvullende cijfers.

## 9. Versiebeheer

- `reportVersion` staat in elk rapport.
- Wijzigingen in structuur of labels verhogen de versie en worden vastgelegd in
  een changelog.
- Bestaande veldnamen worden niet stilzwijgend hernoemd of verwijderd; dat
  voorkomt dat web- en PDF-weergave breken.

## 10. Changelog

- **1.0** — eerste vaststelling: drie niveaus, vaste labels, JSON canoniek,
  altijd alle producten, verplichte web- en PDF-weergave.
