export interface CODValidation {
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN'
  warnings: string[]
  lastChecked: string | null
}

export interface CODHumanState {
  energy: number
  focusCapacity: 'low' | 'med' | 'high' | 'unknown'
  stress: number
  sleepDebt: number
  timeAvailableMin: number
  source?: string
  timestamp?: string | null
}

export interface CODSessionTask {
  title: string
  status: 'pending' | 'in_progress' | 'done'
  estimatedMin?: number
}

export interface CODSession {
  id?: string
  startedAt: string
  budgetMin: number
  tasks?: CODSessionTask[]
}

export interface CODAvatarVitals {
  money?: {
    default_currency?: string
    balances?: Record<string, number>
    forms?: Record<string, number | string>
  }
  notoriety?: number
  health?: number
  healthTrend?: number | null
}

export interface CODHumanStateFormData {
  energy: number
  focusCapacity: 'low' | 'med' | 'high'
  stress: number
  sleepHours: number
  timeAvailableMin: number
  source: 'morning-check' | 'moment-check' | 'manual' | string
}

export interface CODMutationResult {
  success: boolean
  error?: string
  session?: unknown
}

export interface UseCODStatusResult {
  validation: CODValidation
  humanState: CODHumanState
  session: CODSession | null
  warnings: string[]
  avatarVitals: CODAvatarVitals
  loading: boolean
  updating: boolean
  error: string | null
  refresh: () => Promise<unknown>
  updateHumanState: (
    newState: CODHumanStateFormData
  ) => Promise<CODMutationResult>
  startSession: (options?: {
    taskIds?: string[]
    budgetMin?: number
  }) => Promise<CODMutationResult>
  endSession: (
    sessionId: string,
    status?: 'completed' | 'aborted' | string
  ) => Promise<CODMutationResult>
}

export function useCODStatus(
  staticData?: unknown | null,
  profileOverride?: string | null
): UseCODStatusResult

export default useCODStatus
