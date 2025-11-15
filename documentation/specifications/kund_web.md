# Kundens webbgränssnitt

Konkretiserat implementationsförslag som uppfyller kraven samt våra preferenser kring kundens webbgränssnitt

## Som oinloggad...

1. Skapa konto - formulärvy för att skapa konto
    * Mailadressen måste vara av giltigt format och unik (HTML5-form-validering?)
    * Användarnamnet måste vara giltigt (min 4, max 20 tecken) och unikt
    * Lösenord minst 8 tecken, versal/gemen, minst ett specialtecken
    * Konto skapas utan mail-bekräftelse-länk (?)

2. Logga in - formulärvy för att logga in
    * Formulär för mailadress (eventuellt att både mail/användarnamn ska vara gångbara)
    * Formulär för lösenord
    * Logga in-knapp
    * Understruken Skapa nytt konto-länk

## Som inloggad...
1. I profilvyn kommer användaren ha tillgång till tre klickbara alternativ:
    * Redigera profil
        - Tar en till en vy där man kan:
            - Redigera Mailadress
            - Redigera Användarnamn
            - Redigera Lösenord

        (samma kriterier och begränsningar som när man skapade kontot gäller)

    * Resehistorik
        - Tar en till en list-vy som tillhandahåller en överblick över användarens tidigare resor med:
            - rese_id
            - datum- och tidsstämpel
            - resans varaktighet(?)
            - resans sträckning i km(?)
            - kostnad
            - inbäddad dynamisk kartvy som uppvisar resans sträckning

    
    * Hantera fakturor
        - Fakturavy som visar upp kundens fakturor med:
            - faktura_id
            - klickbart rese_id som fakturan är kopplad till, som länkar till resehistorikvyn för den specifika resan
            - fakturadatum
            - förfallodatum
            - summa
            - betald (ja/nej)
            - en knapp som konditionellt renderas om nej, som tillåter en kund att betala fakturan i någon lämplig enkel simulerad vy
         
      (Tycker att en simulerad pay as you go/direktbetalningslösning hade varit högst rimligt att ha i anslutning till appen,
      men kan acceptera att lägga in den i högen med eventuella bonusfeatures som man kan lägga till i mån av tid.)


## Resurs för att potentiellt kunna simulera en realistisk Swish-betalning
[Merchant Swish Simulator](https://developer.swish.nu/api/mss/v1)
