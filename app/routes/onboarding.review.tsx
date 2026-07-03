import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { PrimaryButton } from '../components/ui';
import { getBootstrapReview, runBootstrapPreflight } from '../../src/lib/bootstrap';

export const Route = createFileRoute('/onboarding/review')({
  component: OnboardingReview,
});

function OnboardingReview() {
  const navigate = useNavigate();
  const [review, setReview] = React.useState<Awaited<ReturnType<typeof getBootstrapReview>> | null>(null);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    getBootstrapReview()
      .then((nextReview) => {
        if (mounted) setReview(nextReview);
      })
      .catch((nextError) => {
        if (mounted) setError(nextError instanceof Error ? nextError.message : 'Failed to load review.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePreflight = async () => {
    if (!review?.draft) return;
    setRunning(true);
    setError(null);
    try {
      const nextReview = await runBootstrapPreflight(review.draft.etag, `preflight_${Date.now().toString(36)}`);
      setReview(nextReview);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to run preflight.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <PageFrame title="Review Your Plan" subtitle="Your draft is ready for the next slice.">
      <SoftPanel>
        <div className="flex flex-col gap-4 p-6">
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p><strong>Display name:</strong> {review?.draft?.displayName || 'Not set'}</p>
            <p><strong>Workspace:</strong> {review?.draft?.workspaceName || 'Not set'}</p>
            <p><strong>Intent:</strong> {review?.draft?.workspaceIntent || 'Not set'}</p>
            <p><strong>Focus areas:</strong> {(review?.draft?.focusAreas ?? []).join(', ') || 'Not set'}</p>
            <p><strong>Summary:</strong> {review?.review.summary || 'Not loaded'}</p>
            <p><strong>Ready:</strong> {review?.review.readyForGenesis ? 'Yes' : 'No'}</p>
            <p><strong>Plan hash:</strong> {review?.review.planHash || 'Not loaded'}</p>
          </div>
          {error ? <p role="alert" className="text-destructive">{error}</p> : null}
          <div className="flex gap-3">
            <PrimaryButton onClick={() => navigate({ to: '/onboarding/profile' })}>
              Edit profile
            </PrimaryButton>
            <PrimaryButton onClick={handlePreflight} disabled={running || !review?.draft}>
              {running ? 'Running…' : 'Run preflight'}
            </PrimaryButton>
          </div>
        </div>
      </SoftPanel>
    </PageFrame>
  );
}
