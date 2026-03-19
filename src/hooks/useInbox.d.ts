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

export type InboxActionState = Record<
  string,
  'committing' | 'rejecting' | 'error' | undefined
>

export interface InboxMutationResult {
  structuredContent?: {
    committed?: number
    failed?: number
    rejected?: number
    errors?: number
  }
  [key: string]: unknown
}

export interface UseInboxResult {
  notes: InboxNote[]
  runs: InboxRun[]
  loading: boolean
  error: string | null
  apiStatus: 'online' | 'offline' | 'unknown'
  refresh: () => Promise<unknown>
  commitRun: (runId: string) => Promise<InboxMutationResult>
  rejectRun: (runId: string) => Promise<InboxMutationResult>
  actionState: InboxActionState
}

export function useInbox(): UseInboxResult

export default useInbox
