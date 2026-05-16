import * as React from 'react';
import { Button } from '@/app/components/ui/button';
import { useUIStore, type ThemePreference } from '../../../src/store/ui';
import { useShallow } from 'zustand/react/shallow';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ThemeSelector() {
  // Single subscription via useShallow — one store subscription instead of two.
  const { theme, setTheme } = useUIStore(
    useShallow((s) => ({ theme: s.theme, setTheme: s.setTheme }))
  );

  return (
    <div role="radiogroup" aria-label="Theme preference" className="flex gap-2">
      {OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          role="radio"
          aria-checked={theme === value}
          variant={theme === value ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTheme(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
