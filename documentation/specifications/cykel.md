# Cykelns intelligens

Utgångspunkten är att så avskalat som möjligt specificera vad kod som är tänkt att köras i cykel ska ansvara för.
Jag tänker mig att cykeln har en fabriksinställd del som vi bara förhåller oss till konceptuellt

## Konceptuell bild av cykelns färdiga funktioner (som vi inte kodar)
*Dessa delar bör finas hos en riktig cykel. Vi kan inte trigga dess riktiga funktioner, men vi kan simulera dem genom att förändra cykelns status för respektive funktion*
* Hastighetsmätare
* GPS
* Service-indikator-lampa


## Vad ska intelligensen ansvara för

* **Status**
    * `id: string`   
    * `isOn: bool`
    * `onService: bool`
    * `isCharging: bool`
    * `batteryLife: integer`
    * `position: [float, float]`
    * `speed: integer`

*Jag har utelämnat resa, kund, tid därför att jag tror det bäst lagras i databasen som `rental`, vilket backend uppdaterar kontinuerligt när cykeln medelar sin status. Jag ser inte att cykeln behöver hålla koll på dessa saker, såvida det inte visar sig var ett skarpt krav att cykeln själv lagrar en loggfil.*


1. **MEDDELA sin nuvarande *status* regelbundet**
    * Skicka alla status-variabler till backend via API
    * Tidsintervall - t.ex 10 s för cykel som är påslagen (uthyrd) och 1 min för cykel som är avslagen (ej uthyrd)
2. **BLI STARTAD av user / admin**
    * En publik metod för att sätta `isOn = true` - vilket gör cykeln körbar (sker när kund/admin hyr/kör cykel)
3. **BLI AVSTÄNGD av user / admin**
    * En publik metod för att sätta `isOn = false` - vilket indikerar att cykeln är parkerad (sker när en kund/admin parkerar)
4. **BLI LÅST av admin**
    * En publik metod för att sätta `onService = true` och `isOn = false`
        * Avslutar ev. pågående hyrning
        * Gör cykeln otillgänglig
        * Tänder en fysisk lampa på cykeln (symboliskt genom att anropa `setRedStatusIndicator(true)`).
5. **BLI UPPLÅST av admin**
    * En publik metod för att sätta `onService = false`
        * Gör cykeln tillgänglig
        * Släcker röd lampa (`setRedStatusIndicator(false)`).
6. **SIMULERA DRIFT**
    * Publik(a) metod(er) som tar simulationsdata som argument
        * Simulera att en cykel hyrs
            * Sätt `isOn = true` - cykeln är uthyrd till kund / körs av admin
            * Sätt `position` till olika kordinater över tid
            * Sätt `speed` till olika hastigheter över tid
            * Sätt `isOn = false` - cykeln är parkerad
        * Simulera att en cykel laddas
            * Sätt `onService = true` - cykeln är otillgänglig
            * Laddnings % går upp över tid
            * Sätt `onService = false` - cykeln är tillgänglig
        * Simulera att en cykel genomgår service
            * Sätt `onService = true` - cykeln är otillgänglig
            * Vänta en tid
            * Sätt `onService = false` - cykeln är tillgänglig
