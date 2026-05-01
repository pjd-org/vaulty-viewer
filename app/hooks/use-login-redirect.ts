import { useEffect } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

import {
  buildAuthTransitionPath,
  normalizeReturnTo,
} from '../../src/lib/auth-transition';
import { ForbiddenError, UnauthenticatedError } from '../../src/utils/api';

export function useLoginRedirectOnUnauthenticated(error: unknown) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (error instanceof UnauthenticatedError) {
      void navigate({
        to: buildAuthTransitionPath(
          normalizeReturnTo(`${location.pathname}${location.search}`)
        ),
      });
    }
  }, [error, location.pathname, location.search, navigate]);

  return error instanceof UnauthenticatedError;
}

export function getAuthFailureKind(error: unknown) {
  if (error instanceof UnauthenticatedError) return 'unauthenticated' as const;
  if (error instanceof ForbiddenError) return 'forbidden' as const;
  return null;
}
