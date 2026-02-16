# Copilot Instructions — Viewer App (Gatsby)

## Scope
- This file applies to the **viewer app** at `apps/viewer` inside the `vault-platform-full` monorepo.
- The viewer is a **Gatsby 5 / React 18** web UI that renders and browses vault content.

## Operating Mode
- Be execution-first: give concrete steps and code changes.
- Prefer simple solutions (KISS) and avoid unnecessary abstractions (YAGNI).
- Don’t invent build steps—verify against `apps/viewer/package.json`.

## Repository Context
- Monorepo with **pnpm workspaces**.
- Runtime: **Node.js >=20** (see `engines` in `package.json`).
- Typical commands should be run with `pnpm -C apps/viewer ...` unless the root script is explicitly required.

## Build / Test / Run (Viewer)
- Scripts (from `package.json`):
  - `pnpm -C apps/viewer dev` (runs `./scripts/dev.sh`)
  - `pnpm -C apps/viewer build` (Gatsby build)
  - `pnpm -C apps/viewer serve` (Gatsby serve on `0.0.0.0:8000`)
  - `pnpm -C apps/viewer clean` (Gatsby clean)
- If you add or change scripts, update `apps/viewer/package.json` consistently.

## Code Navigation
- UI code lives under `apps/viewer/src/`.
- Gatsby config and build settings are typically in `apps/viewer/gatsby-config.*` and related Gatsby files.
- CMS config is in `apps/viewer/static/admin/config.yml` (avoid secrets).

## Change Discipline
- Keep UI changes localized to `apps/viewer`.
- If you need shared logic, use existing packages in `packages/` rather than duplicating code.
- Update documentation if behavior or user-facing routes change.

## Validation
- Only claim commands ran if you actually ran them.
- If you didn’t run commands, say so explicitly.