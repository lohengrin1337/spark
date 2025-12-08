# Spark - Docker

### Kort om docker compose-filen (docker-compose.yml)

Definerar hela docker-setupen och stacken:
- system (huvudbackenden)
- redis 
- mariadb

Tre statiska caddy-frontend-containrar, en för respektive interface:

- admin
- user-web
- user-app

Den separata, lite udda, men ack så viktiga (python-baserade) simulations-containern, där scootrarna lever sitt eget lilla liv:

- scooter-simulation

Därefter volym-länkar den mot de lokala filerna (bind volume), så att man kan utveckla synkat i relation till repot som vanligt, och rullar igång ett eget internt nätverk (spark_network) som används av containrarna för att kommunicera med varandra.

Mariadb- och redis-datan relaterar till namngivna volymer, som överlever ```docker compose down```, så att man kan jobba mot en persistent datastruktur i utvecklingssyfte utan att behöva seeda eller på annat sätt ladda in den varje gång. Går dock att rensa ut om man specifikt vill det, genom att lägga till ```-v```.


### För att rulla igång med utvecklingen


Clona repot + checka ut arbetsbranch:

   ``` git clone <repo>```

   ``` git checkout arbetsbranch ```

Gå till projektets root-folder (där compose.yaml ligger). Dra igång hela bygget:

```docker compose watch```

Första gången bygger den alla images automatiskt. 

...därefter appliceras hot-reload på allt som man jobbar med, och förändringar
ska bita och synas direkt.

```docker compose up -d```

...fungerar också snarlikt, eller kan upplevas så, då det är bindade volymer i regel till containrarna, vilket för att den här också tillhandahåller det hot-reload-liknande beteendet. ``` watch ``` täcker in fler scenarion dock, så är väl i regel att föredra, men ``` up ``` fungerar i enklare fall likvärdigt.

Färdig för dagen?

```docker compose down``` 

(Stänger ned så att inte onödiga containrar står och tuggar och stjäl RAM, processorkraft och batteri.)

Starta upp igen:

```docker compose watch```

Briljant i all sin enkelhet.

Tenderar själv att bara att rulla igång allt, fungerar bra, men kanske lite overkill, skulle man kunna argumentera för.

...så, för att rulla igång specifika delar/services istället:

Använd ```up``` istället för ```watch``` och ange tjänsten.

### Exempel:

##### system backend + redis + mariadb (exempelvis när man jobbar med API:et)

```docker compose up system redis mariadb```

##### Bara admin-frontenden

```docker compose up admin-frontend```

##### system backend + admin frontend + mariadb (För exempelvis UI-/API-synkande)

```docker compose up system admin-frontend mariadb```

(lägg som vanligt till ```-d``` (detached mode) om man vill att det ska köras i bakgrunden)

```docker compose up -d system admin-frontend mariadb```

Stänga ned? Samma där:

```docker compose down``` 


### Användbara Docker-kommandon. En Lathund:

```docker compose watch ``` - Startar allt, med hot-reload (mest rekommenderade)

```docker compose down ``` - Stänger ned allt och sparar databasen lokalt

```docker compose down -v ``` - Stänger ned allt och rensar ut namngivna volymerna (i.e databasen och redis = clean slate vid nästa omstart)

```docker compose up -d <service> <service> ... ``` - Starta upp specifika namngivna services (inkludera ```-d``` för att köra i bakgrunden)

``` docker volume ls ``` - Visa alla sparade namngivna volymer


### Routes:
| Interface       | Port  |
|-----------------|-------|
| Admin           | 8080  |
| User Web        | 8081  |
| User App        | 8082  |
| API             | 3000  |

