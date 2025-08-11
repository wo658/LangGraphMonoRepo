# Design Document

## Overview

현재 v0로 생성된 LangGraph 플레이그라운드를 Context7 MCP를 활용하여 Next.js 15 App Router 표준에 맞는 현대적인 개발 환경으로 발전시키는 설계입니다. 기존의 기능적 완성도를 유지하면서 코드 품질, 개발자 경험, 확장성을 크게 향상시키는 것이 목표입니다.

### 현재 상태 분석

**강점:**
- Next.js 15 + React 19 + TypeScript 기반의 최신 스택
- Radix UI + Tailwind CSS를 활용한 접근성 높은 UI
- Monaco Editor + ReactFlow를 통한 강력한 시각화 기능
- 다국어 지원 (한국어/영어) 및 테마 지원
- 컴포넌트 기반의 모듈화된 구조

**개선 필요 영역:**
- 코드 품질 도구 (ESLint, Prettier, 테스트) 부재
- 개발 워크플로우 자동화 부족
- 성능 최적화 및 접근성 개선 여지
- 확장 가능한 아키텍처 패턴 적용 필요
- **핵심 누락: 실제 Python 코드 실행/파싱 로직 (현재 샘플 데이터만 사용)**
- **백엔드 API 연동 부재 (Python 실행 환경 필요)**

## Architecture

### 1. 프로젝트 구조 개선

```
project-root/
├── .kiro/                    # Kiro 설정 및 스펙
│   ├── settings/
│   │   └── mcp.json         # Context7 MCP 설정
│   └── specs/
├── app/                     # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx          # Root Layout (Server Component)
│   └── page.tsx            # Home Page (Client Component)
├── components/             # UI 컴포넌트
│   ├── ui/                 # shadcn/ui 컴포넌트 (복사된 코드)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   └── toaster.tsx
│   ├── app-header.tsx      # 기존 컴포넌트 개선
│   ├── editor-settings.tsx
│   ├── import-export-buttons.tsx
│   ├── langgraph-visualizer.tsx
│   └── theme-provider.tsx
├── lib/                    # 유틸리티 및 설정
│   ├── utils.ts           # shadcn/ui cn() 함수 포함
│   ├── types.ts           # 타입 정의
│   └── constants.ts       # 상수 정의
├── hooks/                  # Custom React Hooks
│   ├── use-mobile.tsx     # 기존
│   └── use-toast.ts       # 기존
├── contexts/               # React Contexts
│   └── language-context.tsx # 기존
├── public/                 # 정적 자산
├── __tests__/              # 테스트 파일 (새로 추가)
├── .eslintrc.json          # ESLint 설정 (새로 추가)
├── .prettierrc             # Prettier 설정 (새로 추가)
├── jest.config.js          # Jest 설정 (새로 추가)
├── components.json         # shadcn/ui 설정 (새로 추가)
├── tsconfig.json           # TypeScript 설정 (strict 모드)
└── next.config.mjs         # Next.js 설정
```

### 2. shadcn/ui 통합 현황 ✅

**이미 완료된 설정:**
- ✅ `components.json` 설정 완료 (default 스타일, CSS variables 활성화)
- ✅ 50+ shadcn/ui 컴포넌트 설치 완료
- ✅ Path aliases 설정 (`@/components`, `@/lib/utils`, `@/components/ui`)
- ✅ Tailwind CSS 통합 및 CSS variables 테마 시스템

**사용 가능한 주요 컴포넌트:**
- `button`, `card`, `separator`, `dropdown-menu` ✅ 설치됨
- `toast`, `alert`, `badge`, `skeleton` ✅ 설치됨
- `dialog`, `popover`, `tabs`, `form` ✅ 설치됨
- 기타 40+ 컴포넌트 사용 가능

### 3. 컴포넌트 아키텍처 단순화

**기존 컴포넌트 개선 (복잡한 새 구조 대신):**
- `app-header.tsx` → shadcn/ui 컴포넌트 활용
- `editor-settings.tsx` → 드롭다운 메뉴로 단순화
- `langgraph-visualizer.tsx` → 카드 컴포넌트로 감싸기
- `import-export-buttons.tsx` → 버튼 컴포넌트 교체

**상태 관리 단순화:**
- 기존 Context 유지 (LanguageContext, ThemeProvider)
- 복잡한 새 Context 추가하지 않음
- 컴포넌트 레벨에서 상태 관리

## Components and Interfaces

### 1. 기존 타입 정의 개선

```typescript
// lib/types.ts (기존 components/langgraph.ts 확장)
export interface LangGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata?: {
    version: string
    createdAt: string
    updatedAt: string
  }
}

export interface GraphNode {
  id: string
  label: string
  type?: string
  position?: { x: number; y: number }
  data?: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
}

export interface EditorSettings {
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  tabSize: number
}

// 새로운 타입들
export type Language = 'en' | 'ko'
export type Theme = 'light' | 'dark' | 'system'
```

### 2. 컴포넌트 Props 단순화

**기존 컴포넌트 개선만 진행:**
- AppHeader: shadcn/ui Button, DropdownMenu 사용
- EditorSettings: shadcn/ui DropdownMenu로 단순화
- LangGraphVisualizer: shadcn/ui Card로 감싸기
- ImportExportButtons: shadcn/ui Button 사용

### 3. Provider 구조 단순화

**기존 구조 유지:**
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## Data Models

### 1. 기존 데이터 모델 유지

**기존 구조를 최대한 활용:**
- `components/langgraph.ts` → `lib/types.ts`로 이동
- 복잡한 설정 객체 대신 간단한 상수 사용
- 로컬 스토리지는 기존 방식 유지

```typescript
// lib/constants.ts
export const DEFAULT_EDITOR_SETTINGS = {
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  tabSize: 4,
} as const

export const SUPPORTED_LANGUAGES = ['en', 'ko'] as const
export const DEFAULT_LANGUAGE = 'en'
```

## Error Handling

### 1. 간단한 에러 처리

**기존 toast 시스템 활용:**
- 현재 `useToast` 훅 사용
- shadcn/ui Alert 컴포넌트로 에러 표시
- 복잡한 에러 바운더리 대신 컴포넌트 레벨 에러 처리

```typescript
// 기존 방식 개선
const { toast } = useToast()

const handleError = (error: Error) => {
  toast({
    title: "오류 발생",
    description: error.message,
    variant: "destructive",
  })
}
```

## Testing Strategy

### 1. 테스트 환경 설정

**Jest + React Testing Library:**
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 2. 테스트 전략

**단위 테스트:**
- 유틸리티 함수 (lib/)
- Custom hooks (hooks/)
- 순수 컴포넌트 (components/ui/)

**통합 테스트:**
- Context Providers
- 복합 컴포넌트 (features/)
- 사용자 워크플로우

**E2E 테스트 (향후 확장):**
- Playwright를 활용한 전체 사용자 시나리오

### 3. 테스트 예시

```typescript
// __tests__/components/EditorPanel.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditorPanel } from '@/components/features/editor/EditorPanel'
import { AppProviders } from '@/components/providers/AppProviders'

const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: AppProviders })
}

describe('EditorPanel', () => {
  const mockProps = {
    code: 'print("hello")',
    onCodeChange: jest.fn(),
    settings: { fontSize: 14, wordWrap: true, minimap: false, tabSize: 4 },
    onSettingsChange: jest.fn(),
    onRun: jest.fn(),
    isRunning: false,
  }

  it('renders code editor with initial code', () => {
    renderWithProviders(<EditorPanel {...mockProps} />)
    expect(screen.getByDisplayValue('print("hello")')).toBeInTheDocument()
  })

  it('calls onRun when run button is clicked', async () => {
    renderWithProviders(<EditorPanel {...mockProps} />)
    
    const runButton = screen.getByRole('button', { name: /run/i })
    fireEvent.click(runButton)
    
    await waitFor(() => {
      expect(mockProps.onRun).toHaveBeenCalledTimes(1)
    })
  })
})
```

## Performance Optimization

### 1. 코드 분할 및 지연 로딩

```typescript
// 무거운 컴포넌트들의 동적 로딩
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorSkeleton />
})

const ReactFlowVisualizer = dynamic(
  () => import('@/components/features/visualizer/ReactFlowVisualizer'),
  {
    ssr: false,
    loading: () => <VisualizerSkeleton />
  }
)
```

### 2. 메모이제이션 전략

```typescript
// components/features/editor/CodeEditor.tsx
export const CodeEditor = memo(function CodeEditor({
  value,
  onChange,
  settings,
  theme
}: CodeEditorProps) {
  const editorOptions = useMemo(() => ({
    minimap: { enabled: settings.minimap },
    fontSize: settings.fontSize,
    wordWrap: settings.wordWrap ? 'on' : 'off',
    tabSize: settings.tabSize,
    automaticLayout: true,
  }), [settings])

  const handleChange = useCallback((value: string | undefined) => {
    onChange(value || '')
  }, [onChange])

  return (
    <MonacoEditor
      value={value}
      onChange={handleChange}
      options={editorOptions}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
    />
  )
})
```

### 3. 상태 최적화

```typescript
// hooks/useGraphState.ts
export function useGraphState() {
  const [state, setState] = useState<GraphState>({
    graph: null,
    history: [],
    selectedNodes: [],
    viewportState: { x: 0, y: 0, zoom: 1 }
  })

  const updateGraph = useCallback((graph: LangGraph) => {
    setState(prev => ({
      ...prev,
      graph,
      history: [...prev.history.slice(-9), graph] // 최근 10개만 유지
    }))
  }, [])

  const selectNodes = useCallback((nodeIds: string[]) => {
    setState(prev => ({ ...prev, selectedNodes: nodeIds }))
  }, [])

  return { state, updateGraph, selectNodes }
}
```

## Development Workflow

### 1. 코드 품질 도구 설정

**ESLint 설정:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

**Prettier 설정:**
```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 2. Git Hooks 설정

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run type-check && npm run test"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### 3. 개발 스크립트

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```


### 2. 개발 워크플로우에서의 활용

**실시간 문서 참조:**
- 컴포넌트 개발 시 Next.js 공식 문서 자동 참조
- 베스트 프랙티스 제안 및 코드 리뷰
- 성능 최적화 가이드라인 제공

**코드 생성 지원:**
- Next.js App Router 패턴에 맞는 컴포넌트 생성
- TypeScript 타입 정의 자동 생성
- 테스트 코드 스캐폴딩

## Python Code Execution Strategy

### 1. 현재 상태 분석

**현재 구현:**
- `app/page.tsx`의 `handleRunCode` 함수에서 하드코딩된 샘플 데이터 사용
- 실제 Python 코드 파싱이나 실행 없음
- LangGraph 구조 분석 로직 부재

**필요한 구현:**
```typescript
// 현재 (Mock)
const sampleGraph: LangGraph = {
  nodes: [/* 하드코딩된 노드들 */],
  edges: [/* 하드코딩된 엣지들 */]
}

// 목표 (Real)
const parsedGraph = await parseLangGraphCode(code)
const executionResult = await executePythonCode(code)
```

### 2. Python 실행 환경 옵션

**Option A: 백엔드 API 서버**
```typescript
// API 엔드포인트 구조
POST /api/execute-python
{
  "code": "python_code_string",
  "timeout": 30000
}

// 응답 구조
{
  "success": true,
  "graph": { nodes: [], edges: [] },
  "output": "execution_output",
  "error": null
}
```

**Option B: 클라이언트 사이드 (Pyodide)**
```typescript
// Pyodide를 활용한 브라우저 내 Python 실행
import { loadPyodide } from 'pyodide'

const pyodide = await loadPyodide()
await pyodide.loadPackage(['langgraph', 'langchain'])
const result = pyodide.runPython(code)
```

**Option C: WebAssembly (WASM)**
```typescript
// Python을 WASM으로 컴파일하여 실행
import { PythonWasm } from 'python-wasm'

const python = new PythonWasm()
const result = await python.execute(code)
```

### 3. 권장 구현 방안

**단계별 접근:**

**Phase 1: 백엔드 API 개발**
- FastAPI 또는 Flask 기반 Python 실행 서버
- Docker 컨테이너를 통한 격리된 실행 환경
- LangGraph 코드 파싱 및 구조 분석

**Phase 2: 프론트엔드 통합**
- API 클라이언트 구현
- 에러 처리 및 로딩 상태 관리
- 실시간 실행 결과 표시

**Phase 3: 고급 기능**
- 코드 디버깅 지원
- 실행 히스토리 관리
- 성능 프로파일링

## Migration Strategy

### 1. 단계별 마이그레이션

**Phase 1: 기반 설정 및 Python 실행 환경**
- TypeScript strict 모드 활성화
- ESLint, Prettier 설정
- 테스트 환경 구축
- **Python 백엔드 API 개발 시작**

**Phase 2: 아키텍처 개선 및 실제 실행 통합**
- 컴포넌트 구조 리팩토링
- Context API 개선
- 에러 처리 강화
- **실제 Python 코드 실행 로직 구현**

**Phase 3: 기능 확장 및 최적화**
- 성능 최적화
- 접근성 개선
- **고급 디버깅 및 분석 도구**

### 2. 호환성 유지

- 기존 UI/UX의 완전한 호환성 보장
- 사용자 데이터 (설정, 히스토리) 마이그레이션
- 점진적 개선을 통한 안정성 확보
- **Mock 데이터에서 실제 실행으로의 원활한 전환**