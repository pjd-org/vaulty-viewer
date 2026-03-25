export interface InboxNote {
  path: string
  title?: string
  status?: string
  error?: string
}

export interface InboxRunItem {
  path?: string
  targetPath?: string
  domainFields?: Record<string, unknown>
}

export interface InboxRun {
  runId: string
  runType?: string
  action?: string
  itemCount: number
  confidence?: number
  templateRef?: string
  items: InboxRunItem[]
  error?: string
}

export interface InboxPendingConfirmation {
  token?: string
  expiresAt?: string
  message?: string
}

export type InboxActionState = Record<
  string,
  'committing' | 'rejecting' | 'error' | undefined
>

export interface InboxMutationResult {
  status?: 'pending_confirmation' | 'committed'
  token?: string
  expiresAt?: string
  message?: string
  mode?: string
  structuredContent?: {
    status?: 'pending_confirmation' | 'committed'
    token?: string
    expiresAt?: string
    message?: string
    committed?: number
    failed?: number
    rejected?: number
    errors?: number | string[]
  }
  [key: string]: unknown
}

export interface UseInboxResult {
  notes: InboxNote[]
  workbenchNotes: InboxNote[]
  archiveNotes: InboxNote[]
  runs: InboxRun[]
  counts: {
    queue: number
    workbench: number
    archive: number
  }
  loading: boolean
  error: string | null
  apiStatus: 'online' | 'offline' | 'unknown'
  refresh: () => Promise<unknown>
  commitRun: (runId: string) => Promise<InboxMutationResult>
  rejectRun: (runId: string) => Promise<InboxMutationResult>
  actionState: InboxActionState
  pendingConfirmations: Record<string, InboxPendingConfirmation | undefined>
}

export function useInbox(): UseInboxResult

export default useInbox
