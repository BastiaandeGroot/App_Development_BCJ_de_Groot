# Data quality checks — productdata en machineleesbaarheid

Gebruik dit hoofdstuk om productdata te beoordelen nadat de bronroute is gekozen.

## Doel

Beoordeel of productdata volledig, consistent, machineleesbaar en bruikbaar is voor AI-gedreven zoeken, vergelijken, filteren en aanbevelen.

## Basisvelden

Controleer per productrecord:

- product-ID
- SKU
- GTIN/EAN/UPC
- merk
- titel
- beschrijving
- categorie
- categoriepad
- product-URL
- afbeelding
- prijs
- valuta
- voorraad
- beschikbaarheid
- levertijd
- retourinformatie
- garantie
- varianten
- specificaties
- reviewscore
- aantal reviews

## Identifiers

Identifiers zijn cruciaal voor matching, verrijking en vertrouwen.

Controleer:

- GTIN
- EAN
- UPC
- SKU
- MPN
- merk + MPN-combinatie

Markeer risico’s:

- ontbrekende identifiers;
- identifiers alleen in afbeelding-URL;
- inconsistente SKU’s;
- variant-SKU’s zonder parent;
- GTIN op parentniveau terwijl variantniveau nodig is;
- niet-canonieke identifiers.

## Attribuuttypen

Splits attributen in drie groepen.

### Universele attributen

Altijd relevant:

- titel
- merk
- prijs
- voorraad
- afbeelding
- URL
- beschrijving
- categorie
- categoriepad
- identifiers
- levertijd
- retour
- garantie

### Categoriespecifieke attributen

Afhankelijk van categorie. Voorbeelden:

- kleding: maat, pasvorm, materiaal, kleur, seizoen, geslacht
- schoenen: maat, pasvorm, breedte, demping, grip, waterdichtheid
- elektronica: schermgrootte, batterijduur, opslag, compatibiliteit, aansluitingen
- meubels: afmetingen, materiaal, kleur, montage, draagkracht
- voeding: ingrediënten, allergenen, voedingswaarden, keurmerken
- beauty: huidtype, ingrediënten, inhoud, gebruiksadvies
- speelgoed: leeftijd, veiligheid, materiaal, batterijen

### Agent-relevante attributen

Nodig voor advies, filters, uitleg en alternatieven:

- use case
- doelgroep
- compatibiliteit
- contra-indicaties
- voorkeuren
- onderhoud
- duurzaamheid
- prijsrange
- performancekenmerken
- maatadvies
- vergelijkingscriteria
- besliscriteria

## Attribuutkwaliteit

Beoordeel:

- vullingsgraad;
- normalisatie;
- eenheden;
- consistentie;
- duplicaten;
- vrije tekst versus gestructureerd veld;
- variantniveau versus productniveau;
- ontbrekende values;
- onduidelijke labels;
- taalconsistentie;
- categorieniveau.

Voorbeelden van problemen:

- “waterproof”, “waterdicht” en “ja” door elkaar;
- maten als `L`, `Large`, `52`, `EU 52`;
- gewicht soms in gram en soms in kilogram;
- materiaal in beschrijving maar niet als attribuut;
- kleur in titel maar niet als filterveld;
- voorraad wel op site maar niet in feed.

## Variants en parent-child structuur

Controleer:

- parent product;
- variant product;
- variantattribuut zoals maat, kleur, inhoud of configuratie;
- unieke URL per variant;
- prijsverschillen per variant;
- voorraad per variant;
- afbeelding per variant;
- GTIN per variant;
- consistentie tussen parent en variant.

Markeer risico’s wanneer:

- varianten alleen als tekst in beschrijving staan;
- varianten geen eigen identifiers hebben;
- voorraad alleen op parentniveau staat;
- prijs per variant ontbreekt;
- canonical URL’s variantinformatie verliezen.

## Machineleesbaarheid

Beoordeel of een agent de productdata kan lezen zonder visuele interpretatie.

Sterke signalen:

- complete feed;
- PIM-export;
- JSON-LD Product;
- duidelijke endpointvelden;
- dataLayer met productobject;
- hydration state met productdata;
- machineleesbare policyvelden.

Zwakke signalen:

- data alleen in vrije tekst;
- data alleen zichtbaar na JavaScript;
- prijs als afbeelding;
- specificaties alleen in tabs zonder structured markup;
- policydata verspreid over pagina’s;
- ontbrekende semantische labels;
- inconsistent HTML.

## Feed-site consistentie

Voer uit wanneer zowel feed/interne bron als site beschikbaar zijn.

Vergelijk:

- prijs;
- voorraad;
- titel;
- merk;
- SKU;
- GTIN/EAN/UPC;
- categorie;
- varianten;
- afbeeldingen;
- specificaties;
- levertijd;
- retourinformatie;
- garantie.

Markeer verschillen die agentantwoorden onbetrouwbaar maken.

## Kwalitatieve labels

Gebruik deze labels:

- **Laag:** veel ontbrekende of ongestructureerde data; agentantwoorden zijn waarschijnlijk onbetrouwbaar.
- **Middel:** basisdata aanwezig, maar belangrijke attributen of policydata ontbreken.
- **Hoog:** meeste productdata is gestructureerd en bruikbaar; enkele verbeterpunten.
- **Sterk:** complete, consistente en machineleesbare data met goede dekking voor klantvragen.

Gebruik labels altijd met korte toelichting en bewijs.