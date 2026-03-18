# Vaulty Viewer

TanStack Start viewer for Vaulty notes and task surfaces.

## Quick start

```sh
pnpm install
pnpm run dev
```

## Scripts

- `pnpm run dev` -> local dev server
- `pnpm run build` -> production build
- `pnpm run start` -> run built app

## Environment

- `VAULT_API_URL` (optional): absolute API URL when not using same-origin `/api` proxy.
- `PORT` (default: `8000`): viewer server port.
- `HOST` (default: `0.0.0.0`): bind address for container/dev.

## Container run

```sh
docker build -t vault-viewer:latest -f apps/viewer/Dockerfile .
docker run --rm -p 8000:8000 -e VAULT_API_URL=http://host.docker.internal:4300 vault-viewer:latest
```
