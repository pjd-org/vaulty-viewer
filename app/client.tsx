import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { hydrate } from '@tanstack/react-query'
import {
  getBrowserQueryClient,
  readDehydratedQueryState,
} from '../src/query-client'

const queryClient = getBrowserQueryClient()
const dehydratedState = readDehydratedQueryState()

if (dehydratedState) {
  hydrate(queryClient, dehydratedState)
}

export default function AppClient() {
  return <StartClient />
}

hydrateRoot(document, <AppClient />)
