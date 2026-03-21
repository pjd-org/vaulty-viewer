import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { createRouter } from '../src/router'

const router = createRouter()

export default function AppClient() {
  return <StartClient router={router} />
}

hydrateRoot(document, <AppClient />)
