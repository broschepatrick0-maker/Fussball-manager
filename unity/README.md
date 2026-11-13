# Fußball-Pyramide – Unity

## Öffnen
1. Unity Hub → **Hinzufügen → Projekt von der Festplatte hinzufügen** → diesen Ordner `unity` wählen.
2. Falls der Hub nach der Editor-Version fragt: deine installierte Unity-6-Version auswählen (2022.3 geht auch).
3. Beim ersten Öffnen importiert Unity Daten und Wappen (dauert 1–3 Minuten).
4. Auf **Play** drücken – das Spiel startet von selbst in jeder Szene, es muss nichts eingerichtet werden.

## Für Android bauen
File → Build Profiles (bzw. Build Settings) → Android → Switch Platform → Build.
Player Settings: Default Orientation = Portrait.

## Aufbau
- `Assets/Scripts/Core` – Spielkern ohne Unity (Welt, Spielplan, Spiele, Tabellen, Auf-/Abstieg, Kader, Pokale & Europapokal, Titel)
- `Assets/Scripts/UI` – Oberfläche, komplett per Code erzeugt
- `Assets/Resources/Data` – Welt (9.434 Vereine, 710 Ligen, echte Kader) und Namenslisten, aus der Web-App exportiert
- `Assets/Resources/Crests` – Wappen als PNG
- `Assets/Resources/Fonts` – Schriften Barlow Condensed (Überschriften) und Inter (Text), beide SIL Open Font License

## Ansicht
- **PC (Querformat):** Seitenleiste links, Kopfzeile mit „Weiter“ / „Bis Saisonende“, mehrspaltige Übersichten. Leertaste = Weiter, Esc = zur Übersicht.
- **Handy (Hochformat):** Kopf oben, Navigation unten. Die Ansicht wechselt automatisch, wenn das Fenster gedreht oder umgeformt wird.
- `Tests~` – automatische Prüfung (GitHub Actions): Spielkern 10 Saisons + Kompilieren gegen Unity 6
