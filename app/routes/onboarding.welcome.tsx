import { createFileRoute } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { PrimaryButton } from '../components/ui';

export const Route = createFileRoute('/onboarding/welcome')({
  component: OnboardingWelcome,
});

function OnboardingWelcome() {
  return (
    <PageFrame title="Welcome to Vaulty">
      <SoftPanel>
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
          <p className="text-muted-foreground max-w-md">
            Let's set up your workspace. This will only take a moment.
          </p>
          <PrimaryButton onClick={() => window.location.href = '/onboarding/profile'}>
            Get Started
          </PrimaryButton>
        </div>
      </SoftPanel>
    </PageFrame>
  );
}