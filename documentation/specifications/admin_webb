# Admins webbgränssnitt

Här är en konkret tolkning av kraven för admins webbgränssnitt, och hur dess behov kan tillgodoses

## Vad det ska kunna göra givet att admin är inloggad

1. VISA select med städer

2. VISA på karta när stad är vald
  * Stadszon
  * Parkeringszoner
  * Laddstationer
  * Samtliga cyklar (med deras status som färgmarkering)

3. VISA när man klickar på cykel på kartan
  * Cykelinfo
    * id
    * batteri %
  * Select för att flytta cykel till laddzon

4. VISA som lista
  * Laddplatser
    *Antal cyklar
  * Parkeringar
    *Antal cyklar

5. ÄNDRA plats för cykel
  * Flytta cykel till laddzon

6. VISA kunder genom sökfunktion

7. RADERA (eller spärra?) kunder

8- VISA alla taxor

*BONUS?*
9. ÄNDRA
  * Tillåten zon
  * Minuttaxa
  * Starttaxa
  * Avgift för fri parkering
  * Avdrag för att ta cykel från fri parkering och lämna på parkering
  * Ta bort parkering
  * Lägga till parkering
  * Ta bort laddplats
  * Lägga till laddplats

10. FILTRERA
  * Cyklar beroende på status

11. VISA
  * Kundens fakturor


## Förslag på hur APIet kan stödja appen

* GET `/api/v1/city-zones<?city=xxx>`
    * 200 OK { data: [ zone, ... ] }
* GET `/api/v1/parking-zones<?city=xxx>`
    * 200 OK { data: [ zone, ... ] }
* GET `/api/v1/charging-stations<?city=xxx>`
    * 200 OK { data: [ zone, ... ] }
* GET `/api/v1/bikes<?city=xxx>`
    * A regular user gets available bikes, admin would get all
    * 200 OK { data: [ bike, ...] }
* PUT `/api/v1/bike/<bike-id>`
    * Request body: { coordinates: "xxx" }
    * 204 No Content
* GET `/api/v1/bikes/<zone-id>`
    * Gets the quantity of bikes in a parking zone or charging station
    * 200 OK { data: [quantity: "xxx"]}
* GET `/api/v1/cities
    * 200 OK { data: [ city, ... ] }
* GET `/api/v1/customer/search/:query`
    * 200 OK { data: [ customer, ...] }
* GET `/api/v1/customer/<customer-id>`
    * 200 OK { data: [ customer, ...] }
* DELETE `/api/v1/customer
    * Request body: { id: "xxx"}
    * 204 No Content


*BONUS?*

PUT `/api/v1/city-zones`
    * Request body: { id: "xxx", coordinates: "xxx" }
    * 204 No Content
PUT `/api/v1/rates/`
    * Request body: { id: "xxx", rate: "xxx" }
    * 204 No Content
* PUT `/api/v1/parking-zones`
    * Request body: { id: "xxx", coordinates: "xxx" }
    * 204 No Content
* PUT `/api/v1/charging-stations`
    * Request body: { id: "xxx", coordinates: "xxx" }
    * 204 No Content
* DELETE `/api/v1/parking-zones`
    * Request body: { id: "xxx", coordinates: "xxx" }
    * 204 No Content
* DELETE `/api/v1/charging-stations`
    * Request body: { id: "xxx", coordinates: "xxx" }
    * 204 No Content
* GET `/api/v1/invoice?<customer=xxx>`
    * 200 OK { data: [ invoice, ...] }

