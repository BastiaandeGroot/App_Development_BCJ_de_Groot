# Projectstatus — Product Data Readiness Scan

_Laatst bijgewerkt: 2026-08-29_

Deel deze samenvatting bij het oppakken van een nieuwe sessie, vóór nieuw werk.

## Wat dit project is
Een app die controleert of de productdata van een webshop (uit feed/PIM) volledig
en machineleesbaar genoeg is voor **agentic commerce**: kan een AI-agent hiermee
betrouwbaar zoeken, vergelijken en een aankoop doen voor een consument?
Uitkomst op twee niveaus: **feed-breed** én **per product**, met labels
Laag / Middel / Hoog / Sterk en bewijs. Taal van de app: Nederlands.

## Live & waar het staat
- **Repo:** github.com/BastiaandeGroot/App_Development_BCJ_de_Groot (branch `main`)
- **Live:** https://readiness-scan.onrender.com (Render, gratis plan → koude start ~50s)
- Elke push naar `main` deployt automatisch.

## Wat er nu werkt (v1)
1. **Analyse-engine** (`src/`, TypeScript, draait ook client-side in de browser):
   adapter → normaliseren → checks → score → rapport. Node 22 draait het direct
   (CLI: `node src/run.ts <feed.json>`), geen build nodig.
2. **Twee meetlatten:**
   - Volledigheid & machineleesbaarheid — `docs/dataqualitychecks.md`
   - Taxonomie (Google Product Category) + "Beantwoordbare klantvragen"
     (intern: constraint coverage) — `docs/taxonomyandconstraints.md`
3. **Rapportagestandaard** (`docs/reportingstandard.md`, v1.0): vast output-contract —
   drie niveaus, vaste labels, `reportVersion`, deterministische volgorde/afronding,
   altijd alle producten, JSON canoniek + web + PDF als weergaven.
4. **Web-UI** (Next.js, `app/` + `components/`): upload/plak/voorbeeldfeed →
   feed-dashboard + doorklikbare productlijst. Look & feel: Shopify + eBay.
   "i"-tooltips met uitleg per score. Analyse draait in de browser (geen upload).

## Intake-aanpak (belangrijk)
- **Feed = primair.** De Channable/Google-Shopping **CSV** is de analysebron (dat is wat
  de agent/het kanaal ziet). Adapter: `src/adapters/channableFeed.ts` + `src/csv.ts`.
- **Masterdata = optioneel.** Magento/PIM **JSON**-export. Adapter: `src/adapters/channable.ts`.
- **Auto-detectie** (`src/intake.ts`): CSV → feed, JSON → master.
- **Beide aangeleverd → gecombineerd** (`src/merge.ts`) op SKU (EAN ter verificatie);
  de audit draait op de feed, de master dient om gaten te duiden.
- Voorbeeldbestanden: `fixtures/sample_feed.csv` (+ `public/sample_feed.csv`) en
  `fixtures/sample_feed.json`.
- CLI: `node src/run.ts <feed.csv> [master.json] [--combined comb.json]`.

### Gebouwd op deze lijn (rapportversie 1.1)
- **Schijn-volledigheid** in de feed (`src/checks/placeholders.ts`): dominante
  default-waarde zoals merk = winkelnaam.
- **Taxonomie-audit** (`src/checks/taxonomyAudit.ts`): C1 vulgraad, C3 notatie,
  C5 meerdere waarden, C7 spreiding/bulk, C4 diepte (voor pad-waarden), C11
  product_type. Exacte validatie/diepte per ID vereist nog het officiële
  Google-taxonomiebestand (zie hieronder).
- **Feed-vs-master-divergentie** (`src/divergence.ts`): per veld aanvulbaar uit
  master / echte lacune / opgeplakt (schijnherstel), plus masterdata-gezondheid.
  Zichtbaar als aparte "Masterdata-kwaliteit"-kaart in de UI.

### Taxonomiebestand gebundeld
- Officiële Google-taxonomie (`public/google_taxonomy_with_ids.txt`, versie
  2021-09-21, 5595 ID's) is ingebouwd. `src/taxonomyData.ts` bouwt de index;
  de audit doet nu C2 (exacte validatie) en C4 (exacte diepte, ook voor ID's) en
  vertaalt ID's naar hun pad (bv. 47 = …Textiles > Fabric).
- C7 is verfijnd: concentratie op één diepe, geldige node = passend voor een
  gespecialiseerde webshop (info), niet automatisch "bulk-toewijzing".
- CLI leest het bestand uit `public/`; de UI fetcht het (gecachet).

## Bewuste keuzes / afspraken
- **Alleen constateren wat mis is** — nog géén verbetersuggesties.
- Categorie-klantvragen zijn nu **generiek/indicatief** (geen echte, categorie-
  specifieke vragen).
- Interne JSON-veldnamen blijven stabiel; UI-labels mogen wijzigen.
- Afstelknoppen: `src/score.ts` (PENALTY, drempels), `src/constraints.ts`
  (gewichten Ja/Deels/Nee/Indicatief, drempels), `src/checks/product.ts`
  (veldgewichten).

## Geparkeerd (mogelijke volgende stappen)
1. Verbetersuggesties per bevinding (met input van de opdrachtgever).
2. Categoriespecifieke klantvragen via een Claude/AI-laag.
3. Feed-site-consistentie (feed vs. live productpagina).
4. CSV/XML/PIM-adapters (nu alleen JSON).
5. PDF-export (staat al in de rapportagestandaard, zit nog niet in de UI).
6. Subjectief kwaliteitsoordeel door Claude (is een beschrijving rijk genoeg?).
7. Klein/cosmetisch: fallback voor productafbeeldingen die shops blokkeren.

## Context
- Er is ook een oudere, losse repo `Idee-nbus_Bastiaan` (vorige experimenten);
  dit project leeft volledig in `App_Development_BCJ_de_Groot`.
- Brondocumenten (meetlatten) staan ook in Google Drive-map
  "Product Catalog Readiness Scan".
