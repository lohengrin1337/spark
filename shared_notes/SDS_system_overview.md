SYSTEM OVERVIEW
-------
//översiktlig beskrivning av systemet i bild och text, liknande föreläsningsexemplet//
----

1.1 - text
This system will run and coordinate the different [...] that our client "Svenska Elsparkcyklar AB" will use when running their e-scooter rental service in any city.

1.2 - bild
//utkast till bild, ska visa delarna/användarna ungefärligt//
![overview of the system](../img/sds_overview.jpg)



System users
----
2.0 - text
//ev kort text om vilka som använder systemet här, sedan varje användare för sig enl nedan//

Customers
----
2.1 - text
Customers use the system for finding scooters, parking and charging locations, renting and returning scooters, managing their account and handling payments.

2.2 - bild
//utkast bild av kundens användande//
![customer usage](../img/sds_customer.jpg)

2.3 - mer text
//här skriver vi något mer utförligt vad kunden ska kunna göra i app och webb, förslagsvis i punkt- eller listform//

Admin
----
3.1 - text
The admin web interface lets employees of Svenska Elsparkcyklar AB view and handle customers, pricing, locations and maintenance of vehicles and structures associated with the system.

3.2 - bild
//utkast bild admin//
![admin usage](../img/sds_admin.jpg)

3.3 - mer text
//något mer utförlig beskrivning av funktionalitet kartor etc//

Vehicles
----
4.1 - text
The scooters communicate with the system regularly, updating its own position, speed, battery status etc.

4.2 - bild
//utkast bild cyklar//
![scooter usage](../img/sds_vehicle.jpg)

4.3 - mer text
//kort beskrivning av cykeldatorn typ//

Service team
----
5.1 - text
//slänger in fss, kanske kan skippas och beskrivas inom admin istället//

The service team is deployed to a location where action is required for a vehicle or structure. They move vehicles in need of charging to charging stations, pick up vehicles that need service, transfer vehicles from unsuitable locations to parking areas. They also maintain order and functionality at parking areas and charging stations.

5.2 - bild
//utkast bild//
![service team usage](../img/sds_service.jpg)

5.3 - mer text
//beroende på hur vi väljer att göra - antingen beskrivning av deras admin-funktioner eller service-app//


The system
----
6.1 - text
Our system loosely conforms to a layered or n-tier architecture:

6.2 - bild
//bild av vår implementation av ett layered pattern, den här som exempel//

![layered pattern](../img/layered_example.png)

6.3 - text
//ev förtydligande/förklaring av layered arkitektur


Översiktlig beskrivning av systemets layers/delar
----
7.1
//kort beskrivning av layered architecture och hur vi anpassar den till våra behov//
//varje del kan ha extra bilder (eller inte)//

Slut översikt

