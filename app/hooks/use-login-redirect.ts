import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { ForbiddenError, UnauthenticatedError } from '../../src/utils/api';

export function useLoginRedirectOnUnauthenticated(error: unknown) {
  const navigate = useNavigate();

  useEffect(() => {
    if (error instanceof UnauthenticatedError) {
      void navigate({ to: '/login' });
    }
  }, [error, navigate]);

  return error instanceof UnauthenticatedError;
}

export function getAuthFailureKind(error: unknown) {
  if (error instanceof UnauthenticatedError) return 'unauthenticated' as const;
  if (error instanceof ForbiddenError) return 'forbidden' as const;
  return null;
}
