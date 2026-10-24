/**
 * Mapping existing domain severity to Pressure Band roles.
 *
 * The decision is explicit: do not reassign these colours arbitrarily to
 * conflicting statuses, and do not invent statuses. So this maps ONLY what the
 * domain already distinguishes, and anything unrecognised falls to `total`
 * (neutral/blue) rather than being guessed into an alarm colour.
 *
 * `high` and `critical` keep their meaning wherever they appear. A `low`
 * severity is NOT mapped to `source` (sage) as a "positive" colour — sage is a
 * provenance/source role, and using it for calm would overload it.
 */
import type { PressureBandRole } from './pressure-band';

export type DomainSeverity = 'critical' | 'high' | 'medium' | 'low' | string | null | undefined;

export function roleForSeverity(severity: DomainSeverity): PressureBandRole {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    default:
      // medium, low, null, and anything unknown: neutral, never an alarm.
      return 'total';
  }
}

/** Provenance-bearing records (staged, rejected, historical) use `source`. */
export function roleForProvenance(kind: 'staged' | 'rejected' | 'historical' | 'live'): PressureBandRole {
  switch (kind) {
    case 'staged':
    case 'rejected':
    case 'historical':
      return 'source';
    case 'live':
    default:
      return 'total';
  }
}
