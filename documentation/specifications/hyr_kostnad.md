# Kostnadsuträkning vid uthyrning av cykel (version 3)

## Vad står det i kravspecen
* Cyklar kan även parkeras utanför laddstationer och utanför accepterade platser, men det kan då tillkomma en extra avgift för kunden. Detta kallas fri parkering.
* Varje resa som en kund gör kostar pengar, dels en fast taxa och en rörlig taxa per tidsenhet och en taxa beroende av var de parkerar.
* Om en kund tar en cykel som står på fri parkering - och lämnar på en definierad parkering - så blir startavgiften lite lägre

## Logisk tolkning
* P = parkeringszon, F = fri parkering
* Det finns fyra scenarion beroende av cykelns start- och slutposition
1. **P -> P**
    * Kunden betalar normalpris
    * Fast taxa + rörlig taxa
4. **P -> F**
    * Kunden betalar extra för fri parkering
    * Fast taxa + rörlig taxa + staffavgift
3. **F -> P**
    * Kunden betalar ett reducerat pris för att ha återställt en cykel till parkeringszon
    * Fast taxa + rörlig taxa - rabatt
4. **F -> F**
    * Kunden betalar extra för fri parkering, men får rabatt eftersom den inte togs från parkering
    * Fast taxa + rörlig + staff - rabatt
    * En kund som har fri parkering som slutdestination får ett inicitament att ändå ta en cykel från fri parkering, vilket hjälper till att hålla så många cyklar på parkering som möjligt.

## Förslag på taxor
* Fast: 20kr
* Rörlig: 1kr/min (inte per påbörjad minut, utan per hel minut)
* Straff: 15
* Avdrag: 10

## Exempel
1. **P -> P på 12min och 30s**
    * 20 + 12 = 32kr
2. **P -> F  på 12min och 30s**
    * 20 + 12 + 15 = 47kr
3. **F -> P  på 12min och 30s**
    * 20 + 12 - 10 = 22kr
4. **F -> F på 12min och 30s**
    * 20 + 12 + 15 - 10 = 37kr
