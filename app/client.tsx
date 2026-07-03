import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start/client';
import { hydrate } from '@tanstack/react-query';
import {
  getBrowserQueryClient,
  readDehydratedQueryState,
  setBrowserDehydratedStateForRender,
} from '../src/query-client';

const queryClient = getBrowserQueryClient();
const dehydratedState = readDehydratedQueryState();

if (dehydratedState) {
  hydrate(queryClient, dehydratedState);
}

setBrowserDehydratedStateForRender(dehydratedState);

export default function AppClient() {
  return <StartClient />;
}

hydrateRoot(document, <AppClient />);
