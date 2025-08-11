import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

// Toast notification state
export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface NotificationStore {
  toasts: Toast[]
  
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const initialState = {
  toasts: [] as Toast[],
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 11)
        const newToast: Toast = { ...toast, id }
        
        set(state => ({
          toasts: [...state.toasts, newToast]
        }))

        // Auto remove toast after duration (default 5 seconds)
        const duration = toast.duration ?? 5000
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, duration)
        }
      },

      removeToast: (id: string) => {
        set(state => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
      },

      clearToasts: () => {
        set({ toasts: [] })
      },
    })),
    {
      name: 'notification-store',
    }
  )
)

// Typed selectors for optimal performance
export const useToasts = () => useNotificationStore(state => state.toasts)

// Action selectors with shallow comparison to prevent infinite loops
export const useToastActions = () => useNotificationStore(
  useShallow((state) => ({
    addToast: state.addToast,
    removeToast: state.removeToast,
    clearToasts: state.clearToasts,
  }))
)

// Individual action selectors for optimization
export const useAddToast = () => useNotificationStore(state => state.addToast)
export const useRemoveToast = () => useNotificationStore(state => state.removeToast)
export const useClearToasts = () => useNotificationStore(state => state.clearToasts)

// Convenience functions for common toast types
export const useToastHelpers = () => {
  const addToast = useAddToast()
  
  return {
    success: (title: string, description?: string) => 
      addToast({ title, description, variant: 'default' }),
    
    error: (title: string, description?: string) => 
      addToast({ title, description, variant: 'destructive' }),
    
    info: (title: string, description?: string) => 
      addToast({ title, description, variant: 'default' }),
  }
}