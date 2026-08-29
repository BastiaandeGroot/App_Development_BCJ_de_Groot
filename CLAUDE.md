# CLAUDE.md

## Bij het oppakken van een sessie
Lees eerst `PROJECT_STATUS.md` en **deel een korte samenvatting van waar het
project staat** (wat werkt, wat is geparkeerd) met de gebruiker vóórdat je aan
nieuw werk begint. Dit is een uitdrukkelijke wens van de opdrachtgever.

## Over dit project
Product Data Readiness Scan — zie `PROJECT_STATUS.md` voor de volledige stand,
architectuur, live-URL en de geparkeerde vervolgstappen. De app is Nederlandstalig.

## Werken in deze repo
- Engine draait op Node 22 zonder build: `node src/run.ts fixtures/sample_feed.json`.
- Web-UI: `npm install` dan `npm run dev`. Productie: `npm run build && npm run start`.
- Push naar `main` deployt automatisch naar Render.
- Interne JSON-veldnamen stabiel houden (rapportagestandaard); UI-labels mogen wijzigen.
