# WM 2026 – Wettmarkt-Wahrscheinlichkeiten

Web-App zur Anzeige marktbereinigter Gewinnwahrscheinlichkeiten für WM-Gruppenspiele 2026.
Quoten werden alle 6 Stunden via GitHub Actions von **The Odds API** abgerufen; das Frontend
liest ausschließlich eine statische JSON-Datei – der API-Key bleibt serverseitig.

## Live-Demo

Nach dem Deployment erreichbar unter:  
`https://<dein-github-username>.github.io/<repo-name>/`

---

## Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Placeholder-JSON erzeugen (ohne API-Key, alle Quoten = "—")
npx tsx scripts/generate-placeholder.ts

# 3. Dev-Server starten
npm run dev
```

Öffne http://localhost:5173.

### Mit echten Quoten lokal testen

```bash
export ODDS_API_KEY=dein_key_hier
npx tsx scripts/fetch-odds.ts
npm run dev
```

---

## Deployment auf GitHub Pages

### 1. Repo auf GitHub anlegen und pushen

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

### 2. API-Key als Secret hinterlegen

GitHub → Repository → **Settings → Secrets and variables → Actions → New repository secret**

| Name           | Wert                  |
|----------------|-----------------------|
| `ODDS_API_KEY` | Dein Key von the-odds-api.com |

### 3. GitHub Pages aktivieren

GitHub → Repository → **Settings → Pages**  
Source: **GitHub Actions**

### 4. Ersten Quoten-Fetch auslösen

GitHub → Repository → **Actions → Update Odds → Run workflow**

### 5. Deploy auslösen

Wird automatisch bei jedem Push auf `main` ausgeführt, oder manuell:  
**Actions → Deploy to GitHub Pages → Run workflow**

---

## Architektur

```
data/
  schedule.json          Statischer WM-Spielplan (72 Gruppenspiele)
public/
  data/
    matchdays.json        Von GitHub Actions generiert; wird vom Frontend gelesen
scripts/
  fetch-odds.ts          Node-Script: API → Vig-Berechnung → matchdays.json
  generate-placeholder.ts Erzeugt leeres matchdays.json für lokale Entwicklung
src/
  calc.ts                Vig-Herausrechnen + Median-Berechnung
  normalize.ts           Teamnamen-Normalisierung (Alias-Map)
  types.ts               TypeScript-Typen
  useMatchdays.ts        React Hook: lädt matchdays.json
  App.tsx                Hauptkomponente (Dropdown + Tabelle)
  MatchRow.tsx           Tabellenzeile mit aufklappbaren Dezimalquoten
.github/workflows/
  update-odds.yml        Alle 6h + manuell: Quoten fetchen und committen
  deploy.yml             Bei Push auf main: Vite build → GitHub Pages
```

## Wahrscheinlichkeitsberechnung

Für jedes Spiel werden die Dezimalquoten aller Buchmacher gesammelt und der **Median** pro
Ausgang (Heimsieg / Remis / Auswärtssieg) gebildet. Danach:

```
implied_i  = 1 / decimal_i
overround  = implied_home + implied_draw + implied_away   (> 1.0)
prob_i     = implied_i / overround                        (∑ = 100 %)
```

Rundungsdifferenzen werden auf den Wert mit dem größten Bruchanteil verrechnet,
sodass die Summe exakt 100 % ergibt.

---

## Hinweis

Die Prozentwerte sind marktbereinigte Wahrscheinlichkeiten aus Buchmacher-Quoten.
Sie stellen keinen eigenen Vorhersage-Vorteil dar und sind keine Garantie für Spielausgänge.

**18+** – Glücksspiel kann süchtig machen.  
Hilfe: [bzga.de](https://www.bzga.de) · [check-dein-spiel.de](https://www.check-dein-spiel.de)
