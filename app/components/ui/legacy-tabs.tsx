import React from 'react';
import { Tabs, TabsList, TabsTrigger } from './tabs';

// ─── Legacy vault-style Tabs (items-array API) ───────────────────────────────
// Temporary wrapper around shadcn Tabs for API compatibility during migration.
// Remove once all callers have been migrated to use shadcn Tabs directly.
// Props map: items[] → TabsList + TabsTrigger children,
// value → value, onChange → onValueChange, className → div wrapper.

interface LegacyTabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface LegacyTabsProps {
  items?: LegacyTabItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function LegacyTabs({
  items = [],
  value,
  onChange,
  className,
}: LegacyTabsProps) {
  return (
    <div className={className}>
      <Tabs value={value} onValueChange={onChange}>
        <TabsList>
          {items.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

LegacyTabs.displayName = 'LegacyTabs';

export default LegacyTabs;
