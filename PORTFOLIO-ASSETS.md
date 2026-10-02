# Portfolio image provenance

Every file under `public/projects/` is a real screenshot captured from the running project it represents. Nothing here is generated, stock or illustrative. Screenshots were taken with headless Chromium at 1600 × 1000 on 2026-10-02 and converted to WebP with no other editing.

| File | Source repository | How it was captured |
|---|---|---|
| `neo/neo-command-center-desktop.webp` | `foundernexoracom-create/neo-scene` @ `b368956` | `python backend/server.py`, then opened `http://localhost:8765/`. No API key was configured, so the UI reports "NEO needs API key / local planner", which is its real state. |
| `atlas/atlas-flashcard-workspace-desktop.webp` | `foundernexoracom-create/atlas-academic-productivity` @ `main` | `vite build`, `vite preview`, then opened the Flashcards workspace. The app's own demo data is shown (`src/data/mockData.ts`). |
| `nexora/nexora-website-home-desktop.webp` | `foundernexoracom-create/nexora-website` @ `main` | `vite build`, `vite preview`, home page at 1600 × 1000. |

The Silent Atlas has no verified repository or assets, so it has no image. The site shows an honest "screenshot pending" panel instead.
