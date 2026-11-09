# Fußball-Pyramide – Datenexport für Unity

Stand: 9. November 2026 · erzeugt aus der Web-App

| Datei | Inhalt |
|---|---|
| ligen.json | profi (1.–3. Liga, 5 Regionalligen), amateur (642 Ligen mit Verband, Stufe, Kreis, Aufstiegsliga `up`, Vereinen), ausland, europaPool |
| verbaende.json | 21 Landesverbände, Landespokal-Namen, Regionalliga-Zuordnung, Nachbarverbände |
| vereine.json | Eigentümer, Trikots (home/away/third: s=Hemd, t=Zweitfarbe, p=Muster, sh=Hose, so=Stutzen), Derbys, Heimatligen, Wappen (Datei + Farben) |
| regeln.json | Basisstärke je Stufe, Positionsgewichte, Attribute, Spielstile, Trainings-Attribute, Positions-Fit, Scouting/Akademie-Stufen, Rollen, Nationen |
| wappen/ | 84 freigestellte Wappen (WebP, 160 px) |

Hinweise
- Vereine sind über den Namen verknüpft – beim Import feste IDs vergeben.
- Zweitvertretungen enden auf „II“/„III“; die 1. Mannschaft ist der Name ohne Endung.
- Stärken sind Spielwerte, keine offiziellen Daten. Ligen/Vereine stammen aus fussball.de-Screenshots.
- Das Konzeptdokument „Fußball-Pyramide – Konzept für den Unity-Neubau“ beschreibt alle Regeln.
