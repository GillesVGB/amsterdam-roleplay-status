# Heerlen Roleplay — FiveM status

Deze API probeert eerst `http://31.56.25.179:30120/dynamic.json` via een gewone Node.js HTTP-aanvraag. Er zijn geen txAdmin-gegevens of hostingtokens nodig.

## Fallback

Als de directe IP-aanvraag mislukt, blijft de actuele status `unreachable`, met onbekende spelersstand en capaciteit. De officiële FiveM-serverlijst kan een eerdere melding leveren in `lastKnown`, maar bepaalt nooit de actuele online-status. De lijst moet exact `31.56.25.179:30120` bevatten; verouderde en ongeldige gegevens worden afgewezen. Alleen een geldige, directe IP-respons bevestigt `online`.

## Website

De website gebruikt `https://amsterdam-roleplay-status.vercel.app/`. De API geeft online-status en de geverifieerde spelerstelling door. Fouten verzinnen geen spelersstand of onderhoud.

## Lokaal

`npm install`, daarna `npm start`. Controles: `node --test test/fivem-status.test.js`.

Vercel gebruikt de gekoppelde GitHub-repository. Regio: Frankfurt. Alle API-antwoorden sturen no-store-headers; gelijktijdige aanvragen worden gedeeld en resultaten worden maximaal 10 seconden in de functie gecachet.
