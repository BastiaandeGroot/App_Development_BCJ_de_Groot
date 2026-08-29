# Taxonomie en constraint coverage

Gebruik dit hoofdstuk voor categorievalidatie, klantvragen en beantwoordbaarheid.

## Google Product Taxonomy

Gebruik alleen Google Product Taxonomy en-US.

Regels:

- Het ID is canoniek.
- Het pad is toelichting.
- Kies de meest specifieke passende categorie.
- Vermijd te brede categorieën als een specifiekere categorie duidelijk past.
- Rapporteer twijfel expliciet.

Voorbeeld:

- ID: `187`
- Pad: `Apparel & Accessories > Shoes`

## Taxonomiecheck

Controleer:

- of de categorie aanwezig is;
- of de categorie specifiek genoeg is;
- of productdata en sitecategorie overeenkomen;
- of feedcategorie en sitecategorie overeenkomen;
- of meerdere categorieën nodig zijn;
- of varianten correct onder dezelfde categorie vallen.

Markeer risico’s:

- te brede categorie;
- verkeerde vertical;
- ontbrekende categorie;
- eigen categoriepad zonder mapping;
- inconsistentie tussen feed en site;
- producten in meerdere niet-logische categorieën.

## Intentanalyse

Bepaal welke klantintenties belangrijk zijn voor de categorie.

Veelvoorkomende intenttypes:

- oriënteren
- vergelijken
- filteren
- aanbeveling krijgen
- alternatief zoeken
- compatibiliteit controleren
- maat of pasvorm bepalen
- prijs vergelijken
- voorraad controleren
- levertijd controleren
- retourrisico inschatten
- garantie begrijpen
- duurzaamheid beoordelen
- gebruikssituatie matchen

## Klantvragen verzamelen

Gebruik bij voorkeur echte bronnen:

- zoeklogs
- onsite search
- Q&A
- reviews
- klantenservicevragen
- retourredenen
- chatgesprekken
- salesvragen
- FAQ-data

Als deze ontbreken, genereer indicatieve klantvragen op basis van categorie en benoem dat ze indicatief zijn.

## Klantvragen genereren

Genereer vragen die consumenten echt zouden stellen.

Neem minimaal deze typen op:

- productvergelijking
- filtervraag
- geschiktheidsvraag
- compatibiliteitsvraag
- policyvraag
- vertrouwensvraag
- alternatiefvraag
- budgetvraag
- voorraad/levertijdvraag
- gebruikssituatie

Voorbeelden voor wandelschoenen:

- Welke schoenen zijn geschikt voor brede voeten?
- Welke schoen is waterdicht?
- Welke schoen heeft de beste grip voor natte ondergrond?
- Is deze schoen geschikt voor lange wandelingen?
- Welke maat moet ik nemen?
- Kan ik deze retourneren als de pasvorm niet goed is?
- Welke schoenen zijn morgen leverbaar?

## Constraint decomposition

Decomposeer elke klantvraag naar constraints.

Voorbeeld:

Vraag: “Welke waterdichte wandelschoenen zijn geschikt voor brede voeten en morgen leverbaar?”

Constraints:

- categorie = wandelschoenen
- waterdichtheid = ja
- pasvorm = breed
- levertijd = morgen
- voorraad = beschikbaar
- maat = relevante maat beschikbaar

## Beantwoordbaarheid

Beoordeel per constraint:

- Is het veld aanwezig?
- Is het gestructureerd?
- Is het betrouwbaar?
- Is het actueel?
- Is het op variantniveau beschikbaar wanneer nodig?
- Is het consistent tussen feed en site?

Gebruik labels:

- **Ja:** volledig beantwoordbaar uit gestructureerde data.
- **Deels:** deels beantwoordbaar, maar met ontbrekende of vrije-tekstdata.
- **Nee:** niet beantwoordbaar uit beschikbare data.
- **Indicatief:** alleen af te leiden met aannames of LLM-inschatting.

## Constraint coverage

Rapporteer geen schijnprecisie als er weinig data is.

Gebruik liever:

- Laag
- Middel
- Hoog
- Sterk

Of rapporteer een eenvoudige verhouding als de dataset voldoende is:

- aantal beantwoordbare constraints;
- totaal aantal constraints;
- belangrijkste faalredenen.

Voorbeeld:

“Van de 18 getoetste constraints zijn er 10 goed beantwoordbaar, 4 deels en 4 niet. De grootste gaten zitten in pasvorm, waterdichtheid en levertijd.”

## Policyvragen

Neem policyvragen altijd mee omdat ze belangrijk zijn voor vertrouwen en aanbevelingen.

Controleer:

- levertijd
- verzendkosten
- retourtermijn
- retourvoorwaarden
- garantie
- installatie
- maatadvies
- voorraad
- beschikbaarheid
- afhaalopties
- compatibiliteit
- beperkingen

## Faalanalyse

Leg uit waarom vragen falen.

Veelvoorkomende oorzaken:

- attribuut ontbreekt;
- attribuut staat alleen in vrije tekst;
- waarde is niet genormaliseerd;
- informatie staat alleen in afbeelding;
- variantniveau ontbreekt;
- policydata is niet machineleesbaar;
- feed en site spreken elkaar tegen;
- categorie is te breed;
- GTIN/EAN ontbreekt;
- voorraad of levertijd ontbreekt.

## Rapportage

Rapporteer klantvragen in tabelvorm:

| Vraag | Constraints | Beantwoordbaar | Faalreden | Verbeteractie |
|---|---|---|---|---|

Koppel elke faalreden aan een concrete verbeteractie.