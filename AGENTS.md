# MediFlow UX Prototype

React + Vite + TypeScript + Tailwind CSS prototype exported from Figma Make.

This repository is the UX reference prototype for MediFlow. It is NOT the
production frontend and must not be treated as the source architecture for the
real MediFlow application.

## Purpose

Use this project to:

- preserve the approved MediFlow UX;
- refine and validate mockups and interactions;
- verify desktop, tablet and mobile behavior;
- serve as the visual and interaction reference for implementation in the real
  MediFlow frontend.

Do not introduce production architecture, Backend integrations or unrelated
features unless explicitly requested.

## Development

Toolchain:

- Node.js 22
- pnpm 10.34.3

Install:

pnpm install --frozen-lockfile

Development server:

pnpm dev

The current Vite configuration uses port 8443 by default:

http://localhost:8443/

Build:

pnpm build

TypeScript validation:

pnpm exec tsc --noEmit

Formatting:

pnpm format

## Project Structure

Start with task-relevant files and follow imports only when necessary.

- `src/main.tsx` — React entrypoint
- `src/App.tsx` — prototype view/scenario orchestration
- `src/index.css` — global CSS and Tailwind CSS v4 entrypoint
- `src/components/` — product views and shared components
- `src/data/` — prototype fixtures and scenarios
- `src/types/` — prototype/canonical data types
- `public/` — static prototype assets
- `vite.config.ts` — Vite, React, Tailwind and retained Figma Make tooling

## Product Views

The prototype currently contains:

- Procesamiento de documentos
- Resultado del procesamiento
- Auditoría de documentos
- Revisión clínica
- Historial del documento

The shared App Shell is also part of the approved UX reference.

## Styling

Use the existing MediFlow design system.

- Primary font: Plus Jakarta Sans
- Do not replace it with Inter or another font.
- Tailwind CSS v4 is used through `@tailwindcss/vite`.
- Use the established colors, typography, spacing and component behavior.
- Do not redesign approved views unless explicitly requested.
- Do not add shadows, gradients or generic AI-style components without a
  product reason.

## Prototype Constraints

Preserve approved scenarios, fixtures, routing behavior and canonical Backend
contract shapes unless a task explicitly requires changing them.

Do not:

- invent Backend capabilities;
- change enums or API contract semantics;
- add authentication;
- add unsupported global modules;
- expose OCI internals;
- replace approved interactions with arbitrary alternatives.

This project contains synthetic prototype data only.

## Working With Codex

Before modifying code:

1. Inspect the task-relevant implementation.
2. Understand existing behavior and types.
3. Keep changes narrowly scoped.
4. Do not perform unrelated refactors.
5. Run validation after changes.

For TypeScript or implementation fixes, do not silence errors using:

- `any`
- `@ts-ignore`
- `@ts-expect-error`
- unsafe casts

unless explicitly justified.

After a code change, normally run:

pnpm exec tsc --noEmit
pnpm build

Report the files changed and validation results.