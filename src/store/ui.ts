import { create } from 'zustand'

export type ModalId = string | null

interface UIState {
  // Command palette
  commandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void

  // Modal host
  activeModal: ModalId
  openModal: (id: string) => void
  closeModal: () => void

  // Verification rail
  verificationRailPinned: boolean
  setVerificationRailPinned: (pinned: boolean) => void
  toggleVerificationRailPinned: () => void
}

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  verificationRailPinned: false,
  setVerificationRailPinned: (pinned) => set({ verificationRailPinned: pinned }),
  toggleVerificationRailPinned: () =>
    set((s) => ({ verificationRailPinned: !s.verificationRailPinned })),
}))
