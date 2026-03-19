export interface GoalTask {
  id?: string
  path?: string
  title: string
  status: string
  effortScore?: number
  priority?: number
  tags?: string[]
}

export interface GoalStats {
  total: number
  completed: number
  inProgress?: number
  todo?: number
  blocked?: number
  totalEffort?: number
  completedEffort?: number
  remainingEffort?: number
}

export interface Goal {
  id: string
  title: string
  priority: number
  progress: number
  progressByCount?: number
  status: string
  targetDate?: string | null
  eta?: string | null
  stats: GoalStats
  tasks: GoalTask[]
}

export interface UseGoalsResult {
  goals: Goal[]
  loading: boolean
  error: string | null
  apiStatus: 'online' | 'offline' | 'unknown'
  updatedAt: string | null
  refresh: () => Promise<unknown>
}

export function useGoals(): UseGoalsResult

export default useGoals
