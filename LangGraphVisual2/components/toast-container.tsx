"use client"

import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useToasts, useRemoveToast } from '@/stores/notification-store'
import { cn } from '@/lib/utils'

export function ToastContainer() {
  const toasts = useToasts()
  const removeToast = useRemoveToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
  onRemove: (id: string) => void
}

function Toast({ id, title, description, variant, duration = 5000, onRemove }: ToastProps) {
  const removeRef = useRef(onRemove)
  const idRef = useRef(id)
  
  // Update refs without causing re-renders
  useEffect(() => {
    removeRef.current = onRemove
    idRef.current = id
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      removeRef.current(idRef.current)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration]) // Only depend on duration, not on the callback

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        "bg-background text-foreground",
        variant === 'destructive' && "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      )}
    >
      <div className="grid gap-1">
        <div className="text-sm font-semibold">{title}</div>
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      <button
        onClick={() => onRemove(id)}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}