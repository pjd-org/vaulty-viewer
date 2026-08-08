import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '@/app/components/ui/badge';
import { PrimaryButton, SecondaryButton } from '../../components/ui';
import { PageFrame, SoftPanel } from '../../components/layout';

type ConsentSearch = {
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  resource?: string;
};

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
    resource: typeof search.resource === 'string' ? search.resource : undefined,
  }),
  component: OAuthConsentRoute,
});

function OAuthConsentRoute() {
  const search = Route.useSearch();
  const scopes = (search.scope || '')
    .split(' ')
    .map((scope) => scope.trim())
    .filter(Boolean);

  if (!search.client_id || !search.redirect_uri) {
    return (
      <main className="min-h-dvh px-4 py-6 text-foreground antialiased">
        <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl items-center justify-center">
          <PageFrame
            title="Invalid request"
            subtitle="Missing OAuth client parameters."
            statusLine="OAuth Authorization"
            actions={<Badge variant="muted">Consent</Badge>}
          >
            <SoftPanel variant="hero" className="p-8">
              <p className="text-sm text-muted-foreground">
                This authorization request cannot continue until the client
                parameters are present.
              </p>
              <div className="mt-6 flex justify-end">
                <a
                  href="/_viewer/login"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Go to sign in
                </a>
              </div>
            </SoftPanel>
          </PageFrame>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 text-foreground antialiased">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl items-center justify-center">
        <PageFrame
          title="Authorize Vault Access"
          subtitle={`Client ${search.client_id} is requesting access.`}
          statusLine="OAuth Authorization"
          actions={<Badge variant="muted">Consent</Badge>}
        >
          <SoftPanel variant="hero" className="p-8">
            <div className="mb-6 rounded-[8px] border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {scopes.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {scopes.map((scope) => (
                    <li
                      key={scope}
                      className="rounded-[999px] border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground"
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
              <input
                type="hidden"
                name="resource"
                value={search.resource || ''}
              />

              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton
                  className="inline-flex flex-1 items-center justify-center"
                  type="submit"
                  name="decision"
                  value="approve"
                >
                  Approve
                </PrimaryButton>
                <SecondaryButton
                  className="inline-flex flex-1 items-center justify-center"
                  type="submit"
                  name="decision"
                  value="deny"
                >
                  Deny
                </SecondaryButton>
              </div>
            </form>
          </SoftPanel>
        </PageFrame>
      </section>
    </main>
  );
}
