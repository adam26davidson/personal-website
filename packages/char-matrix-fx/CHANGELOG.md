# @adam26davidson/char-matrix-fx

## 0.0.3

### Patch Changes

- 78fc2fd: Fix animation completion leaving stale characters on the animation layer by clearing it when the animation finishes.
- bb85f32: Fix dist output layout so published package resolves correctly. Added rootDir and removed baseUrl/paths that caused nested output structure.
- fef1534: Remove unnecessary async from SpringLattice.update() to avoid creating a throwaway Promise every tick.
- 3302e8d: Update top_similar.json with expanded character similarity data (1,765 characters, up from 1,454) including block elements and fullwidth variants, with recalculated rankings.
- Updated dependencies [fff0140]
- Updated dependencies [6dbd4ee]
- Updated dependencies [115954a]
- Updated dependencies [5cebc82]
- Updated dependencies [2930fc0]
- Updated dependencies [cbdcd40]
- Updated dependencies [b13a093]
  - @adam26davidson/char-matrix@0.0.4

## 0.0.2

### Patch Changes

- 0190602: Extract text UI system into publishable packages with pure event-based scrolling, sub-character octant scrollbar, and draggable thumb
- Updated dependencies [0190602]
- Updated dependencies [d7b6c83]
  - @adam26davidson/char-matrix@0.0.2
