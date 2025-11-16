Min bearbetning av slides från föreläsning:
Kursiv text är min tolkning av slides, fetstil är min slutsats/sammanfattning av det kursiva.

*En definition och visualisering av ett systems arkitektur.
Högnivåanalys av ett system.
Innehåller text och resonemang.
Riktar sig både till team och intressenter.
Vårt team, våra chefer och systemets beställare.*

*Separera analysen och designen.
Analysen är en skiss av systemets funktionalitet, inte dess implementering.*

*Analys:
Förstå systemet vi ska bygga,
förklara systemet vi ska bygga,
skissa systemet vi ska bygga.*

*Design:
Dela upp systemet i subsystem, förklara och rita dem.
Beskriv kunderna och deras ui.
Diskutera implementationstekniker.
Använd detta i sdsen som komplement (mest riktat till oss själva?).*

*Man kan följa ett mönster (tror han menar typ standard) eller vara mera fri.*

*Bilderna ska beskriva systemet från olika håll, systemets användare, utvecklare, project managers.*

*4+1
Logical view - vilka funktioner erbjuds till kund/användare (state diagrams)
Process view - dynamiska aspekter och beteende i drift(sequence/communic./activity diagrams)
Development view - visa subsystem och komponenter - ämnat för programmeraren (komponenter, package??? diagram)
Physical view - noder och lager, för system engineer??? (deployment diagrams???)
Scenarios - use cases som beskriver arkitekturen(use case diagram)*

*Arkitekturen ska kunna hantera varierande och oförutsägbara volymer.
Den ska ta hänsyn till och lösa skalbarhet och concurrency(systemets förmåga att hantera utföra flera saker samtidigt ungefär?)*

*Fundamental structure of a software system
software/physical elements
relations among them
properties of the elements/relations
usage of the system
data/events in the system
interfaces and sub modules*

*Arkitekturen visas upp genom att måla upp en bild av subsytstemen och hur de hänger ihop och kommunicerar.*

*SDS:en ska påvisa vår förståelse av systemet och vad vi har dragit för slutsatser.*

*SDS:en är vårt "kontrakt" där vi dokumenterar det vi kommit överens om.*

*Rikta er till någon som kan något mindre än ni om ert system.
Vi måste fatta fundamentala strukturella beslut.
Att ha det i ett dokument gör det lättare att kommunicera.
SDS:en dokumenterar våra beslut och blir vårt facit.*

*Välj bra beskrivande bilder och hellre många små än en stor och komplex.*

**Vi behöver i text och bild beskriva systemet på en hög nivå utifrån flera perspektiv, både beställaren, vår imaginära projektledare (rättaren/läraren?) och vårt eget team. Beskrivningen av systemet utgår från beskrivningen av arkitekturen och beskriver även de olika delarna som vi delat in systemet i utifrån val av arkitektur. SDS:en ska även innehålla vår argumentation kring olika problem och deras lösningar, hur vi diskuterade lösningen och varför vi valde den lösning vi valde.**

[Ev hjälpsam länk?](https://www.geeksforgeeks.org/system-design/what-is-high-level-design-learn-system-design/)


Min bearbetning av sds-artikel dbwebb:
Kursiv text är min tolkning av stycken ur artikeln, fetstil är min slutsats/sammanfattning av det kursiva.

*Vi ska analysera och förklara hur vi delat upp systemets anvsvarsomroåden i subsystem/moduler.*

*Vi ska identifiera alla subsystem/moduler och visa varför vi delat upp och organiserat dem som vi gjort och hur systemet sitter ihop för att uppnå funktionaliteten utan att gå in för mkt i detalj.*

*Beskriv också varför vi inte valt andra alternativ vi diskuterat. Beskriv detta utförligt så läsaren förstår varför vi valde.*

*Dokumentet ska ha en framsida, innehållsförteckning och referenser.
(spara källor!) Ange källor i ett eget avsnitt i slutet.*

*Mer bilder av arkitekturen, subsystemens arkitektur, teknikerna och flödena. Högnivå, inte klassdiagram. Bildtexter. Text ovanför och under bilderna.*

*Tänk att ni riktar dokumentet till någon som vet lite mindre än ni om systemet, någon som inte nödvändigtvis har samma tekniska kunskap som ni. Er project manager (det hör man ju på namnet är någon som inte vet något) borde kunna läsa och få ut något av dokumentet, din chef (ännu mindre kunskap) också. Beställaren av systemet ska kunna läsa dokumentet o

**Mycket samma som ovan men även - vi ska identifiera alla subsystem/moduler. Vi måste alltså ha samsyn kring vilka vi kommer att behöva och beskriva dem i text och bild. Dokumentet ska ha framsida, innehållsförteckning och referenser. Dokumentet ska ha många bilder och helst ska det finnas text både ovanför och under, samt alltid en bildtext. Vi ska dokumentera alla källor vi använder oss av och referera till dem i ett särskilt avsnitt. Den tekniska nivån på både språk och bildmaterial i analysen ska inte vara för avancerad eftersom även chefer ska kunna läsa dokumentet och inte känna sig dumma, för det hatar chefer.**

Ovanstående är alltså vad jag tolkar att mos vill ha i SDS:en men - vad vill VI ha ut av SDS:en? Design-delen tycker jag är ett ypperligt tillfälle för oss att skapa en tydlig plan och karta som kan göra nästkommande steg i kursen lite lättare. Den behöver inte hålla lika "hög nivå" (känns jättekonstigt att beskriva så när man ju menar att hög nivå är nerdummat eller?) utan kan vara ett avsnitt där vi specificerar för eventuella mer tekniskt kunniga läsare men framför allt för oss själva hur vi ska ro detta i land. Under analysen kommer vi ju att skriva analyser, rita klassdiagram, kanske en ER-modellering för databasen, skriva specifikationer - allt detta har vi ju redan börjat med - och en del av det tycker jag vi ska ha med i den här delen. För står det i SDS:en är det inte längre olika "vi skulle kunna" och "undrar hur det här kan funka" eller "det är väl bara att göra en" utan då måste vi ha en RIKTIG plan för allt som ska finnas i systemet och då kommer det att vara lätt som en pytteliten plätt att sätta igång och koda. Typ.