# Analyse voorbeeld-productfeed (merged_feed.json)

## Bron
- Systeem: Magento 2 + Magmodules_Channable v1.24.2
- Structuur: top-level object { config, products[] }
- 3552 producten, allemaal type_id "simple", is_bundle false
- Winkel: interieurstoffen/gordijnen (degrootstoffen.nl)

## Schema
- 5 verschillende key-sets -> velden niet altijd aanwezig
- Optioneel/variabel: additional_imagelinks (72%), sale_price (5%), main_category (3551/3552)
- Genest: categories[] en main_category (object)

## Vulgraad kritieke velden
- brand: 21% (GROOT probleem voor agentic commerce)
- ean: 95% (149 zonder GTIN)
- material/size/gender/price_type: 0%
- weight: 36%
- title/description/price/image_link/link/sku/availability: 100%

## Dataformaat-quirks (normalisatie nodig)
- price = "9.99 EUR" (bedrag + valuta samen in string)
- booleans als string: "true"/"false"; waterdicht "Nee"
- status = "Ingeschakeld" (NL), availability = "in stock" (EN) -> inconsistente taal
- description bevat HTML in 3456/3552 (gem 3889 tekens, max 13864)

## Integriteit
- 27 dubbele EANs (moeten uniek zijn)
- EAN-lengtes: 3399x len13 (ok), 3x len14, 1x len17 (ongeldig)
- SKU: 100% uniek (goed)

## Ontwerpimplicaties (ook voor PIM/CSV/XML)
1. Adapter-laag per bron -> 1 intern genormaliseerd productmodel
2. Normalisatie: prijs splitsen, booleans casten, taal mappen, HTML strippen, EAN valideren
3. Check-engine draait op intern model (bron-onafhankelijk)
4. Rapport per product + feed-breed (bv. "brand ontbreekt bij 79%")
