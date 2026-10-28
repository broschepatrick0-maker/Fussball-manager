# Fußball-Pyramide

Fußball-Manager von der Champions League bis zur Kreisliga. Läuft im Browser am PC und als installierbare App (PWA) auf dem Handy, offline, Spielstand lokal im Gerät (IndexedDB).

## Aufbau
- `index.html` – App-Gerüst
- `styles/app.css` – Gestaltung
- `src/NN-*.js` – Module in Ladereihenfolge (`src/ORDER`): Stammdaten, Spielplan, Simulation, Pokale, Kader & Transfers, Finanzen, Historie, Live-Spiel, Saisonwechsel, Speichern, Ansicht, News
- `manifest.webmanifest`, `sw.template.js`, `icons/` – installierbare App

## Bauen
```
node build.mjs
```
Ergebnis:
- `dist/app/` – installierbare Web-App (auf einen Webserver legen, z. B. GitHub Pages)
- `dist/fussball-pyramide.html` – alles in einer Datei, per Doppelklick startbar
- `dist/artifact.html` – Fassung für die Vorschau in Claude

## Tests
Playwright-Skripte in `tests/` (aus `dist/app` heraus starten), z. B. `node ../../tests/t13.js`.
GitHub Pages liefert die App direkt aus dem Hauptverzeichnis aus (index.html, src/, styles/, icons/, sw.js).
