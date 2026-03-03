# Devin-instruktioner för EnergiRevision

## Översikt
Detta är ett skatterevisionsprojekt med:
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express + SQLite (lokalt)
- **Integration**: Tailnet/Tailscale för att nå backend från extern server

## Kör igång

```bash
cd EnergiRevision

# Installera dependencies
npm install

# Starta frontend
npm run dev

# Starta backend (i separat terminal)
npm run server
```

## Bygg och deploy
```bash
npm run build  # Bygger till dist/
```

## Viktigt
- **Filer som tas bort ska alltid flyttas till papperskorgen** (inte raderas permanent) för enkel återställning
- Backend körs lokalt på Mac och nås via Tailnet IP
- Python-motorer (lead_scoring, rules_engine, sync_to_db) körs lokalt
