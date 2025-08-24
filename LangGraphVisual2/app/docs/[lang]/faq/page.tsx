import type { Metadata } from "next"
import { redirect } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const isKo = lang?.toLowerCase() === "ko"
  return {
    title: isKo ? "FAQ | LangGraph Visualizer" : "FAQ | LangGraph Visualizer",
    description: isKo
      ? "FAQ 페이지는 문서 홈으로 이동합니다."
      : "FAQ page redirects to the Docs home.",
  }
}

export default async function FAQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isKo = lang?.toLowerCase() === "ko"
  const langCode = isKo ? "ko" : "en"
  redirect(`/docs/${langCode}`)
  return null
}
