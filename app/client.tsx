import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'

export default function AppClient() {
  return <StartClient />
}

hydrateRoot(document, <AppClient />)
