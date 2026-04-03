import * as React from 'react';
import { Button } from '../ui/button';
import { useUIStore } from '../../../src/store/ui';

type ThemeOption = 'light' | 'dark' | 'system';

const OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ThemeSelector() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div className="flex gap-2" role="group" aria-label="Theme preference">
      {OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
