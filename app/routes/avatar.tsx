import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/avatar')({
  component: lazyRouteComponent(
    () => import('../components/overlays/AvatarOverlay'),
    'AvatarOverlay'
  ),
});
