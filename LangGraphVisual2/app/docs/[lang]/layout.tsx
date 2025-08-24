import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { DocsSidebar } from "@/components/docs-sidebar"

export default async function DocsLangLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: langRaw } = await params
  const lang = (langRaw || "").toLowerCase()
  if (lang !== "en" && lang !== "ko") redirect("/docs/en")

  return (
    <div className="py-10">
      <div className="flex gap-8">
        <div className="hidden md:block w-56 flex-shrink-0">
          <DocsSidebar lang={lang} />
        </div>
        <div className="min-w-0 flex-1 px-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
