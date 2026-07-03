import { useEffect, useState } from 'react'

/**
 * Hydration guard for SSR + client-first-render determinism.
 * false on SSR and first client render, true after mount.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}

export default useHydrated
