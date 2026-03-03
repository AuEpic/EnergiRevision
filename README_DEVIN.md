# Devin-instruktioner för EnergiRevision

## Översikt
Detta är ett skatterevisionsprojekt med:
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express + SQLite (lokalt)
- **Integration**: Tailnet/Tailscale för att nå backend från extern server

## NotebookLM-integration

Projektet har en NotebookLM-notebook med 100+ källor som beskriver arkitektur och system:

**Notebook-ID:** `1e07e631-ca32-4268-a0c1-58a4da269862`  
**Titel:** OpenClaw Tax Expert and Energirevision Deployment Guide

### Använda NotebookLM (lokal CLI)

```bash
# Installera CLI (om inte redan installerat)
uv tool install notebooklm-mcp-cli
nlm login  # Logga in med Google

# Query notebooken
nlm query notebook 1e07e631-ca32-4268-a0c1-58a4da269862 "din fråga"

# Lista notebooks
nlm list notebooks
```

### Exempel-frågor att ställa
- "How does the EnergiRevision dashboard work?"
- "What is the architecture of OpenClaw?"
- "How does the lead scoring system work?"
- "What are the Swedish tax recovery rules?"

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

## Backend (Tailnet)

Backend körs lokalt på Mac och nås via Tailnet IP (100.76.38.1:3001).

## Viktigt
- **Filer som tas bort ska alltid flyttas till papperskorgen** (inte raderas permanent) för enkel återställning
- Python-motorer (lead_scoring, rules_engine, sync_to_db) körs lokalt
- Alla ändringar ska testas med `npm run lint` innan commit
