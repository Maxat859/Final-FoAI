# QAMAL: Frontend and Bayesian Inference (Participant #4)

## Responsibilities

`src/main.js` joins the 30×20 Canvas grid, game HUD, panels, character, discovery map, progress and other participants' modules.
`src/ui/assetLoader.js` validates and loads the `assets/manifest.json` sprite catalog.
`src/ui/gameCanvas.js` renders assets at nearest-neighbor 32-pixel cells, fog-of-war, NPCs and CCTV simulation.
`src/game/player.js` handles coordinate-safe movement (row, col), collisions, and near-object interactions.
`src/algorithms/bayes.js` implements Bayes for a binary ALARM / NORMAL sensor. The front end displays prior, likelihood, evidence, posterior and validates [0,1] inputs.
`src/surveillance/dossierStore.js` maintains a 1000-record synthetic dossier index, observations and immutable audit entries; `src/storage/indexedDb.js` persists game data and UI state.
`src/ui/dossierUI.js` uses pagination (12 cards per page) and editable event status, so it doesn't render all 1000 DOM cards.
`src/ui/trainingLabUI.js` exposes Generate/Train/Test/Predict hooks; the actual Decision Tree training algorithm belongs to participant #2.

## Integration contracts

Search (participant #1): `src/algorithms/search.js` should export `findPath({grid,start,goal,algorithm})`, returning `{found,path,visited,cost,steps}`. Browser planner imports it dynamically; absence is reported clearly, not simulated.
CSP (participant #2): `src/algorithms/csp.js` and `src/game/puzzles.js` are imported via `createSecurityLockPuzzle()/checkLockAttempt()`; they are preserved verbatim from the teammate branch during integration.
Decision Tree (participant #2): `trainTree(samples,options)`, `predictTree(model,features)`, `splitDataset(samples,{testRatio,seed})`, `evaluateClassifier(model,test)` from the teammate's modules.
Minimax (participant #3): `chooseGuardMove({state,depth,alphaBeta})`. Tactical panel awaits integration and does not claim to have working AI until present.

No real-world prison surveillance or personal risk determination occurs: cameras and dossiers are entirely fictional.

## Test & preview

`npm test` runs `node --test tests/*.test.js`. Use `python3 -m http.server 3000` (or equivalent static server) and visit `http://localhost:3000`. Do not open `index.html` directly via `file://` because browsers block module imports and `fetch`.
