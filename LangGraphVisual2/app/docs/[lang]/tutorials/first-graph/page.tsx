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
    title: isKo ? "첫 그래프 튜토리얼 | LangGraph Visualizer" : "Build Your First Graph | LangGraph Visualizer",
    description: isKo
      ? "LangGraph 워크플로우를 단계별로 만들어 봅니다."
      : "Step-by-step tutorial to create your first LangGraph workflow.",
  }
}

export default async function FirstGraph({ params }: { params: Promise<{ lang: string }> }) {
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
            <BreadcrumbLink asChild>
              <Link href={`/docs/${langCode}/tutorials/first-graph`}>{isKo ? "튜토리얼" : "Tutorials"}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isKo ? "첫 그래프" : "First Graph"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-4">{isKo ? "첫 그래프 만들기" : "Build Your First Graph"}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isKo ? "코드 기반 접근" : "Code-based approach"}</CardTitle>
          <CardDescription>{isKo ? "코드에서 그래프를 정의하고 실행" : "Define and run the graph in code"}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 mb-2 text-sm">
            <li>{isKo ? "상태 모델과 초기 상태를 정의합니다." : "Define the state model and initial state."}</li>
            <li>{isKo ? "노드 함수(LLM 호출/도구 호출 포함)를 작성합니다." : "Implement node functions (including LLM/tool calls)."}</li>
            <li>{isKo ? "엣지로 제어 흐름을 구성하고 엔트리포인트를 지정합니다." : "Wire control flow with edges and set the entry point."}</li>
            <li>{isKo ? "실행 후 로그/상태 트레이스를 확인하며 반복 개선합니다." : "Run and inspect logs/state traces; iterate."}</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isKo ? "GUI 기반 접근" : "GUI-based approach"}</CardTitle>
          <CardDescription>{isKo ? "브라우저에서 드래그앤드롭으로 구성" : "Build visually in the browser"}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 mb-2 text-sm">
            <li>{isKo ? "홈 페이지에서 새 그래프 또는 템플릿으로 시작합니다." : "Start a new graph or from a template on the Home page."}</li>
            <li>{isKo ? "노드/엣지를 추가하고 속성을 설정합니다." : "Add nodes/edges and configure properties."}</li>
            <li>{isKo ? "엔트리포인트를 지정하고 실행합니다." : "Set the entry point and run."}</li>
            <li>{isKo ? "로그/상태를 시각화해 디버깅합니다." : "Visualize logs/state for debugging."}</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/docs/${langCode}/quickstart`}>
            {isKo ? "Quickstart 돌아가기" : "Back to Quickstart"}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/docs/${langCode}`}>
            {isKo ? "문서 홈" : "Docs Home"}
          </Link>
        </Button>
      </div>
    </main>
  )
}
