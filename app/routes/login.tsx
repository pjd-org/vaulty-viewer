import { createFileRoute } from '@tanstack/react-router';

type LoginSearch = {
  return_to?: string;
  error?: string;
};

const normalizeReturnTo = (value: unknown): string => {
  if (typeof value !== 'string') return '/';
  const trimmed = value.trim();
  if (!trimmed) return '/';
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  if (trimmed.includes('\\')) return '/';
  return trimmed;
};

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    return_to:
      typeof search.return_to === 'string' ? search.return_to : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const search = Route.useSearch();
  const returnTo = normalizeReturnTo(search.return_to);

  return (
    <main className="min-h-dvh bg-[var(--vault-bg)] px-4 py-6 text-[var(--vault-ink)] antialiased">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-[20px] border border-[var(--vault-border-subtle)] bg-[var(--vault-surface)] p-8 shadow-[var(--vault-shadow)]">
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--vault-muted)]">
              Vault Auth
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-[var(--vault-muted)]">
              Use your Vault account to continue.
            </p>
          </div>

          {search.error ? (
            <p
              className="mb-4 rounded-[8px] border border-[color-mix(in_srgb,var(--vault-status-fail)_25%,transparent)] bg-[color-mix(in_srgb,var(--vault-status-fail)_10%,transparent)] px-3 py-2 text-sm text-[var(--vault-status-fail)]"
              role="alert"
            >
              {search.error}
            </p>
          ) : null}

          <form method="post" action="/auth/login">
            <input type="hidden" name="return_to" value={returnTo} />
            <div className="mb-4 flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-[var(--vault-muted)]"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="w-full rounded-[8px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-2)] px-3 py-2.5 text-base text-[var(--vault-ink)] outline-none transition focus:border-[var(--vault-accent)] focus:ring-3 focus:ring-[var(--vault-glow)]"
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@example.com…"
                required
              />
            </div>
            <div className="mb-5 flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-[var(--vault-muted)]"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="w-full rounded-[8px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-2)] px-3 py-2.5 text-base text-[var(--vault-ink)] outline-none transition focus:border-[var(--vault-accent)] focus:ring-3 focus:ring-[var(--vault-glow)]"
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              className="mt-2 inline-flex w-full items-center justify-center rounded-[8px] bg-[var(--vault-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:opacity-80"
              type="submit"
            >
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
