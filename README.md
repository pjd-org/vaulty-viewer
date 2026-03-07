# Vaulty Viewer

Gatsby-based viewer for Vaulty notes, plus Decap CMS for in-browser markdown edits.

## Quick start

```sh
pnpm install
pnpm run develop
```

## Environment

- `VAULT_CONTENT_PATH` (default: `./content`): path to the vault volume.
- `PORT` (default: `4400`): runtime nginx port inside the container.
- `BUILD_ON_START` (default: `1`): build on container start.

## CMS config

Update `static/admin/config.yml` with your GitHub repo and OAuth settings.
For self-hosted auth, you will need a GitHub OAuth app and callback URL
pointing to `/admin/` on the viewer host.

## Public repo checklist

- Keep `.env` and tokens out of git (use `.env.example` for defaults).
- `static/admin/config.yml` should only include repo metadata (no secrets).
- Use `auth_scope: public_repo` for public repos, switch to `repo` for private.

## Container run

```sh
docker build -t vault-viewer:latest .
docker run --rm -p 8080:4400 -e VAULT_CONTENT_PATH=/vault -e BUILD_ON_START=1 -v /path/to/vault:/vault vault-viewer:latest
```
