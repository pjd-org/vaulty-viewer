export type NavOverlay = 'avatar' | 'cod'

export interface NavOverlayDetail {
  type: NavOverlay | null
}

export const NAV_OVERLAY_EVENT = 'viewer:nav-overlay'

export function dispatchNavOverlay(type: NavOverlay | null): void {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent<NavOverlayDetail>(NAV_OVERLAY_EVENT, {
      detail: { type },
    }),
  )
}
