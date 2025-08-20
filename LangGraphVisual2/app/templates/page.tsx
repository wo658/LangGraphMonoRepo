"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/stores/i18n-store"
import { useAuth } from "@/stores/auth-store"
import { listTemplates, type TemplateItem, createTemplate, updateTemplate, deleteTemplate, getTemplate } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TemplateCard } from "@/components/template-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TemplateForm, type TemplateFormValues } from "@/components/template-form"

export default function TemplatesPage() {
  const { t } = useI18n()
  const { user } = useAuth()

  const [q, setQ] = useState("")
  const [sort, setSort] = useState<'latest' | 'likes'>("latest")
  const [tab, setTab] = useState<'all' | 'mine'>("all")

  const [items, setItems] = useState<TemplateItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // Modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TemplateItem | null>(null)
  const isOwnerTab = tab === 'mine'

  const authorId = useMemo(() => (tab === 'mine' ? user?.id : undefined), [tab, user?.id])

  const fetchPage = async (nextPage: number, reset = false) => {
    setLoading(true)
    try {
      const res = await listTemplates({ q, sort, page: nextPage, limit: 12, authorId, scope: isOwnerTab ? 'mine' : undefined })
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]))
      setTotalPages(res.totalPages)
      setPage(res.page)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => {
      fetchPage(1, true)
    }, 300)
    return () => clearTimeout(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort, authorId])

  // Initial load
  useEffect(() => {
    fetchPage(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLikeChange = (id: string, liked: boolean, likes: number) => {
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, likedByCount: likes } : it)))
  }

  // Create / Edit / Delete handlers
  const handleNew = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleEdit = async (item: TemplateItem) => {
    try {
      // fetch full doc to get visibility/sharedWith if needed
      const full = await getTemplate(item._id)
      setEditing({ ...full })
    } catch {
      setEditing(item)
    } finally {
      setOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteTemplate(id)
    // remove from list
    setItems((prev) => prev.filter((x) => x._id !== id))
  }

  const submitForm = async (values: TemplateFormValues) => {
    if (editing) {
      const updated = await updateTemplate(editing._id, values)
      setItems((prev) => prev.map((x) => (x._id === updated._id ? { ...x, ...updated } : x)))
    } else {
      const created = await createTemplate(values)
      // Prepend new item when on any tab; if on 'mine' but created by me, it will show as well
      setItems((prev) => [created, ...prev])
    }
    setOpen(false)
    setEditing(null)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          {t("templates.title")}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'mine')}>
            <TabsList>
              <TabsTrigger value="all">{t("templates.tab.all")}</TabsTrigger>
              <TabsTrigger value="mine">{t("templates.tab.mine")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1 min-w-[200px] max-w-[420px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("templates.search.placeholder")}
            />
          </div>

          <Select value={sort} onValueChange={(v) => setSort(v as 'latest' | 'likes')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t("templates.sort.latest")}</SelectItem>
              <SelectItem value="likes">{t("templates.sort.likes")}</SelectItem>
            </SelectContent>
          </Select>
          {user && (
            <Button onClick={handleNew} className="ml-auto">New Template</Button>
          )}
        </div>

        {tab === 'mine' && !user && (
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Sign in to view your templates.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <TemplateCard
              key={item._id}
              item={item}
              currentUserId={user?.id}
              onLikeChange={handleLikeChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />)
          )}
        </div>

        <div className="flex items-center justify-center mt-6">
          {page < totalPages && (
            <Button onClick={() => fetchPage(page + 1)} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          )}
          {page >= totalPages && items.length === 0 && (
            <div className="text-sm text-slate-500">No templates found.</div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <TemplateForm
            initial={editing || { language: 'python', visibility: 'private' }}
            submitText={editing ? 'Update' : 'Create'}
            onSubmit={submitForm}
            onCancel={() => {
              setOpen(false)
              setEditing(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
