# Kostnadsuträkning vid uthyrning av cykel

## Vad står det i kravspecen
* Cyklar kan även parkeras utanför laddstationer och utanför accepterade platser, men det kan då tillkomma en extra avgift för kunden. Detta kallas fri parkering.
* Varje resa som en kund gör kostar pengar, dels en fast taxa och en rörlig taxa per tidsenhet och en taxa beroende av var de parkerar.
* Om en kund tar en cykel som står på fri parkering - och lämnar på en definierad parkering - så blir startavgiften lite lägre

## Logisk tolkning
* P = parkeringszon, F = fri parkering
* Det finns tre scenarion beroende av cykelns start- och slutposition
1. **Från P -> P eller från F -> F**
    * Kunden betalar normalpris
    * Fast taxa + rörlig taxa +  normal parkeringstaxa
2. **Från P -> F**
    * Kunden betalar extra för fri parkering
    * Fast taxa + rörlig taxa + dyrare parkeringstaxa
3. **Från F -> P**
    * Kunden betalar ett reducerat pris för att ha återställt en cykel till parkeringszon
    * Fast taxa  + rörligt pris + reducerad parkeringstaxa
    * Det står i kravet att startavgiften ska reduceras, men verkar mer logiskt att ändra parkeringsavgiften tycker jag, eftersom scenario 1 och 2 är varandras motsatser.

## Förslag på taxor
* Fast taxa: 10kr
* Rörlig taxa: 1kr/min (inte per påbörjad minut, utan per hel minut)
* Parkeringstaxa: 10kr
    * Påslag för P -> F: 10kr
    * Avdrag för F -> P: 10kr

## Exempel
1. **Från P -> P eller från F -> F på 12min och 30s**
    * 10 + 12 + 10 = 32kr
2. **Från P -> F  på 12min och 30s**
    * 10 + 12 + 20 = 42kr
3. **Från F -> P  på 12min och 30s**
    * 10 + 12 + 0 = 22krkr