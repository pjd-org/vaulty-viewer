import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { UnauthenticatedError } from '../../src/utils/api';

export function useLoginRedirectOnUnauthenticated(error: unknown) {
  const navigate = useNavigate();

  useEffect(() => {
    if (error instanceof UnauthenticatedError) {
      void navigate({ to: '/login' });
    }
  }, [error, navigate]);

  return error instanceof UnauthenticatedError;
}
