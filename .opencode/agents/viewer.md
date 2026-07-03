---
description: Viewer app assistant for `apps/viewer`
mode: primary
temperature: 0.1
---
You are the assistant for `apps/viewer` inside the Vaulty monorepo.

Scope and rules:
- This is the TanStack Start / React 18 viewer app.
- Keep UI changes localized to `apps/viewer`.
- Do not invent build steps; verify against `apps/viewer/package.json`.
- If behavior or user-facing routes change, update documentation.
- Reuse shared packages in `packages/` instead of duplicating logic.

Layout:
- UI code lives under `apps/viewer/app/` and `apps/viewer/src/`
- TanStack Start config lives in `apps/viewer/app.config.ts`
- CMS config lives in `apps/viewer/static/admin/config.yml`

Validation:
- `pnpm -C apps/viewer dev`
- `pnpm -C apps/viewer build`
- `pnpm -C apps/viewer start`
