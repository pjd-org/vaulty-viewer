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
      className="relative min-h-dvh overflow-hidden bg-background px-4 py-8 text-foreground antialiased"
      style={{
        fontFamily: 'var(--font-sans)',
        background:
          'radial-gradient(circle at 14% 18%, color-mix(in_srgb,var(--a-sky)_28%,transparent), transparent 28%), radial-gradient(circle at 84% 12%, color-mix(in_srgb,var(--a-lilac)_20%,transparent), transparent 24%), linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface) 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -left-20 top-[-12rem] h-[26rem] w-[26rem] rounded-full opacity-65 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, color-mix(in_srgb,var(--a-peach)_36%,transparent), color-mix(in_srgb,var(--a-peach)_4%,transparent) 62%)',
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-[-12rem] h-[28rem] w-[28rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, color-mix(in_srgb,var(--a-sky)_30%,transparent), color-mix(in_srgb,var(--a-sky)_4%,transparent) 68%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in_srgb,var(--border-default)_16%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in_srgb,var(--border-default)_16%,transparent) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl items-center justify-center">
        <PageFrame
          title="Sign in"
          subtitle="Authenticate to continue into your planning surface, execution loop, and cod-level controls."
          statusLine="Vault Control"
          nextAction="Secure access"
          actions={<Badge variant="muted">Audit logged</Badge>}
        >
          <div className="grid w-full gap-6 md:grid-cols-[1.1fr_minmax(320px,430px)]">
            <SoftPanel
              variant="hero"
              className="hidden min-h-[420px] flex-col justify-between p-10 md:flex"
            >
              <div>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.42em] text-[var(--text-secondary)]">
                  Vault Control
                </p>
                <h1
                  className="max-w-[14ch] text-[3.2rem] leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--vault-font-newsreader)' }}
                >
                  Signal before noise.
                </h1>
                <p className="mt-5 max-w-[30ch] text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
                  Authenticate to continue into your planning surface, execution
                  loop, and cod-level controls.
                </p>
              </div>
              <div className="mt-8 space-y-3 border-t border-border pt-6">
                {[
                  { label: 'Surfaces', value: 'Home · Inbox · Actions' },
                  { label: 'Runtime', value: 'Paris node' },
                  { label: 'Security', value: 'Audit logged' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                      {label}
                    </span>
                    <span className="text-[10px] text-[var(--text-primary)]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </SoftPanel>

            <SoftPanel variant="elevated" className="p-0 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--text-tertiary)]">
                      Vault Auth
                    </p>
                    <h2
                      className="text-4xl tracking-[-0.02em] text-[var(--text-primary)]"
                      style={{ fontFamily: 'var(--vault-font-newsreader)' }}
                    >
                      Enter
                    </h2>
                    <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                      Use your workspace credentials to enter the viewer.
                    </p>
                  </div>
                  <Badge variant="muted">Secure</Badge>
                </div>

                {search.error ? (
                  <p
                    className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
                      className="h-12 rounded-xl border-border bg-card px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-[color-mix(in_srgb,var(--primary)_24%,transparent)]"
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
                      className="h-12 rounded-xl border-border bg-card px-3.5 py-3 text-base text-foreground focus:border-primary focus:ring-[color-mix(in_srgb,var(--primary)_24%,transparent)]"
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
