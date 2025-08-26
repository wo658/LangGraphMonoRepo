import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
    title: isKo ? "문서 홈 | LangGraph Visualizer" : "Docs Home | LangGraph Visualizer",
    description: isKo
      ? "LangGraph 워크플로우를 시각화하고 편집하세요. Quickstart와 튜토리얼로 빠르게 시작할 수 있습니다."
      : "Visualize and edit LangGraph workflows. Get started fast with our quickstart and tutorials.",
  }
}

export default async function DocsHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isKo = lang?.toLowerCase() === "ko"
  const langCode = isKo ? "ko" : "en"

  const t = {
    h1: isKo ? "LangGraph Visualizer 문서" : "LangGraph Visualizer Documentation",
    p1: isKo
      ? "이 문서는 LangGraph 워크플로우를 시각화/편집하는 방법을 안내합니다. Quickstart로 3분 만에 시작하세요."
      : "This documentation helps you visualize and edit LangGraph workflows. Start in minutes with the Quickstart.",
    ctaPrimary: isKo ? "플레이그라운드 열기" : "Open Playground",
    ctaSecondary: isKo ? "3분 만에 시작하기" : "Start in 3 Minutes",
  }

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
            <BreadcrumbPage>{isKo ? "한국어" : "English"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-2">{t.h1}</h1>
      <p className="text-muted-foreground mb-6">{t.p1}</p>
      <div className="flex flex-wrap gap-3 mb-8">
        <Button asChild>
          <Link href="/">{t.ctaPrimary}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/docs/${langCode}/quickstart`}>{t.ctaSecondary}</Link>
        </Button>
      </div>

      <section className="space-y-2 mb-8">
        <h2 className="text-xl font-semibold">{isKo ? "LangGraph란?" : "What is LangGraph?"}</h2>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "LangGraph는 LLM 애플리케이션을 노드-엣지 흐름으로 구성해 상태 전이와 제어를 명시적으로 다루는 그래프 실행 모델입니다. 브랜칭, 반복, 에러 처리 같은 복잡한 흐름을 시각적으로 설계하고 안정적으로 실행할 수 있게 해줍니다."
            : "LangGraph is a graph execution model for LLM apps that makes control-flow and state transitions explicit via nodes and edges. It helps you design complex flows like branching, loops, and error handling visually and run them reliably."}
        </p>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-xl font-semibold">{isKo ? "LLM 에이전트란?" : "What is an LLM Agent?"}</h2>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "LLM 에이전트는 대규모 언어 모델이 도구 호출, 메모리 참조, 외부 API 연동 등을 통해 목표 지향적으로 행동하도록 구성한 실행 단위입니다. 프롬프트만으로는 어려운 분기·반복·에러 복구를 제어 흐름으로 명확히 표현할수록 예측 가능성과 재현성이 높아집니다."
            : "An LLM agent is an execution unit where a large language model acts toward goals via tool calls, memory, and external APIs. Expressing branching, loops, and error recovery as explicit control-flow improves predictability and reproducibility beyond prompts alone."}
        </p>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "LangGraph는 이러한 에이전트의 상태와 제어 흐름을 그래프로 모델링하여 시각적으로 설계·실행·관측할 수 있게 합니다. 노드에는 LLM/도구 호출 로직을, 엣지에는 전이 조건을 담아 복잡한 에이전트 행동을 안전하게 운영 환경으로 가져갈 수 있습니다."
            : "LangGraph models an agent's state and control-flow as a graph, enabling visual design, execution, and observability. Nodes encapsulate LLM/tool call logic, while edges encode transition conditions, making complex agent behavior production-ready."}
        </p>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-xl font-semibold">{isKo ? "왜 LLM 워크플로우에 중요한가" : "Why it matters for LLM workflows"}</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>{isKo ? "프롬프트·툴·메모리 등 구성 요소를 모듈화하여 재사용" : "Modularize prompts, tools, memory for reuse"}</li>
          <li>{isKo ? "실행 가능한 제어 흐름으로 디버깅·관측 용이" : "Executable control-flow for easier debugging and observability"}</li>
          <li>{isKo ? "부분 실행/재시도/중단 복구 등 프로덕션 친화성" : "Production-friendly: partial runs, retries, and recovery"}</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{isKo ? "이 웹앱으로 개발할 때의 장점" : "Benefits of using this web app"}</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>{isKo ? "비 개발자도 설치 없이 브라우저에서 즉시 사용" : "Zero install, runs in the browser, accessible to non-developers"}</li>
          <li>{isKo ? "그래프 편집·실행·로그/상태 트레이스 시각화" : "Edit, run, and visualize logs/state traces"}</li>
          <li>{isKo ? "템플릿으로 빠르게 시작하고 커스터마이징" : "Start from templates and customize quickly"}</li>
        </ul>
      </section>
    </main>
  )
}
