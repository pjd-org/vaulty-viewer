import * as React from 'react';
import { Button } from '../ui/button';
import { useUIStore, type ThemePreference } from '../../../src/store/ui';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ThemeSelector() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div role="radiogroup" aria-label="Theme preference" className="flex gap-2">
      {OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          role="radio"
          aria-checked={theme === value}
          variant={theme === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
