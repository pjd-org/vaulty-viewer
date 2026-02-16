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
- Runtime: **Node.js 20+** (monorepo standard).
- Typical commands should be run with `pnpm -C apps/viewer ...` unless the root script is explicitly required.

## Build / Test / Run (Viewer)
- I don’t know the exact scripts for the viewer; **always check `apps/viewer/package.json`**.
- Use the scripts found there (e.g., `dev`, `build`, `test`, `lint`) and document any prerequisites you discover.
- If you add or change scripts, update `apps/viewer/package.json` consistently.

## Code Navigation
- UI code lives under `apps/viewer/src/`.
- Gatsby config and build settings are typically in `apps/viewer/gatsby-config.*` and related Gatsby files.

## Change Discipline
- Keep UI changes localized to `apps/viewer`.
- If you need shared logic, use existing packages in `packages/` rather than duplicating code.
- Update documentation if behavior or user-facing routes change.