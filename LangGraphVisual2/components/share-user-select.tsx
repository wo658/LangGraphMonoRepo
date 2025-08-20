"use client"

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { searchUsers, type UserSearchItem } from '@/lib/api'

export function ShareUserSelect({
  value,
  onChange,
}: {
  value: UserSearchItem[]
  onChange: (users: UserSearchItem[]) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserSearchItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const h = setTimeout(async () => {
      if (!q.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await searchUsers(q, 8)
        // exclude already selected
        const selectedIds = new Set(value.map((u) => u._id))
        setResults(res.filter((u) => !selectedIds.has(u._id)))
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(h)
  }, [q, value])

  const remove = (id: string) => {
    onChange(value.filter((u) => u._id !== id))
  }

  const add = (u: UserSearchItem) => {
    if (value.some((x) => x._id === u._id)) return
    onChange([...value, u])
    setQ('')
    setResults([])
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {value.map((u) => (
          <Badge key={u._id} variant="secondary" className="gap-2">
            <span>{u.name || u.email || u._id}</span>
            <Button size="sm" variant="ghost" onClick={() => remove(u._id)}>
              ×
            </Button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          placeholder="Search users by name or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <div className="absolute z-10 mt-1 w-full rounded border bg-white dark:bg-slate-900 shadow">
            {loading && (
              <div className="px-3 py-2 text-sm text-slate-500">Searching...</div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">No results</div>
            )}
            {!loading &&
              results.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => add(u)}
                >
                  <div className="text-sm font-medium">{u.name || u.email || u._id}</div>
                  {u.email && <div className="text-xs text-slate-500">{u.email}</div>}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
