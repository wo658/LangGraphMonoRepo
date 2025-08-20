"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toggleTemplateLike, type TemplateItem } from "@/lib/api"
import { Heart } from "lucide-react"
import { GraphPreview } from "@/components/graph-preview"

export function TemplateCard({
  item,
  currentUserId,
  onLikeChange,
  onEdit,
  onDelete,
  onPreview,
}: {
  item: TemplateItem
  currentUserId?: string | null
  onLikeChange?: (id: string, liked: boolean, likes: number) => void
  onEdit?: (item: TemplateItem) => void
  onDelete?: (id: string) => void
  onPreview?: (item: TemplateItem) => void
}) {
  const initiallyLiked = useMemo(
    () => !!(currentUserId && item.likedBy?.some((u) => u === currentUserId)),
    [currentUserId, item.likedBy]
  )
  const [liked, setLiked] = useState<boolean>(initiallyLiked)
  const [likes, setLikes] = useState<number>(item.likedByCount ?? item.likedBy?.length ?? 0)
  const [loading, setLoading] = useState(false)

  const handleToggleLike = async () => {
    if (!currentUserId) return
    if (loading) return
    setLoading(true)
    // Optimistic update
    setLiked((prev) => !prev)
    setLikes((prev) => (liked ? Math.max(prev - 1, 0) : prev + 1))
    try {
      const res = await toggleTemplateLike(item._id)
      setLiked(res.liked)
      setLikes(res.likes)
      onLikeChange?.(item._id, res.liked, res.likes)
    } catch (e) {
      // revert on error
      setLiked(initiallyLiked)
      setLikes(item.likedByCount ?? item.likedBy?.length ?? 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 h-full flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={item.title}>
            {item.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="shrink-0 capitalize">
            {item.language}
          </Badge>
          {currentUserId && currentUserId === item.author && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => onEdit?.(item)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Delete this template?')) onDelete?.(item._id)
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 transition"
        onClick={() => onPreview?.(item)}
        role="button"
        aria-label="Preview graph"
      >
        <GraphPreview code={item.code} language={item.language as any} height={160} compact />
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
        <Button
          size="sm"
          variant={liked ? "default" : "outline"}
          onClick={handleToggleLike}
          disabled={!currentUserId || loading}
          className="gap-2"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          <span>{likes}</span>
        </Button>
      </div>
    </Card>
  )
}
