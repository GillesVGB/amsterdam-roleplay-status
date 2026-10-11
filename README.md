# Heerlen Roleplay — txAdmin status

Deze API leest alleen `http://31.56.25.179:40120/host/status`. Publieke antwoorden bevatten de status en spelerstelling; geen serverpaden of authenticatiegegevens.

## Bij VibeGAMES

Laat VibeGAMES de boot-environmentvariabele `TXHOST_API_TOKEN` instellen op een afzonderlijke willekeurige token van 16–48 letters, cijfers, `_` of `-`. Dit hoort bij het opstartproces van txAdmin en niet in server.cfg. Spreek een eventueel benodigde herstart af met je hoster.

## Bij Vercel

Voeg in project `amsterdam-roleplay-status` dezelfde waarde toe als geheime Production-variabele `TXADMIN_API_TOKEN`. Deel de token niet in de chat. Daarna opnieuw deployen.

`TXADMIN_STATUS_URL` is optioneel; standaard is het bovenstaande adres. De website blijft `https://amsterdam-roleplay-status.vercel.app/` gebruiken.

Ontbrekende configuratie, verkeerd token en time-outs worden afzonderlijk gemeld. Onderhoud en wachtrijlengte worden niet verzonnen.

## Lokaal

`npm install`, daarna `npm start`. Controles: `node --test test/tx-status.test.js`.

Bij een volgende GitHub-deployment moeten server.js, tx-status.js en vercel.json uit dit pakket ook in de gekoppelde repository staan.
