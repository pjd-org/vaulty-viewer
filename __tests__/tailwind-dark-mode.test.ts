import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('Tailwind dark-mode contract', () => {
  it('uses the explicit html.dark class as the single utility selector', () => {
    const config = require('../tailwind.config.cjs') as { darkMode?: unknown };

    expect(config.darkMode).toBe('class');
  });
});
