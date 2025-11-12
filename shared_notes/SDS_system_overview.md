SYSTEM OVERVIEW
-------

----
översiktlig beskrivning av systemet i bild och text, liknande föreläsningsexemplet
----

This system will run and coordinate the different [...] that our client "Svenska Elsparkcyklar AB" will use when running their e-scooter rental service in any city.


//utkast till bild, ska visa delarna/användarna ungefärligt//
![overview of the system](../img/sds_overview.jpg)


System users
----
//ev kort text om vilka som använder systemet här, sedan varje användare för sig enl nedan//

Customers
----
Customers use the system for finding scooters, parking and charging locations, renting and returning scooters, managing their account and handling payments.

//utkast bild av kundens användande//
![customer usage](../img/sds_customer.jpg)

//här skriver vi något mer utförligt vad kunden ska kunna göra i app och webb, förslagsvis i punkt- eller listform//

Admin
----
The admin web interface lets employees of Svenska Elsparkcyklar AB view and handle customers, pricing, locations and maintenance of vehicles and structures associated with the system.

//utkast bild admin//
![admin usage](../img/sds_admin.jpg)

//något mer utförlig beskrivning av funktionalitet kartor etc//

Vehicles
----
The scooters communicate with the system regularly, updating its own position, speed, battery status etc.

//utkast bild cyklar//
![scooter usage](../img/sds_vehicle.jpg)

//kort beskrivning av cykeldatorn typ//

Service team
----
//slänger in fss, kanske kan skippas och beskrivas inom admin istället//

The service team is deployed to a location where action is required for a vehicle or structure. They move vehicles in need of charging to charging stations, pick up vehicles that need service, transfer vehicles from unsuitable locations to parking areas. They also maintain order and functionality at parking areas and charging stations.

//utkast bild//
![service team usage](../img/sds_service.jpg)

//beroende på hur vi väljer att göra - antingen beskrivning av deras admin-funktioner eller service-app//

The system
----

Our system loosely conforms to a layered or n-tier architecture:

//bild av vår implementation av ett layered pattern, den här som exempel//

![layered pattern](../img/layered_example.png)


Översiktlig beskrivning av systemets layers/delar
----
//kort beskrivning av layered architecture och hur vi anpassar den till våra behov//
//varje del kan ha extra bilder (eller inte)//

Frontend
---
Admin web interface

Customer web interface

Customer mobile app

Service app


Backend
---

REST API

Models

Routers

Controllers

Database functions

Authentication


Database
---

SQL/document database
//lista vilka tabeller/collections?//


