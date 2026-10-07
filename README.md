# J-MPO

Media Plan Optimizer UI — implemented from Figma frame **MPO 1** (`FOJM27a27rICFQk138sRfx`, node `1:33651`).

## Stack

- React 19 + TypeScript
- Vite
- CSS Modules (Measured design tokens, no Tailwind)

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

## Figma

- Design: [MPO 1 in Figma](https://www.figma.com/design/FOJM27a27rICFQk138sRfx/Untitled?node-id=1-33651)
- Reference screenshot: `reference-screenshot.png`
- Remote image assets in `src/assets/figma.ts` expire after ~7 days; replace with local assets for production.

## Pages

- **Optimize → MPO** (`#/optimize`, default)
- **Experiment → Geo Tests** (`#/experiment/geo`) — test list with status filters/search, KPI cards,
  and a Geo-specific Mia assistant whose guided flow designs a new geo test and adds it as a draft.

## Structure

```
src/
  components/   Top nav, hero, tabs, curve panel, budget table, Mia panel + guided flows
  geo/          Geo Tests mock data, test-design logic, Mia prompts/replies
  mpo/          MPO state, data and build-plan logic
  pages/        MpoPage, GeoPage
  styles/       Design tokens + global styles
```
# J-MPO
