import { createFileRoute } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { PrimaryButton } from '../components/ui';

export const Route = createFileRoute('/onboarding/review')({
  component: OnboardingReview,
});

function OnboardingReview() {
  return (
    <PageFrame title="Review Your Plan">
      <SoftPanel>
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
          <p className="text-muted-foreground max-w-md">
            Review your bootstrap plan before provisioning.
          </p>
          <PrimaryButton onClick={() => window.location.href = '/genesis'}>
            Continue
          </PrimaryButton>
        </div>
      </SoftPanel>
    </PageFrame>
  );
}