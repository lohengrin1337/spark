# Slutsatser kring API och arkitektur

Min bild av hur vi enklast skulle unnan jobba med REST API:et, med utgångspunkt från de tre artiklarna ser ut såhär:

* API:et är spindeln i nätet för hela systemet
* Definiera varje klients behov (substantiv och verb) från API:et så kondenserat som möjligt, och mappa dem mot HTTP metod + endpoint
    * Substantiv som *cyklar* är enkla att mappa mot en resurs - `GET api/v1/bikes`
    * Verb som *hyr* kräver också mappning mot resurs för att vara RESTful - POST a rental - `POST api/v1/rentals` + body
* API:et validerar och authentiserar requests
* API:et anropar olika *models* som sköter business logic
* Orkestrering av business logic sköts av modellerna (inte av API:et)
* API:et svarar klienten med HTTP status + json representation


## Arkitektur

### Kund-app, kund-webb, admin-webb
Eftersom komunikation behöver gå genom API:et kan klienterna vara separerade i egna containers om vi vill (ser ingen direkt nackdel).

### Backend, API
Jag ser däremot en stor fördel med att låta API:et sitta ihop med backend business logic, eftersom man slipper ett extra HTTP-lager.

### Databas
Databas brukar oavsett någon form av lager (mongoClient el liknande), och skulle därför också kunna vara i en egen container (ser ingen nackdel).

### Cykel
Här är jag osäker. Det skulle kunna vara så att det enklaste är att integrera cyklens logik som en model i backend (`bikeModel.js`), och att de enskilda cyklarna är instanser av den klassen, som lever i backend, och som är representerade i databasen.

### MVC
Resultatet blir mvc minus view
* Model = backend business logic module (eg. `bikeModel.js`)
* View = den logiken hamnar hos klienterna
* Controller = API routes (eg. `GET api/v1/bikes`)

