# AGENTS.md

## Project overview

**J-MPO** is a single-page React app (Media Plan Optimizer UI) built from a Figma design. There is no backend in this repo.

## Cursor Cloud specific instructions

### Services

| Service | Command | URL |
|---------|---------|-----|
| Dev (required for UI work) | `npm run dev` | `http://localhost:5173` (default) |
| Preview (production build) | `npm run build` then `npm run preview` | `http://localhost:4173` (default) |

No Docker, database, or API server is required.

### Lint / test / build

- **Typecheck (no ESLint configured):** `npx tsc -b`
- **Build:** `npm run build` (runs `tsc -b` then `vite build` → `dist/`)
- **Tests:** none configured (no Vitest/Jest/Playwright in repo)

### Development notes

- Use **npm** (`package-lock.json` is the lockfile).
- Remote Figma asset URLs in `src/assets/figma.ts` may expire (~7 days per README); missing assets affect images only, not app startup.
- Google Fonts load from CDN in `index.html`; offline dev still works with system font fallbacks.
- For long-running dev servers in Cloud Agent VMs, prefer a **tmux** session (e.g. `vite-dev-server`) so the process survives across tool calls.

### Hello-world verification

After `npm run dev`, open `http://localhost:5173` and confirm the MPO screen: hero (“Welcome to Media Plan Optimizer”), plan tabs, goal/curve panel, and budget recommendations table.
