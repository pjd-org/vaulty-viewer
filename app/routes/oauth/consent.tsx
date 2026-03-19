import { createFileRoute, Link } from '@tanstack/react-router'

type ConsentSearch = {
  client_id?: string
  redirect_uri?: string
  scope?: string
  state?: string
  code_challenge?: string
  code_challenge_method?: string
  resource?: string
}

export const Route = createFileRoute('/oauth/consent')({
  validateSearch: (search: Record<string, unknown>): ConsentSearch => ({
    client_id:
      typeof search.client_id === 'string' ? search.client_id : undefined,
    redirect_uri:
      typeof search.redirect_uri === 'string' ? search.redirect_uri : undefined,
    scope: typeof search.scope === 'string' ? search.scope : undefined,
    state: typeof search.state === 'string' ? search.state : undefined,
    code_challenge:
      typeof search.code_challenge === 'string'
        ? search.code_challenge
        : undefined,
    code_challenge_method:
      typeof search.code_challenge_method === 'string'
        ? search.code_challenge_method
        : undefined,
    resource:
      typeof search.resource === 'string' ? search.resource : undefined,
  }),
  component: OAuthConsentRoute,
})

function OAuthConsentRoute() {
  const search = Route.useSearch()
  const scopes = (search.scope || '')
    .split(' ')
    .map((scope) => scope.trim())
    .filter(Boolean)

  if (!search.client_id || !search.redirect_uri) {
    return (
      <main className="min-h-dvh bg-[var(--vault-bg)] px-4 py-6 text-[var(--vault-ink)] antialiased">
        <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl items-center justify-center">
          <div className="w-full rounded-[20px] border border-[var(--vault-border-subtle)] bg-[var(--vault-surface)] p-8 shadow-[var(--vault-shadow)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--vault-muted)]">
              OAuth Authorization
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Invalid request
            </h1>
            <p className="mt-3 text-[var(--vault-muted)]">
              Missing OAuth client parameters.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center rounded-[8px] bg-[var(--vault-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:opacity-80"
            >
              Go to sign in
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[var(--vault-bg)] px-4 py-6 text-[var(--vault-ink)] antialiased">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl items-center justify-center">
        <div className="w-full rounded-[20px] border border-[var(--vault-border-subtle)] bg-[var(--vault-surface)] p-8 shadow-[var(--vault-shadow)]">
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--vault-muted)]">
              OAuth Authorization
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Authorize Vault Access
            </h1>
            <p className="mt-3 text-base leading-7 text-[var(--vault-ink)]">
              Client <strong>{search.client_id}</strong> is requesting access.
            </p>
          </div>

          <div className="mb-6 rounded-[8px] border border-[var(--vault-border-faint)] bg-[var(--vault-surface-2)] px-4 py-3 text-sm text-[var(--vault-muted)]">
            {scopes.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {scopes.map((scope) => (
                  <li
                    key={scope}
                    className="rounded-[999px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-3)] px-2 py-0.5 text-xs"
                  >
                    {scope}
                  </li>
                ))}
              </ul>
            ) : (
              <span>Scopes: (none)</span>
            )}
          </div>

          <form method="post" action="/auth/oauth/authorize">
            <input type="hidden" name="client_id" value={search.client_id} />
            <input
              type="hidden"
              name="redirect_uri"
              value={search.redirect_uri}
            />
            <input type="hidden" name="scope" value={search.scope || ''} />
            <input type="hidden" name="state" value={search.state || ''} />
            <input
              type="hidden"
              name="code_challenge"
              value={search.code_challenge || ''}
            />
            <input
              type="hidden"
              name="code_challenge_method"
              value={search.code_challenge_method || ''}
            />
            <input type="hidden" name="resource" value={search.resource || ''} />

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex flex-1 items-center justify-center rounded-[8px] bg-[var(--vault-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:opacity-80"
                type="submit"
                name="decision"
                value="approve"
              >
                Approve
              </button>
              <button
                className="inline-flex flex-1 items-center justify-center rounded-[8px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-3)] px-4 py-2.5 text-sm font-semibold text-[var(--vault-ink)] transition hover:opacity-90 active:opacity-80"
                type="submit"
                name="decision"
                value="deny"
              >
                Deny
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
