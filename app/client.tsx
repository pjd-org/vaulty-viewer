import { StartClient } from '@tanstack/start'
import { createRouter } from '../src/router'

const router = createRouter()

export default function AppClient() {
  return <StartClient router={router} />
}
