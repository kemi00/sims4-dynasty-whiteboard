# The Sims 4 — Dynasty Whiteboard

Interactive family-tree whiteboard for Sims 4 dynasties. Pre-loaded with 344 sims across households and worlds. Drag sims, draw connections, filter by game pack, and save your work.

## Requirements

- [pnpm](https://pnpm.io/) (npm is not used in this project)

## Local development

```bash
pnpm install
pnpm dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

## Build

```bash
pnpm build
pnpm preview
```

## Save / load

- **Save .json** — downloads your current board state (node positions, edges you added, hidden packs).
- **Load** — restores a previously saved `.json` file.

## Deploy

Production site: _(Vercel URL added after deploy)_

## Stack

- React + TypeScript
- Vite
- pnpm
- Hosted on Vercel
