# Kundens webbgränssnitt

Konkretiserat implementationsförslag som uppfyller kraven samt våra preferenser kring kundens webbgränssnitt

## Som oinloggad...

1. Skapa konto - formulärvy för att skapa konto
    * Mailadressen måste vara av giltigt format och unik (HTML5-form-validering?)
    * Användarnamnet måste vara giltigt (min 4, max 20 tecken) och unikt
    * Lösenord minst 8 tecken, versal/gemen, minst ett specialtecken
    * Konto skapas utan mail-bekräftelse-länk (?)

2. Logga in - formulärvy för att logga in (inkluderar länk till Skapa konto)
    * Mailadressen måste vara av giltigt format och unik (HTML5-form-inbyggd-validering?)
    * Användarnamnet måste vara giltigt (min 4, max 20 tecken) och unikt
    * Lösenord minst 8 tecken, versal/gemen, minst ett specialtecken
    * Konto skapas utan mail-bekräftelse-länk (?)

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
            - resans sträckning i km()
            - kostnad
            - inbäddad dynamisk kartvy som uppvisar resans sträckning

    
    * Hantera fakturor
        - ?
        (Propsar fortfarande på att använda oss av en mer modern, verklighetstrogen
        och relevant pay as you go-lösning (Merchant Swish Simulator?))


## Resurs för att potentiellt kunna simulera en realistisk Swish-betalning
[Merchant Swish Simulator](https://developer.swish.nu/api/mss/v1)
