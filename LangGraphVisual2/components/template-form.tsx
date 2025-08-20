"use client"

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { TemplateItem } from '@/lib/api'

export type TemplateFormValues = {
  title: string
  description?: string
  code: string
  language: 'python' | 'typescript' | 'javascript'
  visibility?: 'public' | 'private'
}

export function TemplateForm({
  initial,
  submitText = 'Save',
  onSubmit,
  onCancel,
}: {
  initial: Partial<TemplateItem & TemplateFormValues>
  submitText?: string
  onSubmit: (values: TemplateFormValues) => Promise<void>
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(initial.title || '')
  const [description, setDescription] = useState(initial.description || '')
  const [code, setCode] = useState(initial.code || '')
  const [language, setLanguage] = useState<TemplateFormValues['language']>(
    (initial.language as any) || 'python',
  )
  const [visibility, setVisibility] = useState<TemplateFormValues['visibility']>(
    (initial.visibility as any) || 'private',
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {}, [initial])

  const canSubmit = title.trim().length > 0 && code.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const payload: TemplateFormValues = {
        title: title.trim(),
        description: description || undefined,
        code,
        language,
        visibility,
      }
      await onSubmit(payload)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-slate-600 dark:text-slate-300">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Template title" />
      </div>
      <div>
        <label className="text-sm text-slate-600 dark:text-slate-300">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-300">Language</label>
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-300">Visibility</label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-600 dark:text-slate-300">Code</label>
        <Textarea value={code} onChange={(e) => setCode(e.target.value)} className="min-h-[160px] font-mono" placeholder="Paste or write your code here..." />
      </div>
      <div className="flex gap-2 justify-end mt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitText}
        </Button>
      </div>
    </div>
  )
}
