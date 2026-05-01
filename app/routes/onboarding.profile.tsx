import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { Input, PrimaryButton } from '../components/ui';
import { getBootstrapStatus, patchBootstrapDraft } from '../../src/lib/bootstrap';

export const Route = createFileRoute('/onboarding/profile')({
  component: OnboardingProfile,
});

function OnboardingProfile() {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<Awaited<ReturnType<typeof getBootstrapStatus>> | null>(null);
  const [workspaceIntent, setWorkspaceIntent] = React.useState('');
  const [focusAreas, setFocusAreas] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    getBootstrapStatus()
      .then((nextStatus) => {
        if (!mounted) return;
        setStatus(nextStatus);
        setWorkspaceIntent(nextStatus.draft?.workspaceIntent ?? '');
        setFocusAreas((nextStatus.draft?.focusAreas ?? []).join(', '));
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
      const result = await patchBootstrapDraft(
        {
          workspaceIntent,
          focusAreas: focusAreas
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        },
        status?.draft?.etag ?? ''
      );
      void navigate({ to: result.status.nextRoute });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to update draft.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageFrame title="Create Your Profile" subtitle="Add the final details for review.">
      <SoftPanel>
        <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
          <Input
            aria-label="Workspace intent"
            placeholder="What are you setting up?"
            value={workspaceIntent}
            onChange={(event) => setWorkspaceIntent(event.target.value)}
          />
          <Input
            aria-label="Focus areas"
            placeholder="docs, api, viewer"
            value={focusAreas}
            onChange={(event) => setFocusAreas(event.target.value)}
          />
          {error ? <p role="alert" className="text-destructive">{error}</p> : null}
          <PrimaryButton type="submit" disabled={saving || loading}>
            {saving ? 'Saving…' : 'Continue to review'}
          </PrimaryButton>
        </form>
      </SoftPanel>
    </PageFrame>
  );
}
