**Förslag text under rubriken System Context**

Systemet som beskrivs i detta dokument är ett komplett datasystem för att hantera uthyrning av elsparkcyklar. I det ingår datalagring med tillhörande funktionalitet, applikationer för företagets kunder, en webbapplikation som ger administrativ personal möjlighet att se och hantera alla delar av verksamheten, mjukvarustrukturer för att sköta kommunikationen mellan systemets olika delar och klienter samt all funktionalitet som behövs för att upprätthålla övriga delars funktionalitet och drift.

BILD

Då systemets olika delar har många vitt skilda uppgifter utgår vi till att börja med från de olika användarnas perspektiv för att så tydligt som möjligt visa hur delarna fungerar och kommunicerar med varandra, vad deras olika roller är och hur vi får dem att tillsammans täcka in all den funktionalitet som beställaren behöver.

**Förslag kompletterande text under rubriken Customer**

Beställarens kunder kan skapa ett användarkonto på en webbsida som ger dem möjlighet att se och hantera sin egen information såsom genomförda resor och betalningar. För att hyra och använda elsparkcyklarna använder de en mobilanpassad applikation som låter dem hitta lediga fordon, hyra och använda dem samt parkera och återlämna dem.

BILD

Sedan kanske befintlig text men med bullet list? Plus loggar in i app också.

* Log in (app/webb)

**Förslag kompletterande text under rubriken Administrator**

Administratörerna har en central roll i flödet, de har bred åtkomst och privilegier att kontrollera alla delar av systemet. Via databashämtningar kan de se information om infrastrukturen (zoner, parkeringar etc), kunderna och sparkcyklarna, söka i databasen samt filtrera på olika nyckelattribut. De kan även uppdatera eller radera information i databasen genom formulär.

Till varje stad hör en kartvy som ger en visuell överblick över staden, dess tillåtna körzoner, ladd- och parkeringsplatser. Administratören kan välja att se exempelvis alla laddstationer, klicka på en laddstation och då få se hur många och vilka cyklar som just nu laddas där. De kan också välja att se hela fordonsflottan tillhörande en stad//, filtrera visningen på fordonets status (behöver laddas, parkerad etc) samt se uthyrda cyklars rörelser //på kartan.

BILD

* Search and handle all database data //(hur detaljerat ska det vara här egentligen?)//

//* Adjust pricing-rate//

* Monitor the movements and status of the vehicle fleet //on a live map//

//* Flag scooter for service

**Förslag kompletterande text under rubriken Service Team**

//Vi får fundera på om vi ska ha kvar den här delen kanske, det kan ju vara en toppengrej om vi har tid men var ju inte ett krav och kanske bara ska beskrivas som en del av admin annars?//

**Förslag kompletterande text under rubriken Scooter**

Sparkcyklarna sänder löpande //kontinuerligt om vi kör sockets kanske?// telemetri tillbaka till systemet så att admin kan övervaka deras status och position.
När en sparkcykel hyrs genom kundens app ändrar den sin status till "uthyrd" och höjer då uppdateringsfrekvensen. När kunden aktiverar cykeln och påbörjar en resa loggas tid och position för resans start, när kunden parkerar cykeln loggas tid och position för resans slut.

Om cykelns batteri börjar ladda ur (under 20% kvar) varnar cykeln //kan varna kunden genom att batteriindikatorn ändrar färg från grön till röd eller nåt?// för detta och ändrar sin status till "behöver laddas". // visst pratade vi om twilight zone? ska kolla - i såfall: Om cykeln av kunden förs nära utkanten av den tillåtna körzonen kan hastigheten tillfälligt sänkas, om den förs utanför tillåten körzon stängs motorn av och kunden får antingen parkera och avsluta sin hyrsession eller manuellt leda cykeln tillbaka inom zonens gränser.//

//Blev osäker när jag skrivit det här. Cyklarna "använder" ju bara systemet till att skicka och ta emot data. Systemet gör ju grejer med datan men cyklarna gör ju i princip bara det.//

BILD

* bullet point list