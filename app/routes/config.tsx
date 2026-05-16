import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '@/app/components/ui/badge';

import { PageFrame, SoftPanel } from '../components/layout';
import { ConfigAdminPanel } from '../components/config/ConfigAdminPanel';

export const Route = createFileRoute('/config')({
  component: ConfigRoute,
});

function ConfigRoute() {
  return (
    <PageFrame
      title="Config Admin"
      subtitle="Browser → API bridge → private config surface."
      statusLine="Preview before apply. Regenerate uses idempotent write guard."
      nextAction="Use Settings or this page for admin actions."
      actions={<Badge variant="muted">Admin</Badge>}
    >
      <SoftPanel variant="elevated" noPadding className="overflow-hidden">
        <ConfigAdminPanel />
      </SoftPanel>
    </PageFrame>
  );
}
