import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { Input, PrimaryButton } from '../components/ui';
import { getBootstrapStatus, putBootstrapDraft } from '../../src/lib/bootstrap';

export const Route = createFileRoute('/onboarding/welcome')({
  component: OnboardingWelcome,
});

function OnboardingWelcome() {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<Awaited<ReturnType<typeof getBootstrapStatus>> | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [workspaceName, setWorkspaceName] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    getBootstrapStatus()
      .then((nextStatus) => {
        if (!mounted) return;
        setStatus(nextStatus);
        setDisplayName(nextStatus.draft?.displayName ?? '');
        setWorkspaceName(nextStatus.draft?.workspaceName ?? '');
      })
      .catch(() => {
        if (mounted) setError('Failed to load bootstrap draft.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await putBootstrapDraft({
        displayName,
        workspaceName,
      }, status?.draft?.etag ?? null);
      void navigate({ to: result.status.nextRoute });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageFrame title="Welcome to Vaulty" subtitle="Start your onboarding draft.">
      <SoftPanel>
        <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
          <Input
            aria-label="Display name"
            placeholder="Darry"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <Input
            aria-label="Workspace name"
            placeholder="Vaulty"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
          />
          {error ? <p role="alert" className="text-destructive">{error}</p> : null}
          <PrimaryButton type="submit" disabled={saving || loading}>
            {saving ? 'Saving…' : 'Continue'}
          </PrimaryButton>
        </form>
      </SoftPanel>
    </PageFrame>
  );
}
