# MediFlow UX Prototype

Final UX and functional reference for MediFlow, exported from Figma Make. This
prototype uses synthetic data and is separate from the production frontend.

## Requirements

- Node.js 22
- pnpm 10.34.3

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:8443/>.

## Validation

```bash
pnpm exec tsc --noEmit
pnpm build
```
