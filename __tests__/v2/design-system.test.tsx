/**
 * Viewer V2 design-system tests.
 *
 * These test the contract from the canonical decisions, not incidental
 * implementation: approved palette values, selection-drives-ambient (never
 * hover), information levels, persistence, keyboard/pointer parity, and focus
 * independence from selection.
 */
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AMBIENT_ALPHA,
  AMBIENT_TRANSITION_MS,
  DEFAULT_INFORMATION_LEVEL,
  hexToRgba,
  INFORMATION_LEVELS,
  PRESSURE_BAND,
  SURFACES,
  themeCssBlock,
  themeCssVariables,
} from '../../app/lib/design/pressure-band';
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  readPreferences,
  ViewerV2Provider,
  writePreferences,
  type ViewerPreferences,
} from '../../app/lib/design/viewer-v2-context';
import { AmbientSurface, SelectableCard } from '../../app/components/v2';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

describe('Pressure Band palette', () => {
  it('matches the approved swatches exactly', () => {
    // Verbatim from 2026-10-21-vaulty-viewer-pressure-band-palette. If these
    // change, the decision changed — not the code.
    expect(PRESSURE_BAND['soft-light']).toEqual({
      critical: '#F1C9C0',
      high: '#F2D9B3',
      total: '#C9DBDF',
      source: '#D0E0D0',
    });
    expect(PRESSURE_BAND['soft-dark']).toEqual({
      critical: '#724B48',
      high: '#746044',
      total: '#3F5960',
      source: '#425E51',
    });
  });

  it('emits a custom property per role per theme', () => {
    const light = themeCssVariables('soft-light');
    for (const role of ['critical', 'high', 'total', 'source'] as const) {
      expect(light[`--pb-${role}`]).toBe(PRESSURE_BAND['soft-light'][role]);
      expect(light[`--pb-${role}-ambient`]).toContain('rgba(');
    }
  });

  it('uses low-alpha ambient tints, not full-strength fills', () => {
    // The decision forbids large decorative full-screen fills.
    for (const mode of ['soft-light', 'soft-dark'] as const) {
      expect(AMBIENT_ALPHA[mode]).toBeLessThan(1);
      const vars = themeCssVariables(mode);
      expect(vars['--pb-critical-ambient']).toContain(String(AMBIENT_ALPHA[mode]));
    }
  });

  it('keeps light backgrounds light and dark backgrounds dark', () => {
    const light = SURFACES['soft-light'];
    const dark = SURFACES['soft-dark'];
    expect(light.background).not.toBe(dark.background);
    // Warm neutral, not pure white/black (the decision rejects high glare).
    expect(light.background.toLowerCase()).not.toBe('#ffffff');
    expect(dark.background.toLowerCase()).not.toBe('#000000');
  });

  it('renders a CSS block for both themes', () => {
    expect(themeCssBlock('soft-light')).toContain('--pb-total');
    expect(themeCssBlock('soft-dark')).toContain('--pb-total');
  });

  it('converts hex to rgba correctly', () => {
    expect(hexToRgba('#F1C9C0', 0.5)).toBe('rgba(241, 201, 192, 0.5)');
  });
});

// ---------------------------------------------------------------------------
// Information levels
// ---------------------------------------------------------------------------

describe('information levels', () => {
  it('defaults to Focus', () => {
    expect(DEFAULT_INFORMATION_LEVEL).toBe('focus');
    expect(DEFAULT_PREFERENCES.informationLevel).toBe('focus');
  });

  it('reveals progressively more detail', () => {
    const { focus, standard, deep } = INFORMATION_LEVELS;
    expect(focus.showSummary).toBe(false);
    expect(standard.showSummary).toBe(true);
    expect(standard.showHistory).toBe(false);
    expect(deep.showHistory).toBe(true);
  });

  it('never hides alerts or next actions at any level', () => {
    // Minimising information must not hide urgency.
    for (const level of ['focus', 'standard', 'deep'] as const) {
      expect(INFORMATION_LEVELS[level].showAlerts).toBe(true);
      expect(INFORMATION_LEVELS[level].showNextActions).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

describe('preference persistence', () => {
  function fakeStorage(initial: Record<string, string> = {}) {
    const store = { ...initial };
    return {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      _store: store,
    };
  }

  it('returns defaults when nothing is stored', () => {
    expect(readPreferences(fakeStorage())).toEqual(DEFAULT_PREFERENCES);
  });

  it('round-trips preferences', () => {
    const storage = fakeStorage();
    const prefs: ViewerPreferences = {
      theme: 'soft-dark',
      informationLevel: 'deep',
      inspectorOpen: false,
    };
    writePreferences(prefs, storage);
    expect(readPreferences(storage)).toEqual(prefs);
  });

  it('falls back per-field rather than discarding everything', () => {
    const storage = fakeStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({
        theme: 'nonsense',
        informationLevel: 'deep',
        inspectorOpen: false,
      }),
    });
    const prefs = readPreferences(storage);
    expect(prefs.theme).toBe(DEFAULT_PREFERENCES.theme); // bad field replaced
    expect(prefs.informationLevel).toBe('deep'); // good fields kept
    expect(prefs.inspectorOpen).toBe(false);
  });

  it('survives malformed JSON', () => {
    const storage = fakeStorage({ [PREFERENCES_STORAGE_KEY]: '{not json' });
    expect(readPreferences(storage)).toEqual(DEFAULT_PREFERENCES);
  });

  it('does not throw when storage rejects writes', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => writePreferences(DEFAULT_PREFERENCES, throwing)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Ambient + selection behaviour
// ---------------------------------------------------------------------------

function Harness({
  initial,
}: {
  initial?: Partial<ViewerPreferences>;
}): React.ReactElement {
  return (
    <ViewerV2Provider
      initialPreferences={{ ...DEFAULT_PREFERENCES, ...initial }}
    >
      <AmbientSurface>
        <SelectableCard
          id="a"
          role="critical"
          title="Alpha"
          summary="summary-a"
          metadata="meta-a"
          history="history-a"
          alert="alert-a"
          nextAction="next-a"
        />
        <SelectableCard id="b" role="source" title="Beta" />
      </AmbientSurface>
    </ViewerV2Provider>
  );
}

describe('ambient surface', () => {
  it('is neutral until something is selected', () => {
    render(<Harness />);
    expect(screen.getByTestId('v2-ambient-surface').getAttribute('data-ambient')).toBe(
      'neutral'
    );
  });

  it('follows the selected item, not hover', () => {
    render(<Harness />);
    const surface = screen.getByTestId('v2-ambient-surface');
    const card = screen.getAllByTestId('v2-selectable-card')[0]!;

    // Hover alone must not repaint the workspace: that is the strobe the
    // decision exists to prevent.
    fireEvent.mouseOver(card);
    fireEvent.mouseEnter(card);
    expect(surface.getAttribute('data-ambient')).toBe('neutral');

    fireEvent.click(card);
    expect(surface.getAttribute('data-ambient')).toBe('critical');
  });

  it('changes tint when a different item is selected', () => {
    render(<Harness />);
    const surface = screen.getByTestId('v2-ambient-surface');
    const [alpha, beta] = screen.getAllByTestId('v2-selectable-card');

    fireEvent.click(alpha!);
    expect(surface.getAttribute('data-ambient')).toBe('critical');

    fireEvent.click(beta!);
    expect(surface.getAttribute('data-ambient')).toBe('source');
  });

  it('clears on Escape and returns to neutral', () => {
    render(<Harness />);
    const surface = screen.getByTestId('v2-ambient-surface');
    fireEvent.click(screen.getAllByTestId('v2-selectable-card')[0]!);
    expect(surface.getAttribute('data-ambient')).toBe('critical');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(surface.getAttribute('data-ambient')).toBe('neutral');
  });
});

describe('selectable card', () => {
  it('marks the selected card with aria-pressed by default', () => {
    // The default role is `button`, where aria-pressed is the correct state
    // attribute. aria-selected only applies to option/row/tab roles, which
    // require a listbox/grid/tablist parent.
    render(<Harness />);
    const card = screen.getAllByTestId('v2-selectable-card')[0]!;
    expect(card.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(card);
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('uses aria-selected when the route opts into option role', () => {
    render(
      <ViewerV2Provider initialPreferences={{ ...DEFAULT_PREFERENCES }}>
        <ul role="listbox" aria-label="Records">
          <SelectableCard id="x" role="total" ariaRole="option" title="X" />
        </ul>
      </ViewerV2Provider>
    );
    const card = screen.getByTestId('v2-selectable-card');
    expect(card.getAttribute('role')).toBe('option');
    expect(card.getAttribute('aria-selected')).toBe('false');
  });

  it('is keyboard-selectable with Enter and Space', () => {
    render(<Harness />);
    const surface = screen.getByTestId('v2-ambient-surface');
    const card = screen.getAllByTestId('v2-selectable-card')[0]!;

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(surface.getAttribute('data-ambient')).toBe('critical');
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('treats Space the same as Enter', () => {
    render(<Harness />);
    const surface = screen.getByTestId('v2-ambient-surface');
    const card = screen.getAllByTestId('v2-selectable-card')[1]!;
    fireEvent.keyDown(card, { key: ' ' });
    expect(surface.getAttribute('data-ambient')).toBe('source');
  });

  it('is focusable so keyboard users can reach it', () => {
    render(<Harness />);
    const card = screen.getAllByTestId('v2-selectable-card')[0]!;
    expect(card.getAttribute('tabindex')).toBe('0');
  });
});

describe('information level rendering', () => {
  it('shows only title, alert and next action at Focus', () => {
    render(<Harness initial={{ informationLevel: 'focus' }} />);
    expect(screen.getAllByTestId('v2-card-title').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('v2-card-summary')).toBeNull();
    expect(screen.queryByTestId('v2-card-metadata')).toBeNull();
    expect(screen.queryByTestId('v2-card-history')).toBeNull();
    // Urgency survives the minimal level.
    expect(screen.getAllByTestId('v2-card-alert').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('v2-card-next-action').length).toBeGreaterThan(0);
  });

  it('adds summary and metadata at Standard', () => {
    render(<Harness initial={{ informationLevel: 'standard' }} />);
    expect(screen.getAllByTestId('v2-card-summary').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('v2-card-metadata').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('v2-card-history')).toBeNull();
  });

  it('adds history at Deep', () => {
    render(<Harness initial={{ informationLevel: 'deep' }} />);
    expect(screen.getAllByTestId('v2-card-history').length).toBeGreaterThan(0);
  });

  it('keeps information level independent of selection', () => {
    render(<Harness initial={{ informationLevel: 'focus' }} />);
    const card = screen.getAllByTestId('v2-selectable-card')[0]!;
    fireEvent.click(card);
    // Selecting must not reveal more detail.
    expect(screen.queryByTestId('v2-card-summary')).toBeNull();
  });
});

describe('ambient transition', () => {
  it('is the approved duration', () => {
    expect(AMBIENT_TRANSITION_MS).toBe(300);
  });
});
