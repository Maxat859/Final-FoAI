# QAMAL Pixel Art Style Guide — Participant #4

- View: **top-down 2D**, original hand-styled Pixel Art, no isometric mix.
- Native tile and character cell: **32×32 px**. Sprite IDs live only in `assets/manifest.json`; logic never hard-codes PNG paths.
- Theme: navy `#090e15`, wall `#425564`, panel `#142637`, steel `#55728a`, gold `#e1b25c`, alert `#c55d5a`, success `#75bf90`.
- Interpolation: Canvas `imageSmoothingEnabled = false`, CSS `image-rendering: pixelated`.
- The original 14 PNG sprites are located under `assets/tiles` and `assets/characters` and can be reused without creating 1000 portraits.
- Reusable portrait IDs `portrait.erasyl`, `portrait.default`, etc. resolve to existing PNG fallback, never broken image paths.
- Participant #4 owns sprite art and this manifest; other developers only reference IDs.
- Controls: WASD / arrows to move, E to interact, M to show explored map, Escape to close panel.
