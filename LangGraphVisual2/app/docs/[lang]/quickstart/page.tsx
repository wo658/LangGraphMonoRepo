import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

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
    title: isKo ? "빠른 시작 | LangGraph Visualizer" : "Quickstart | LangGraph Visualizer",
    description: isKo
      ? "설치 없이 브라우저에서 바로 시작하세요. 템플릿을 불러와 실행하고 결과를 확인하세요."
      : "Start in the browser with zero install. Load a template, run it, and inspect results.",
  }
}

export default async function Quickstart({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isKo = lang?.toLowerCase() === "ko"
  const langCode = isKo ? "ko" : "en"
  return (
    <main>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/docs/${langCode}`}>Docs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Quickstart</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-4">{isKo ? "빠른 시작" : "Quickstart"}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isKo ? "브라우저에서 3단계로 시작" : "Get started in 3 steps (in browser)"}</CardTitle>
          <CardDescription>{isKo ? "홈 → 템플릿 → 실행/확인" : "Home → Template → Run/Inspect"}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{isKo ? "홈 페이지에 접속합니다." : "Visit the Home page."}</li>
            <li>{isKo ? "템플릿을 불러옵니다." : "Load a template."}</li>
            <li>{isKo ? "실행하고 상태/로그를 확인합니다." : "Run it and inspect state/logs."}</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/docs/${langCode}/tutorials/first-graph`}>
            {isKo ? "첫 그래프 만들기" : "Build Your First Graph"}
          </Link>
        </Button>
      </div>
    </main>
  )
}
