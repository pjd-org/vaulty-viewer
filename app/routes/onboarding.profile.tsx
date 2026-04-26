import { createFileRoute } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { PrimaryButton } from '../components/ui';

export const Route = createFileRoute('/onboarding/profile')({
  component: OnboardingProfile,
});

function OnboardingProfile() {
  return (
    <PageFrame title="Create Your Profile">
      <SoftPanel>
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
          <p className="text-muted-foreground max-w-md">
            Tell us about your workspace preferences.
          </p>
          <PrimaryButton onClick={() => window.location.href = '/onboarding/review'}>
            Continue
          </PrimaryButton>
        </div>
      </SoftPanel>
    </PageFrame>
  );
}