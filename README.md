# Heerlen Roleplay — FiveM status

Deze API leest `http://31.56.25.179:30120/dynamic.json/status` via een gewone Node.js HTTP-aanvraag. FXServer behandelt dit subpad met dezelfde `dynamic.json`-handler. Op deze host loopt de aanvraag naar het kale `/dynamic.json`-pad vast. De HTTP-client onderdrukt ook de automatische `Connection`-header: aanvragen met die header liepen bij controles eveneens vast. Na het antwoord of een time-out wordt de socket altijd gesloten. Er zijn geen txAdmin-gegevens of hostingtokens nodig.

## Fallback

Als de aanvraag naar het subpad mislukt, probeert de API het gewone `/dynamic.json`-pad. Als ook dat mislukt, blijft de actuele status `unreachable`, met onbekende spelersstand en capaciteit. De officiële FiveM-serverlijst kan een eerdere melding leveren in `lastKnown`, maar bepaalt nooit de actuele online-status. De lijst moet exact `31.56.25.179:30120` bevatten; verouderde en ongeldige gegevens worden afgewezen. Alleen een geldige, directe IP-respons bevestigt `online`. Een geslaagde directe controle raadpleegt de serverlijst niet.

## Website

De website gebruikt `https://amsterdam-roleplay-status.vercel.app/`. De API geeft online-status en de geverifieerde spelerstelling door. Fouten verzinnen geen spelersstand of onderhoud.

## Lokaal

`npm ci`, daarna `npm start`. Controles: `npm test`.

Vercel gebruikt de gekoppelde GitHub-repository. Regio: Frankfurt. Alle API-antwoorden sturen no-store-headers; gelijktijdige aanvragen worden gedeeld en resultaten worden maximaal 10 seconden in de functie gecachet.
