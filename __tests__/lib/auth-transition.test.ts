import { describe, expect, it } from 'vitest';
import {
  buildAuthTransitionPath,
  buildViewerLoginPath,
  normalizeReturnTo,
} from '../../src/lib/auth-transition';

describe('auth transition paths', () => {
  it('normalizes return_to values', () => {
    expect(normalizeReturnTo('/work')).toBe('/work');
    expect(normalizeReturnTo('https://evil.example/work')).toBe('/');
    expect(normalizeReturnTo('//evil.example/work')).toBe('/');
    expect(normalizeReturnTo('/bad\\path')).toBe('/');
  });

  it('keeps the intermediate auth transition on the viewer router root', () => {
    expect(buildAuthTransitionPath('/work')).toBe(
      '/?auth=required&return_to=%2Fwork'
    );
  });

  it('builds the public viewer login URL with the /_viewer prefix', () => {
    expect(buildViewerLoginPath('/forgot-password')).toBe(
      '/_viewer/login?return_to=%2Fforgot-password'
    );
  });
});
