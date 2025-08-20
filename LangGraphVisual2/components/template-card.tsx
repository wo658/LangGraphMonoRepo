"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toggleTemplateLike, type TemplateItem } from "@/lib/api"
import { Heart } from "lucide-react"

export function TemplateCard({
  item,
  currentUserId,
  onLikeChange,
  onEdit,
  onDelete,
}: {
  item: TemplateItem
  currentUserId?: string | null
  onLikeChange?: (id: string, liked: boolean, likes: number) => void
  onEdit?: (item: TemplateItem) => void
  onDelete?: (id: string) => void
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
          {item.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
          )}
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

      <pre className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs overflow-auto max-h-40">
        {item.code}
      </pre>

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
