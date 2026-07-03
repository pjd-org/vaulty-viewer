import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { PrimaryButton } from '../components/ui';
import { PageFrame, SoftPanel } from '../components/layout';

type ResetPasswordSearch = {
  token?: string;
  error?: string;
};

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const search = Route.useSearch();
  const token = typeof search.token === 'string' ? search.token : '';
  const canReset = token.length > 0 && !search.error;

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
          title="Set password"
          subtitle="Complete a verified Vaulty password reset."
          statusLine="Vault Auth"
          nextAction="Credential update"
          actions={<Badge variant="muted">Session reset</Badge>}
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
                    New password
                  </h1>
                  <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                    Set a new workspace password. Active sessions will be
                    cleared.
                  </p>
                </div>
                <Badge variant="muted">Secure</Badge>
              </div>

              {!canReset ? (
                <p
                  className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  The reset link is invalid or expired.
                </p>
              ) : null}

              <form
                className="flex flex-col gap-4"
                method="post"
                action="/auth/password-reset/complete"
              >
                <input type="hidden" name="token" value={token} />
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
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={!canReset}
                  />
                </div>
                <PrimaryButton
                  className="mt-3 w-full rounded-xl px-4 py-3 text-sm uppercase tracking-[0.14em]"
                  type="submit"
                  disabled={!canReset}
                >
                  Update Password
                </PrimaryButton>
              </form>
            </div>
          </SoftPanel>
        </PageFrame>
      </section>
    </main>
  );
}
