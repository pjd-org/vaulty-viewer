import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { PrimaryButton } from '../components/ui';
import { PageFrame, SoftPanel } from '../components/layout';

type ForgotPasswordSearch = {
  sent?: string;
  error?: string;
};

export const Route = createFileRoute('/forgot-password')({
  validateSearch: (search: Record<string, unknown>): ForgotPasswordSearch => ({
    sent: typeof search.sent === 'string' ? search.sent : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
  const search = Route.useSearch();
  const sent = search.sent === '1';

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-background px-4 py-8 text-foreground antialiased"
      style={{
        fontFamily: 'var(--font-sans)',
        background:
          'radial-gradient(circle at 14% 18%, color-mix(in_srgb,var(--a-sky)_28%,transparent), transparent 28%), radial-gradient(circle at 84% 12%, color-mix(in_srgb,var(--a-lilac)_20%,transparent), transparent 24%), linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface) 100%)',
      }}
    >
      <section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl items-center justify-center">
        <PageFrame
          title="Reset access"
          subtitle="Request a password reset link for your Vaulty account."
          statusLine="Vault Auth"
          nextAction="Password reset"
          actions={<Badge variant="muted">Email link</Badge>}
        >
          <SoftPanel variant="elevated" className="w-full p-0 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--text-tertiary)]">
                    Vault Auth
                  </p>
                  <h1
                    className="text-4xl tracking-[-0.02em] text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--vault-font-newsreader)' }}
                  >
                    Forgot password
                  </h1>
                  <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                    Enter your account email. If it exists, a reset link will be
                    sent.
                  </p>
                </div>
                <Badge variant="muted">Secure</Badge>
              </div>

              {sent ? (
                <p
                  className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
                  role="status"
                >
                  If an account exists, a reset email will be sent.
                </p>
              ) : null}

              {search.error ? (
                <p
                  className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  Password reset is temporarily unavailable.
                </p>
              ) : null}

              <form
                className="flex flex-col gap-4"
                method="post"
                action="/auth/password-reset"
              >
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
                <PrimaryButton
                  className="mt-3 w-full rounded-xl px-4 py-3 text-sm uppercase tracking-[0.14em]"
                  type="submit"
                >
                  Send Reset Link
                </PrimaryButton>
              </form>
            </div>
          </SoftPanel>
        </PageFrame>
      </section>
    </main>
  );
}
