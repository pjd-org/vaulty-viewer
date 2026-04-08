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
    <main className="min-h-dvh px-4 py-6 text-slate-800 antialiased">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-[20px] border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur-sm">
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Vault Auth
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Use your Vault account to continue.
            </p>
          </div>

          {search.error ? (
            <p
              className="mb-4 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
              role="alert"
            >
              {search.error}
            </p>
          ) : null}

          <form method="post" action="/auth/login">
            <input type="hidden" name="return_to" value={returnTo} />
            <div className="mb-4 flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-slate-600"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
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
                className="text-sm font-medium text-slate-600"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              className="mt-2 inline-flex w-full items-center justify-center rounded-[8px] bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:bg-sky-800"
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
