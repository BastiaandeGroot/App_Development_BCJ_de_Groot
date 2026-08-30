# Implementatiestatus — origineel document vs. wat de scan doet

_Bijgewerkt: 2026-08-30_

Dit document zet de **originele meetlat-documenten** af tegen wat de app op dit
moment doet. Legenda:

- ✅ **Verwerkt** — volledig geïmplementeerd
- ⚠️ **Deels** — gedeeltelijk of met bekende beperking
- ❌ **Nog niet** — nog niet gebouwd (bewust geparkeerd of afhankelijk van een bron)

De data-kolom is de werkdag waarop het (grotendeels) is verwerkt in deze sessie.

---

## 1. `dataqualitychecks.md` (meetlat 1 — volledigheid & machineleesbaarheid)

| Eis uit document | Status | Verwerkt op | Toelichting |
|---|---|---|---|
| Basisvelden per product (titel, prijs, merk, EAN, categorie, URL, afbeelding, voorraad, beschikbaarheid, levertijd, retour, garantie, reviews…) | ✅ | 2026-08-29 | `src/checks/product.ts` (BASE_FIELDS), per product + vulgraad feed-breed |
| Identifiers: GTIN/EAN/UPC/SKU/MPN + risico's | ⚠️ | 2026-08-29 | GTIN-checksum/lengte, dubbele/ongeldige GTIN's & SKU's, ontbrekende MPN, identifier-in-tekst. "merk+MPN-combinatie" nog niet apart |
| Attribuuttypen — universeel | ✅ | 2026-08-29 | gedekt door basisvelden |
| Attribuuttypen — categoriespecifiek | ⚠️ | 2026-08-30 | generiek/indicatief (materiaal/kleur/maat/gewicht); niet categorie-specifiek gegenereerd |
| Attribuuttypen — agent-relevant | ⚠️ | 2026-08-30 | via constraints (policy/universeel); echte intentie-/vraaggeneratie geparkeerd (AI-laag) |
| Attribuutkwaliteit — vullingsgraad | ✅ | 2026-08-29 | vulgraad per veld |
| Attribuutkwaliteit — normalisatie (prijs, booleans, taal, HTML) | ✅ | 2026-08-29 | `src/normalize.ts` |
| Attribuutkwaliteit — duplicaten | ✅ | 2026-08-29 | dubbele GTIN/SKU |
| Attribuutkwaliteit — vrije tekst vs. gestructureerd | ✅ | 2026-08-29 | signaal "te veel in vrije tekst" |
| Attribuutkwaliteit — eenheden/consistentie/variantniveau | ⚠️ | 2026-08-29 | deels; expliciete eenheid-consistentiecheck nog niet |
| Schijn-volledigheid (default/placeholder, bv. merk = winkelnaam) | ✅ | 2026-08-30 | `src/checks/placeholders.ts` (uitbreiding op het document) |
| Variants / parent-child | ⚠️ | 2026-08-29 | alleen "parent zonder varianten" + "varianten in vrije tekst"; feed levert simple products |
| Machineleesbaarheid | ⚠️ | 2026-08-29 | signalen voor vrije-tekst/varianten-in-tekst; JSON-LD / na-JavaScript / prijs-als-afbeelding vereisen de live site |
| Feed-site-consistentie | ❌ | — | vereist de live productpagina als tweede bron; wél gebouwd: **feed-vs-master** (Magento) als variant |
| Kwalitatieve labels (Laag/Middel/Hoog/Sterk) | ✅ | 2026-08-29 | `src/score.ts`, per product + feed-breed |

---

## 2. `taxonomyandconstraints.md` + `02 — Google Product Taxonomy` (meetlat 2)

### Taxonomie (regels T1–T12 / scancontroles C1–C11)

| Controle | Status | Verwerkt op | Toelichting |
|---|---|---|---|
| C1 — vulgraad google_product_category | ✅ | 2026-08-29 | |
| C2 — validatie tegen officiële taxonomie | ✅ | 2026-08-30 | tegen gebundeld `public/google_taxonomy_with_ids.txt` (versie 2021-09-21) |
| C3 — notatieconsistentie (ID vs pad) | ✅ | 2026-08-30 | |
| C4 — diepte/specificiteit | ✅ | 2026-08-30 | exacte diepte, ook voor ID's; ID's worden vertaald naar pad |
| C5 — meerdere waarden per veld | ✅ | 2026-08-30 | |
| C6 — consistentie per interne categorie | ✅ | 2026-08-30 | zelfde eigen categorie → zelfde Google-categorie |
| C7 — spreiding/bulk-toewijzing | ✅ | 2026-08-30 | mét context: diepe geldige node bij gespecialiseerde shop ≠ bulk |
| C8 — semantische steekproef | ❌ | — | hoort bij de AI-laag |
| C9 — categoriespecifieke verplichte attributen | ❌ | — | geparkeerd; vereist Google's attribuut-vereisten-dataset (niet in taxonomiebestand) |
| C10 — versiecheck | ⚠️ | 2026-08-30 | versiebewustzijn (toont 2021-09-21); volledige check vereist het actuele taxonomiebestand |
| C11 — aanwezigheid product_type | ✅ | 2026-08-30 | |

### Constraints & klantvragen

| Eis | Status | Verwerkt op | Toelichting |
|---|---|---|---|
| Beantwoordbaarheid per constraint (Ja/Deels/Nee/Indicatief) | ✅ | 2026-08-29 | `src/constraints.ts` |
| Constraint coverage (Laag/Middel/Hoog/Sterk + verhouding) | ✅ | 2026-08-29 | |
| Policyvragen (levertijd, retour, garantie, verzendkosten…) | ✅ | 2026-08-29 | |
| Faalanalyse (faalreden per constraint) | ✅ | 2026-08-29 | |
| Intentanalyse + klantvragen verzamelen/genereren | ⚠️ | 2026-08-30 | generiek/indicatief; echte, categorie-specifieke vraaggeneratie = AI-laag |
| Constraint decomposition uit echte vragen | ⚠️ | 2026-08-30 | vaste constraint-set i.p.v. gedecomponeerde echte vragen |
| Rapportagetabel incl. "Verbeteractie" | ⚠️ | 2026-08-29 | vraag/constraint/beantwoordbaar/faalreden ✅; **Verbeteractie bewust geparkeerd** |

---

## 3. `reportingstandard.md` (rapportagestandaard v1.1)

| Eis | Status | Verwerkt op | Toelichting |
|---|---|---|---|
| Drie niveaus (feed / product / constraint) | ✅ | 2026-08-29 | |
| Vaste labels | ✅ | 2026-08-29 | |
| Vaste structuur + `reportVersion` | ✅ | 2026-08-29 | nu versie 1.1 |
| Deterministische volgorde & afronding | ✅ | 2026-08-29 | |
| Altijd alle producten | ✅ | 2026-08-29 | |
| JSON canoniek | ✅ | 2026-08-29 | |
| Weergave: web | ✅ | 2026-08-29 | Next.js-UI |
| Weergave: PDF | ❌ | — | nog niet gebouwd |

---

## 4. Aanvullingen buiten de originele documenten

| Onderdeel | Status | Verwerkt op | Toelichting |
|---|---|---|---|
| Feed-primair intake + optionele masterdata + combineren op SKU/EAN | ✅ | 2026-08-30 | `src/intake.ts`, `src/merge.ts` |
| Feed-vs-master-divergentie (aanvulbaar/echte lacune/opgeplakt) + masterdata-gezondheid | ✅ | 2026-08-30 | `src/divergence.ts` |
| Live deploy op Render | ✅ | 2026-08-29 | readiness-scan.onrender.com |

---

## Openstaand (bewust geparkeerd)
- Verbetersuggesties per bevinding (met input opdrachtgever)
- AI-laag: categorie-specifieke klantvragen (C8), semantisch categorieoordeel, subjectief kwaliteitsoordeel
- C9 (categoriespecifieke verplichte attributen) — vereist Google's attribuut-dataset
- Volledige C10 (actueel taxonomiebestand)
- Feed-site-consistentie (live site als bron)
- PDF-export
- CSV/XML/PIM-adapters naast Channable
