import * as React from 'react';
import { Button } from '@vault/ui';
import { useUIStore } from '../../../src/store/ui';
import { useShallow } from 'zustand/react/shallow';

export function SidebarCollapseToggle() {
  const { collapsed, toggle } = useUIStore(
    useShallow((s) => ({
      collapsed: s.layout.leftSidebarCollapsed,
      toggle: s.toggleLeftSidebar,
    }))
  );

  return (
    <Button variant="ghost" size="sm" aria-pressed={collapsed} onClick={toggle}>
      {collapsed ? 'Show sidebar' : 'Hide sidebar'}
    </Button>
  );
}
