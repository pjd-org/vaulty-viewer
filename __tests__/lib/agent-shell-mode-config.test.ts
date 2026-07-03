import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MODE,
  getAvailableModes,
  MODE_ORDER,
} from '../../app/lib/agent-shell/mode-config';

describe('agent-shell mode config', () => {
  it('defaults to the Tensura-owned prompt runner', () => {
    expect(DEFAULT_MODE).toBe('prompt_runner');
    expect(MODE_ORDER[0]).toBe('prompt_runner');
  });

  it('keeps agent_runner sandbox-gated while prompt_runner stays available', () => {
    const modes = getAvailableModes({ sandboxAvailable: false });

    expect(modes.map((mode) => mode.mode)).toEqual([
      'prompt_runner',
      'deepagent',
    ]);
  });
});
