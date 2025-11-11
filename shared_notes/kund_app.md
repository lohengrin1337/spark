# Kundens app

Här är en konkret tolkning av kraven för kundens app, och hur dess behov kan tillgodoses

## Vad den ska kunna göra givet att användaren är inloggad

1. VISA på karta (före/efter hyrning)
    * Stadszon (tänker mig att man inte kan köra utanför stadens gränser)
    * Parkeringszoner
    * Laddstationer
    * Cyklar som är tillgängliga att hyra
    * Användarens position
2. VISA när man klickar på en cykel på kartan
    * Cykelinfo
        * id
        * batteri %
    * Knapp för att hyra cykel
3. HYRA cykel
4. VISA karta (under hyrning)
    * Stadszon, Parkeringszoner, Laddstationer, användarens position (ej lediga cyklar)
    * Knapp för att parkera cykel
5. VISA historik över resor? (I kravspecen står det olika under "Bakgrund" och "Kundens app")
6. VISA senaste resan? (samma som ovan)


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
* GET `/api/v1/rentals/`
    * A regular user only gets their own rentals, admin would get all
    * 200 OK { data: [ rental, ... ] }
* GET `/api/v1/rentals/<rent-id>`
    * 200 OK { data: rental }
* POST `/api/v1/rentals`
    * Request body: { bike_id: "xxx" }
    * Response: 201 Created `Location: api/v1/rentals/<rent-id>` (Location header pointing at the resource)
* PUT `/api/v1/rentals/<rent-id>`
    * Request body: { status: "parked" }
    * Response: 200 OK { data: rental }


## Side-note om geoData för zoner
Zoner kan representeras som GeoJSON där flera kordinater kan anges som hörn i en polygon
[* Info om GeoJSON](https://geojson*.org/)
