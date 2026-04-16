import * as React from 'react';
import { Button } from '@vault/ui';
import { useUIStore } from '../../../src/store/ui';
import { useShallow } from 'zustand/react/shallow';

type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

const OPTIONS: { value: LayoutDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
];

export function DensitySelector() {
  const { density, setDensity } = useUIStore(
    useShallow((s) => ({ density: s.layout.density, setDensity: s.setDensity }))
  );

  return (
    <div role="radiogroup" aria-label="Layout density" className="flex gap-2">
      {OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          role="radio"
          aria-checked={density === value}
          variant={density === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDensity(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
