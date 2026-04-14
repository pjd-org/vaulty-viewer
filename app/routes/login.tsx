import { createFileRoute } from '@tanstack/react-router';
import { Badge, Input, PrimaryButton } from '../components/ui';
import { PageFrame, SoftPanel } from '../components/layout';

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
        fontFamily: '"Avenir Next", "Helvetica Neue", "Segoe UI", sans-serif',
        background:
          'radial-gradient(circle at 14% 18%, rgba(165, 207, 255, 0.28), transparent 28%), radial-gradient(circle at 84% 12%, rgba(216, 199, 255, 0.20), transparent 24%), linear-gradient(180deg, #f7f5f1 0%, #eeebe6 100%)',
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
        <PageFrame
          title="Sign in"
          subtitle="Authenticate to continue into your planning surface, execution loop, and cod-level controls."
          statusLine="Vault Control"
          nextAction="Secure access"
          actions={<Badge variant="secondary">Audit logged</Badge>}
        >
          <div className="grid w-full gap-6 md:grid-cols-[1.1fr_minmax(320px,430px)]">
            <SoftPanel
              variant="hero"
              className="hidden min-h-[420px] flex-col justify-between p-10 md:flex"
            >
              <div>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.42em] text-[#9c8070]">
                  Vault Control
                </p>
                <h1
                  className="max-w-[14ch] text-[3.2rem] leading-[0.95] tracking-[-0.03em] text-[#f0ebe3]"
                  style={{ fontFamily: '"Iowan Old Style", "Palatino", serif' }}
                >
                  Signal before noise.
                </h1>
                <p className="mt-5 max-w-[30ch] text-[0.95rem] leading-relaxed text-[#d1c8c0]">
                  Authenticate to continue into your planning surface, execution
                  loop, and cod-level controls.
                </p>
              </div>
              <div className="mt-8 space-y-3 border-t border-[#ffffff]/10 pt-6">
                {[
                  { label: 'Surfaces', value: 'Home · Inbox · Actions' },
                  { label: 'Runtime', value: 'Paris node' },
                  { label: 'Security', value: 'Audit logged' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b6a99b]">
                      {label}
                    </span>
                    <span className="text-[10px] text-[#efe8df]">{value}</span>
                  </div>
                ))}
              </div>
            </SoftPanel>

            <SoftPanel variant="elevated" className="p-0 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#7c6a5f]">
                      Vault Auth
                    </p>
                    <h2
                      className="text-4xl tracking-[-0.02em] text-[#171411]"
                      style={{
                        fontFamily: '"Iowan Old Style", "Palatino", serif',
                      }}
                    >
                      Enter
                    </h2>
                    <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                      Use your workspace credentials to enter the viewer.
                    </p>
                  </div>
                  <Badge variant="secondary">Secure</Badge>
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
                      className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <Input
                      className="h-12 rounded-xl border-[var(--border-glass)] bg-white/88 px-3.5 py-3 text-base text-[#1e1a18] placeholder:text-[#7d776f] focus:border-[var(--a-sky)] focus:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)]"
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
                      className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <Input
                      className="h-12 rounded-xl border-[var(--border-glass)] bg-white/88 px-3.5 py-3 text-base text-[#1e1a18] focus:border-[var(--a-sky)] focus:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)]"
                      id="password"
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <PrimaryButton
                    className="mt-3 w-full rounded-xl px-4 py-3 text-sm uppercase tracking-[0.14em]"
                    type="submit"
                  >
                    Enter Vault
                  </PrimaryButton>
                </form>

                <p className="mt-5 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  By continuing, you agree to runtime policy and audit logging.
                </p>
              </div>
            </SoftPanel>
          </div>
        </PageFrame>
      </section>
    </main>
  );
}
