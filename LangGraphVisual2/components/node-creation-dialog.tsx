"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/stores/i18n-store'

interface NodeCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateNode: (nodeName: string) => void
}

export function NodeCreationDialog({
  open,
  onOpenChange,
  onCreateNode
}: NodeCreationDialogProps) {
  const [nodeName, setNodeName] = useState('')
  const [error, setError] = useState('')
  const { t } = useI18n()

  // Reset input when dialog opens
  useEffect(() => {
    if (open) {
      setNodeName('')
      setError('')
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = nodeName.trim()
    
    // Basic validation
    if (!trimmedName) {
      setError(t('dialog.node.error.required'))
      return
    }
    
    if (trimmedName.length < 2) {
      setError(t('dialog.node.error.minLength'))
      return
    }
    
    if (trimmedName.length > 50) {
      setError(t('dialog.node.error.maxLength'))
      return
    }
    
    // Clear any previous errors
    setError('')
    onCreateNode(trimmedName)
    setNodeName('')
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('dialog.node.title')}</DialogTitle>
          <DialogDescription>
            {t('dialog.node.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="node-name">{t('dialog.node.label')}</Label>
            <Input
              id="node-name"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('dialog.node.placeholder')}
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? "node-name-error" : undefined}
            />
            {error && (
              <p id="node-name-error" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('dialog.node.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!nodeName.trim()}
            >
              {t('dialog.node.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}