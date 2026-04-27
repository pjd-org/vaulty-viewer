import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { ConfigAdminPanel } from '../components/config/ConfigAdminPanel';

export const Route = createFileRoute('/config')({
  component: ConfigRoute,
});

function ConfigRoute() {
  return (
    <WorkspaceScaffold
      title="Config Admin"
      subtitle="Browser -> API bridge -> private config surface."
      statusLine="Preview before apply. Regenerate uses idempotent write guard."
      nextAction="Use Settings or this page for admin actions."
      primaryTitle="Config Control"
      primarySubtitle="Snapshot, preview, and apply config changes from the viewer."
      primary={<ConfigAdminPanel />}
    />
  );
}
