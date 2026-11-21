# QAMAL Shared Pixel Art Assets

**Participant #4** owns the approved PNG and `assets/manifest.json`. Native tile size: **32×32 px**, top-down 2D, nearest-neighbor scaling.

## Current catalog

- `assets/characters/player/erasyl.png`
- `assets/characters/prisoners/prisoner.png`
- `assets/characters/guards/guard_blue.png`
- `assets/characters/guards/guard_senior.png`
- `assets/tiles/floors/concrete.png`, `dark_concrete.png`
- `assets/tiles/walls/concrete.png`
- `assets/tiles/doors/metal.png`, `bars.png`, `exit.png`
- `assets/tiles/props/bed.png`, `desk.png`, `terminal.png`, `camera.png`

Older flat `assets/*.png` files remain for compatibility but should no longer be referenced in new code. Always resolve IDs through `assets/manifest.json`. Portaits and character variants reuse these PNGs for the MVP; no 1000 unique portraits are required.
