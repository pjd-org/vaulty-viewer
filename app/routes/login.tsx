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
    <main
      className="relative min-h-dvh overflow-hidden bg-[#f4f2ed] px-4 py-8 text-[#181615] antialiased"
      style={{
        fontFamily:
          '"Avenir Next", "Helvetica Neue", "Segoe UI", sans-serif',
      }}
    >
      <div
        className="pointer-events-none absolute -left-20 top-[-12rem] h-[26rem] w-[26rem] rounded-full opacity-65 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(223,84,27,0.4), rgba(223,84,27,0.02) 62%)',
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-[-12rem] h-[28rem] w-[28rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(9,96,151,0.3), rgba(9,96,151,0.03) 68%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18,16,15,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(18,16,15,0.08) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 md:grid-cols-[1.1fr_minmax(320px,430px)]">
          <aside className="hidden rounded-[36px] border border-[#171310]/20 bg-[#f7f4ef]/80 p-10 md:flex md:flex-col md:justify-between">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.42em] text-[#6a5950]">
                Vault Control
              </p>
              <h1
                className="max-w-[14ch] text-[3.2rem] leading-[0.95] tracking-[-0.03em] text-[#171411]"
                style={{ fontFamily: '"Iowan Old Style", "Palatino", serif' }}
              >
                Signal before noise.
              </h1>
              <p className="mt-5 max-w-[30ch] text-[0.95rem] leading-relaxed text-[#4a3f39]">
                Authenticate to continue into your planning surface, execution
                loop, and cod-level controls.
              </p>
            </div>
            <div className="mt-8 border-t border-[#171310]/15 pt-6 text-xs uppercase tracking-[0.22em] text-[#78685d]">
              Runtime secured · Paris node
            </div>
          </aside>

          <div className="relative w-full rounded-[30px] border border-[#1d1815]/18 bg-[#fffdfa]/88 p-6 shadow-[0_24px_90px_rgba(29,23,19,0.2)] backdrop-blur-sm sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#7c6a5f]">
                  Vault Auth
                </p>
                <h2
                  className="text-4xl tracking-[-0.02em] text-[#171411]"
                  style={{ fontFamily: '"Iowan Old Style", "Palatino", serif' }}
                >
                  Sign in
                </h2>
              </div>
              <span className="rounded-full border border-[#1f1915]/20 bg-white/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6a5950]">
                Secure
              </span>
            </div>

            {search.error ? (
              <p
                className="mb-4 rounded-xl border border-[#d13f25]/40 bg-[#fff1ec] px-3 py-2 text-sm text-[#9e2f1b]"
                role="alert"
              >
                {search.error}
              </p>
            ) : null}

            <form className="space-y-4" method="post" action="/auth/login">
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b4c43]"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-[#251f1b]/20 bg-white/88 px-3.5 py-3 text-base text-[#1e1a18] outline-none transition duration-200 placeholder:text-[#8c7b70] focus:border-[#cf5426] focus:ring-2 focus:ring-[#cf5426]/25"
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@vault.local"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b4c43]"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="w-full rounded-xl border border-[#251f1b]/20 bg-white/88 px-3.5 py-3 text-base text-[#1e1a18] outline-none transition duration-200 focus:border-[#cf5426] focus:ring-2 focus:ring-[#cf5426]/25"
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button
                className="group mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#171411] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#f7f2ea] transition duration-200 hover:bg-[#2a221e] active:translate-y-px"
                type="submit"
              >
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  Enter Vault
                </span>
              </button>
            </form>

            <p className="mt-5 text-[0.72rem] uppercase tracking-[0.14em] text-[#7f6d61]">
              By continuing, you agree to runtime policy and audit logging.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
