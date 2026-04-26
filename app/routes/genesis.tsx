import { createFileRoute } from '@tanstack/react-router';
import { PageFrame, SoftPanel } from '../components/layout';
import { PrimaryButton } from '../components/ui';

export const Route = createFileRoute('/genesis')({
  component: GenesisRoute,
});

function GenesisRoute() {
  return (
    <PageFrame title="Run Bootstrap">
      <SoftPanel>
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
          <p className="text-muted-foreground max-w-md">
            Initialize your vault workspace. This may take a few moments.
          </p>
          <PrimaryButton onClick={() => {
            // TODO: wire to POST /bootstrap/genesis
            window.location.href = '/';
          }}>
            Start Genesis
          </PrimaryButton>
        </div>
      </SoftPanel>
    </PageFrame>
  );
}