import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/cod-status')({
  component: lazyRouteComponent(
    () => import('../components/overlays/CODStatusOverlay'),
    'CODStatusOverlay'
  ),
});
