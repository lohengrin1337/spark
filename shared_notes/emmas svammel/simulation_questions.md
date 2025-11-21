
Vi behöver kunna simulera vårt system. 
-------

Det står inte i kravspecen alls hur det ska lösas eller mer exakt vad som kan anses bevisa systemets funktion, bara att det vi levererar ska innehålla en "möjlighet att simulera hela systemets drift för att kunna testa och verifiera systemets funktion" och vidare att "Via docker-compose skall man kunna starta hela systemet och se det i drift. Man skall kunna simulera ett antal 1000 cyklar och ett antal 1000 kunder och simulera att de rör sig i systemet, som om det vore på riktigt. Detta är en viktig del för att kvalitetssäkra systemet och påvisa att det fungerar." Det är ju möjligt att det kommer att visa sig med all önskvärd tydlighet exakt vad det handlar om senare i kursen, kanske kommer en hel föreläsning på ämnet, vem vet - men hittills har det inte givits fler ledtrådar än detta, inte ens som svar på direkta frågor.

Jag tänker därför börja spekulera:
En möjlig tolkning av kravet är att man ska kunna se applikationen utifrån admins gränssnitt, eftersom det är admin som har den överblicken som efterfrågas (se tusentals kunder och fordon i rörelse). Min lilla förhoppning är då att om vi har en admin-karta där man kan se cyklar i rörelse behöver vi i princip bara simulera cykeldata så är vi hemma?

För att simulera systemet borde vi då antingen kunna visa EN stad i taget med rörliga fordon, kanske byta i admin-vyn till nästa stad, visa fordon etc eller ha en admin-vy som visar ALLA städer samtidigt.

Om det räcker med den första varianten behöver vi bara kunna visa upp ca 1000 fordon i taget på en karta (kunderna kanske kan visas upp på ett annat sätt, kanske att en lista över aktiva bokningar kan uppdateras när en bokning görs?) och det känns egentligen som det mest rimliga?

Eller skulle ett sånt här företag sitta och övervaka hela systemet på så småningom kanske ännu flera kartbilder samtidigt? I såna fall är det ju den andra varianten, att alla kartor och cyklar syns samtidigt.

Oavsett vilken variant vi vill kunna visa upp så blir det ju en väldig massa uppdateringar av cyklars position vilket kan ställa till problem (eller inte, lite oklart?).

------

En annan tolkning är att vi ska ha en separat "simulerings-vy", att det räcker att vi har en route som övriga systemet inte använder och som bara används för att visa upp cyklars och kunders "rörelse i systemet".

Kanske är den lösningen egentligen enklare för oss att implementera, vi slipper fundera över om admins karta i vårt admin ui ska vara "live" (med sockets eller regelbunden polling) utan kan bestämma att den bara uppdateras när admin laddar om den tex.

En sådan separat simulering skulle ju också göra att vi slipper ta hänsyn till övriga systemets behov av att använda REST API:et, när simuleringen visas är det ju bara cykelposition (simulerad på något sätt) och kundaktivitet (simulerad på något sätt) som belastar API:et och vad min research i ämnet hittills har gett borde det inte vara ett problem ens om vi visar alla tre kartor med rörliga cyklar och tex tre listor med kundbokningar som uppdateras lika ofta. Jag ska försöka hitta ordentliga källor men vad jag har fulgooglat mig till hittills hade vi nog kunnat uppdatera kartor och listor så ofta som var 2-3 sekund utan problem.

En nackdel med den här tolkningen tycker jag är att det känns som fusk på ett sätt. Om vi väljer det här sättet kan vi (med den information vi har hittills i alla fall) lösa både simuleringen och det "riktiga" systemet med enbart REST API utan att behöva veta hur det hade fungerat i verkligheten med både tusentals cyklar, kunder och ett gäng admin som alla skickar sina requests genom samma API (plus teoretiska tredjepartsleverantörer).

Det tar inte heller hänsyn till den här biten i kundens kravspec: "...planerar att expandera till fler städer med stöd av ett nytt datasystem...", vilket vi ju kanske kan välja att helt bortse ifrån men som i ett verkligt scenario skulle ha känts som en väldigt viktig parameter.

Om vårt system klarar tre städer med 1000 cyklar var med ett REST API utan problem så hade man ändå behövt räkna med möjligheten att varje ny stad innebär tusentals nya fordon och kunder samt administratörer som kommer att hämta stora payloads genom API:et. Någonstans går det rimligtvis en gräns och ett verkligt företag hade nog velat veta vad vi hade för plan för att hantera det...

-----

Jag har tidsnöd så jag ska bara slänga in en sista tanke om själva simuleringsdatan:
Vår plan har hittills varit att cykelklassen ska ha en metod som simulerar positions- och statusuppdateringar. Det skulle ju fungera bra ihop med en fristående simulering, varje gång kartan uppdateras kan cykelns position ändras i instansen och cykelns markör flyttas på kartan.

Möjligtvis känns det som en märklig metod att ha för cykeln om man återigen hade tänkt sig att vi bygger ett riktigt system.

Om vi verkligen vill påvisa att vårt system fungerar hade vi ju velat simulera inskickad telemetri som tas emot, processas och leder till att cykelns state ändras? Det hade då kunnat räcka med en separat modul som simulerar cykelbeteende genom att så ofta som vi vill skicka id, position och eventuell statusförändring. Det hade kanske varit en mer verklighetstrogen simulation, där cykelklienten (som vi annars inte ens behöver bygga?) bara i princip är en modul som skickar telemetri, vilket ju ganska troget motsvarar vad den faktiskt skulle göra.