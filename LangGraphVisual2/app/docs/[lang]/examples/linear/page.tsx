import type { Metadata } from "next"
import { redirect } from "next/navigation"

// Force static generation at build time
export const dynamic = 'force-static'
export const dynamicParams = false

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'ko' },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const isKo = lang?.toLowerCase() === "ko"
  return {
    title: isKo ? "예제: 직선형 워크플로우 | LangGraph Visualizer" : "Example: Linear Workflow | LangGraph Visualizer",
    description: isKo
      ? "변형하기 쉬운 최소 직선형 LangGraph 워크플로우 예제입니다."
      : "A minimal linear LangGraph workflow you can load and modify.",
  }
}

export default async function ExampleLinear({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isKo = lang?.toLowerCase() === "ko"
  const langCode = isKo ? "ko" : "en"
  redirect(`/docs/${langCode}/tutorials/first-graph`)
  return null
}
