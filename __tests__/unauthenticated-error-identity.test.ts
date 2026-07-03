/**
 * D2/D5: Real-class identity tests for UnauthenticatedError.
 *
 * This file intentionally does NOT mock ../src/utils/api so the real class
 * is imported. This validates that the exported class can be used with
 * `instanceof` checks in production code (not just against mock shadows).
 */

import { describe, it, expect } from 'vitest';
import { UnauthenticatedError } from '../src/utils/api';

describe('UnauthenticatedError — real class identity', () => {
  it('is an instance of Error', () => {
    const err = new UnauthenticatedError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of UnauthenticatedError', () => {
    const err = new UnauthenticatedError('test');
    expect(err).toBeInstanceOf(UnauthenticatedError);
  });

  it('has status 401', () => {
    const err = new UnauthenticatedError('test');
    expect(err.status).toBe(401);
  });

  it('has name UnauthenticatedError', () => {
    const err = new UnauthenticatedError('test');
    expect(err.name).toBe('UnauthenticatedError');
  });

  it('uses default message when none provided', () => {
    const err = new UnauthenticatedError();
    expect(err.message).toBe('Unauthenticated');
  });

  it('uses custom message when provided', () => {
    const err = new UnauthenticatedError('Failed to fetch home surface: 401');
    expect(err.message).toBe('Failed to fetch home surface: 401');
  });

  it('instanceof check correctly distinguishes from plain Error', () => {
    const plain = new Error('generic');
    expect(plain).not.toBeInstanceOf(UnauthenticatedError);
    expect(new UnauthenticatedError('auth')).toBeInstanceOf(
      UnauthenticatedError
    );
  });
});
