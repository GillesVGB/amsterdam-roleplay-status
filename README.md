# Heerlen Roleplay — FiveM status

## Live status via de FiveM-resource

De meegeleverde `fivem-resource/heerlen_status` stuurt iedere 15 seconden het aantal verbonden spelers en de ingestelde capaciteit naar `POST /api/heartbeat`. Dit werkt via uitgaand HTTPS, ook wanneer de hosting aanvragen van Vercel naar de gamepoort laat vastlopen.

Zet `FIVEM_HEARTBEAT_TOKEN` als geheime productievariabele op Vercel. Maak op de gameserver `resources/heerlen_status/config.cfg` met dezelfde waarde in `set heerlen_status_token "..."`. Gebruik `set`, zodat de sleutel alleen server-side bestaat. De persoonlijke installatie-ZIP bevat de voorgeschreven configuratie; de sleutel wordt nooit in Git opgeslagen.

Voeg aan `server.cfg` toe:

```cfg
exec resources/heerlen_status/config.cfg
ensure heerlen_status
```

Voor direct activeren in de serverconsole: `refresh`, dan bovenstaande twee regels. Er is geen volledige gameserverherstart nodig.

De API accepteert alleen meldingen met de juiste Bearer-sleutel, geldige aantallen en een recente tijdstempel. De Vercel Runtime Cache bewaart de melding in Frankfurt maximaal 45 seconden; ook de meettijd wordt gecontroleerd. Een verlopen melding bevestigt nooit `online`. De API gebruikt dezelfde bestaande responsvelden, zodat de website ongewijzigd kan blijven.

## Directe controle als reserve

Deze API leest `http://31.56.25.179:30120/dynamic.json/status` via een gewone Node.js HTTP-aanvraag. FXServer behandelt dit subpad met dezelfde `dynamic.json`-handler. Op deze host loopt de aanvraag naar het kale `/dynamic.json`-pad vast. De HTTP-client onderdrukt ook de automatische `Connection`-header: aanvragen met die header liepen bij controles eveneens vast. Na het antwoord of een time-out wordt de socket altijd gesloten. Er zijn geen txAdmin-gegevens of hostingtokens nodig.

## Serverlijst als laatste melding

Als de aanvraag naar het subpad mislukt, probeert de API het gewone `/dynamic.json`-pad. Als ook dat mislukt, blijft de actuele status `unreachable`, met onbekende spelersstand en capaciteit. De officiële FiveM-serverlijst kan een eerdere melding leveren in `lastKnown`, maar bepaalt nooit de actuele online-status. De lijst moet exact `31.56.25.179:30120` bevatten; verouderde en ongeldige gegevens worden afgewezen. Alleen een geldige, directe IP-respons bevestigt `online`. Een geslaagde directe controle raadpleegt de serverlijst niet.

## Website

De website gebruikt `https://amsterdam-roleplay-status.vercel.app/`. De API geeft online-status en de geverifieerde spelerstelling door. Fouten verzinnen geen spelersstand of onderhoud.

## Lokaal

`npm ci`, daarna `npm start`. Controles: `npm test`.

Vercel gebruikt de gekoppelde GitHub-repository. Regio: Frankfurt. Alle API-antwoorden sturen no-store-headers; gelijktijdige aanvragen worden gedeeld en resultaten worden maximaal 10 seconden in de functie gecachet.
