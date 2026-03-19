import type { ApiStatus, Avatar } from '../lib/avatar-logic'

export interface UseAvatarResult {
  avatar: Avatar
  loading: boolean
  error: string | null
  refresh: () => Promise<unknown>
  apiStatus: ApiStatus
  level: number
  currentXp: number
  xpToNext: number
  xpProgress: number
}

export function useAvatar(): UseAvatarResult

export default useAvatar
