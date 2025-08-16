"use client"

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { UserProfile } from '@/lib/api'
import { fetchMe, logout as apiLogout, getOAuthUrl } from '@/lib/api'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  error?: string | null

  // Actions
  loadMe: () => Promise<void>
  logout: () => Promise<boolean>
  loginWithGithub: () => void
  loginWithGoogle: () => void
  setUser: (user: UserProfile | null) => void
}

const initialState: Pick<AuthState, 'user' | 'loading' | 'error'> = {
  user: null,
  loading: false,
  error: null,
}

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      setUser: (user: UserProfile | null) => set({ user }),

      loadMe: async () => {
        if (get().loading) return
        set({ loading: true, error: null })
        try {
          const me = await fetchMe()
          set({ user: me, loading: false })
        } catch (e) {
          set({ loading: false, error: 'Failed to load user' })
        }
      },

      logout: async () => {
        const ok = await apiLogout()
        if (ok) set({ user: null })
        return ok
      },

      loginWithGithub: () => {
        // Redirect to backend OAuth endpoint
        window.location.href = getOAuthUrl('github')
      },

      loginWithGoogle: () => {
        window.location.href = getOAuthUrl('google')
      },
    })),
    { name: 'auth-store' }
  )
)

// Selectors
// Use useShallow to avoid returning a new object identity every render,
// which can cause React's getServerSnapshot warning in SSR/hydration.
export const useAuth = () => useAuthStore(
  useShallow(state => ({ user: state.user, loading: state.loading }))
)
export const useAuthUser = () => useAuthStore(state => state.user)
export const useAuthLoading = () => useAuthStore(state => state.loading)
export const useAuthActions = () => useAuthStore(
  useShallow(state => ({
    loadMe: state.loadMe,
    logout: state.logout,
    loginWithGithub: state.loginWithGithub,
    loginWithGoogle: state.loginWithGoogle,
    setUser: state.setUser,
  }))
)
