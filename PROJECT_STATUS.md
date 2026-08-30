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

### Nog te bouwen op deze lijn (afgesproken model)
- Detectie van **schijn-volledigheid** in de feed (placeholder/default zoals merk =
  winkelnaam; te brede Google-categorie / bulk-toewijzing).
- **Feed-vs-master-divergentie** als bevindingen: per ontbrekend veld "aanvulbaar uit
  master" vs. "echte lacune", plus een **masterdata-kwaliteitssignaal**.
- Taxonomie-audit-checks C1–C11 (aanwezig/geldig/specifiek/spreiding).

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
