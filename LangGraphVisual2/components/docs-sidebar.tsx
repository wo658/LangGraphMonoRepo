"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DocsSidebar({ lang }: { lang: string }) {
  const pathname = (usePathname() || "").replace(/\/$/, "")
  const isKo = lang?.toLowerCase() === "ko"
  const base = `/docs/${isKo ? "ko" : "en"}`

  const items: Array<{ label: string; href: string }> = [
    { label: isKo ? "문서 홈" : "Docs Home", href: `${base}` },
    { label: isKo ? "빠른 시작" : "Quickstart", href: `${base}/quickstart` },
    { label: isKo ? "튜토리얼: 첫 그래프" : "Tutorial: First Graph", href: `${base}/tutorials/first-graph` },
  ]

  return (
    <aside className="sticky top-20">
      <ScrollArea className="h-[calc(100vh-120px)] pr-2">
        <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {isKo ? "문서 내 탐색" : "Navigate docs"}
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const href = item.href.replace(/\/$/, "")
            const active = pathname === href
            const baseCls = "block px-2 py-1.5 rounded-md text-sm"
            const inactiveCls = "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            const activeCls = "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${baseCls} ${active ? activeCls : inactiveCls}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}
