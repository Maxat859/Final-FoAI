# QAMAL — Participant #4 / Frontend, Pixel Art, Bayes

This is the participant-4 implementation of a browser-based AI educational game for QAIRU Final Project 2026. It includes a native HTML/CSS/Canvas interface, 14 original Pixel Art PNG assets, 30×20 map, WASD + arrows, walls and character collisions, E/M interactions, discovered map, learning quiz, CSP door UI, CCTV simulations, 1000 dossier search/edit/audit, Bayes analysis, IndexedDB saves, and the Machine Learning lab **interface**.

## Launch

```bash
python3 -m http.server 3000
```

Visit http://localhost:3000 and click "НАЧАТЬ ИГРУ". In Codespaces open the forwarded 3000 port. There is no cloud account or external API required.

## Tests

```bash
npm test
```

## Scope (important)

- `src/data/prisonerGenerator.js`, `src/algorithms/csp.js` and `src/game/puzzles.js` can be copied unchanged from participant #2's branch. The UI uses them automatically when present; temporary fallback data is available for development.
- Search/BFS/A*/UCS/DFS, Decision Tree/metrics, and Minimax behavior **belong to participants #1–3**. Their UI panels are prepared, but **not claimed to be functioning algorithms** until the corresponding modules are merged. This separation is deliberate to prevent fake AI results.
- Dossier risk shown before Decision Tree integration is explicitly marked *provisional UI heuristic*, not ML. After teammates integrate, connect their trained model to dossier updates.
- `feature/pixel-art-ui` is for feature development; do not merge into main without teammates' code review.

## Controls

- WASD/arrows: move
- E: interact with adjacent object or NPC
- M: show known map
- Esc: close panel (or return to main menu)
- Sidebar buttons: open algorithms and learning demos anywhere for testing

## GitHub ownership

Participant #4: assets + `assets/manifest.json`, frontend, Bayes, dossier UI, audit, storage, integration tests.
