# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `generatePostIndex.mjs` as prebuild, then `tsc -b && vite build`)
- **Lint:** `npm run lint`
- **Preview production build:** `npm run preview`
- **Generate blog post index:** `npm run generate:posts`

## Architecture

This is a personal portfolio website built with React + TypeScript + Vite. The site renders all content as a **character matrix** — a full-screen grid of monospaced Unicode characters (Unifont) that animates via a spring-lattice physics simulation.

### Core rendering pipeline

1. **`CharacterMatrix`** (`characterMatrix.tsx`) — Top-level React component. Manages a `<div>` whose `innerHTML` is directly set to the character grid (no React rendering per-cell). Runs a `requestAnimationFrame` loop calling `MatrixView.update()`.

2. **`MatrixView`** (`matrixView.ts`) — Extends `ParentElement`. Owns three `CharMatrix` buffers: animation matrix (spring lattice displacement), content matrix (text from elements), and final/surface matrix (merged output). Handles coordinate transforms between normalized [0,1], pixel, and character-grid spaces.

3. **`SpringLattice`** (`springLattice.ts`) — Physics simulation of a 2D spring mesh. Mouse/touch interaction applies an attractor force that displaces characters. Updated on a 20ms interval independent of the render loop.

4. **`MatrixController`** (`matrixController.ts`) — Page router (not React Router — it drives page transitions within the matrix). Maps URL paths to `Page` instances and orchestrates enter/exit animations between pages.

### Element system (`MatrixElement/`)

A custom layout engine for positioning text within the character grid. Key classes:

- **`Element`** — Base class with sizing modes (`absolute`, `relative`, `expand`, `content`), padding, borders, scroll, cursor types, and enter/exit `TransitionSequence` animations.
- **`ParentElement`** — Adds child layout (vertical stacking).
- **`ContainerElement`**, **`ContentContainerElement`** — Layout containers.
- **`TextElement`**, **`ParagraphElement`**, **`HeaderElement`**, **`TitleElement`**, **`LinkElement`** — Text rendering elements with word-wrapping and click handling.
- **`ReactComponentElement`** — Embeds actual React components (used for blog posts with interactive MDX content) by reporting position/size via `ReactNodeConfig` callback.

### Pages (`Pages/`)

Each page extends the abstract `Page` class and builds its layout by composing `MatrixElement` instances. Pages define `enterPage()` and `exitPage()` with animation sequences. The `LINKS` array in `Page.ts` defines the nav menu.

### Blog system (`blogPosts/`)

- Blog posts live in subdirectories under `src/blogPosts/` (e.g., `about-site-part1/`).
- Each post has a `content.mdx` file and `metaData.json`.
- Posts are registered in `post-list.ts` with static imports.
- MDX is processed with `remark-math` + `rehype-katex` for LaTeX math support.
- `BlogPost.tsx` renders posts as positioned overlays on top of the character matrix.

### Styling

- Tailwind CSS v4 (via `@tailwindcss/vite` plugin) for blog post and UI component styling.
- shadcn/ui components in `src/components/ui/`.
- The character matrix itself uses inline styles with Unifont at 16px (`FONT_SIZE` in `constants.ts`).
- Path alias: `@` maps to `src/`.

### Key coordinate systems

The codebase works with multiple coordinate representations:
- **NormPoint** — Normalized [0,1] coordinates
- **RealPoint** — Pixel coordinates
- **IntPoint** — Character grid coordinates (column, row)
