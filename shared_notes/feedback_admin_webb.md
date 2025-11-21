## Feedback från Olof på admin_webb.md

### 1. VISA select med städer
* Föreslår att en stad är förvald, och att man kan välja annan med radio-buttons, vilket gör att kartvyn kommer upp direkt. Som bonuskrav skulle man kunna spara valet hos admin-användaren.
    * Anledning: Man slipper select-steget, men filtrerar ändå alltid på stad

### 3 VISA när man klickar på cykel på kartan
* Föreslår att man inte kan flytta/ange laddning från admin-webb.
    *  Anledning : Jag tänker att cykelns position (inom laddnings-zon eller ej) bestämmer om cykeln laddas, och att detta simuleras genom att backend räknar ut, och meddelar cykeln sin status. I verkligheten skulle cykeln själv känna av att den laddas (tänk trådlös laddning inom ladd-zon), och tala om sin status. 
* Föreslår att  man istället kan ange att en cykel är på service.
    * Anledning: Detta blir ett sätt för admin att spärra en cykel, vare sig det beror på att den behöver service eller något annat.

### 4 VISA som lista (ladd/parkerings-zoner)
* Föreslår att denna punkt utgår
    * Anledning: Jag tycker en kartvy med alla zoner och alla cykar, som man kan zooma in och ut ur ger all nödvänding information. Dvs jag tycker punkt 2 löser detta redan. (Vet att det står som två punkter i kravspecen)

### 5 ÄNDRA plats för cykel
* Föreslår att vi simulerar cyklars rörelser, och huruvida de befinner sig i en ladd-zon.
    * Anledning: Vore konstigt om detta sker genom gränssnittet - jag tänker att det sker i den fysiska verkligheten (vilken vi får försöka simulera)

### 10 FILTRERA Cyklar beroende på status
* Kan tänka mig att detta görs med checkboxes vid sidan av kartan, och att det är ett prioriterat krav, eftersom det skulle kunna vara en enkel lösning på att service-teamet vet var cyklar som behöver service befinner sig - något man kan motivera att de kan göra från mobilen, även om gränssnittet är designat för desktop.

### API
* Föreslår plural på alla endpoints både när man hämta flera eller en med id. t.ex `/api/v1/customers` och `/api/v1/customers/<customer-id>`
