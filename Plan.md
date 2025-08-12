# LangGraphVisual2 백엔드 기능 계획 (NestJS 기반)

## 1) 개요
- 이 문서는 LangGraphVisual2 프로젝트의 백엔드 기능을 NestJS로 설계/구현하기 위한 상위 계획을 정리합니다.
- 프론트엔드는 Next.js(App Router) + ReactFlow + Zustand로 구성되어 있으며, 데이터 모델은 `LangGraph`, `GraphNode`, `GraphEdge` (`LangGraphVisual2/lib/types.ts`)에 정의되어 있습니다.
- 백엔드는 동일한 데이터 계약을 유지하며, 안전한 코드 실행과 검증/레이아웃/영속화 기능을 제공합니다.

## 2) 현재 상태 요약
- 프론트엔드: 그래프 시각화, 시뮬레이션용 파서/코드생성 로직, 시각적 편집 UI 존재
- 백엔드: `LangGraphVisual2-Backend/` 디렉터리만 존재(비어있음)
- 한계: 서버사이드 파이썬 실행/검증/API 부재, 영속화/공유 기능 없음

## 3) 목표
- 서버 API로 신뢰도 높은 파싱/검증/레이아웃/코드생성 제공
- 안전한 Python 실행(샌드박스) 및 트레이스 수집
- 그래프/코드의 저장/로드(향후 사용자별 라이브러리)
- 프론트엔드와 타입 일치(계약 안정성), 보안/관찰성/확장성 고려

## 4) 시스템 아키텍처 개요
- Frontend (기존): Next.js 15 + React 19 + Zustand + ReactFlow
- Backend (신규): NestJS (TypeScript)
  - Validation: class-validator/class-transformer
  - API 문서: Swagger (OpenAPI)
  - 보안: Helmet, CORS, Rate limiting
  - 로깅/관찰성: pino/winston + requestId, 응답시간, 에러 수집
- Python 실행 전략(Phase 2):
  - 옵션 A: Docker 기반 샌드박스에서 파이썬 실행(`python:3.11-slim`), CPU/메모리/시간 제한, 네트워크 차단
  - 옵션 B: 별도 Python 마이크로서비스(FastAPI 등)로 위임, Nest가 HTTP/gRPC로 호출
  - 초기엔 A로 단순화, 필요시 B로 확장
- 데이터 저장소(Phase 3): PostgreSQL + Prisma(또는 TypeORM). 초기 MVP는 스토리지 없이 진행 가능

## 5) API 설계 (초안)
요청/응답 타입은 프론트 `lib/types.ts`의 `LangGraph`, `GraphNode`, `GraphEdge`, `Position`을 준수합니다.

1. 코드 → 그래프 파싱
- POST `/parse`
- Request: `{ language: 'python' | 'typescript' | 'javascript', code: string }`
- Response(성공): `{ success: true, graph: LangGraph, warnings?: string[] }`
- Response(실패): `{ success: false, errors: { message: string, line?: number, column?: number }[] }`

2. 그래프 유효성 검증
- POST `/graph/validate`
- Request: `{ graph: LangGraph }`
- Response:
  ```json
  {
    "valid": true,
    "issues": [
      { "type": "duplicate-node-id" | "dangling-edge" | "unreachable-node" | "cycle" | "missing-entry" | "invalid-handle" | "label-mismatch", "details": "...", "nodes": ["..."], "edges": ["..."] }
    ],
    "metrics": { "nodeCount": 0, "edgeCount": 0, "density": 0, "components": 1, "hasCycles": false }
  }
  ```

3. 그래프 레이아웃 계산
- POST `/graph/layout`
- Request: `{ graph: LangGraph, options?: { rankdir?: 'LR'|'TB', nodeSep?: number, rankSep?: number } }`
- Response: `{ graph: LangGraph }` (노드 `position` 채워서 반환)

4. 그래프 → 코드 생성
- POST `/code/generate`
- Request: `{ graph: LangGraph, language: 'python' | 'typescript' }`
- Response: `{ code: string, warnings?: string[] }`

5. 코드 실행(파이썬) + 트레이스 (Phase 2)
- POST `/execute`
- Request: `{ code: string, input?: any, timeoutMs?: number }`
- Response:
  ```json
  { "success": true, "output": {}, "trace": [{"node": "id", "state": {}}], "stdout": "", "stderr": "" }
  ```
  실패 시 `{ success: false, error: { message, line?, column? }, stdout?, stderr? }`

6. 영속화/공유 (Phase 3)
- POST `/graphs` → `{ id, graph, code, metadata }`
- GET `/graphs/:id`
- PUT `/graphs/:id`
- GET `/templates` / GET `/templates/:id`
- (선택) 인증/권한: OAuth(추후)

## 6) 백엔드 모듈 설계 (NestJS)
- `ParseModule` … `/parse`
- `GraphModule` … `/graph/validate`, `/graph/layout`
- `CodeModule` … `/code/generate`
- `ExecuteModule` … `/execute` (샌드박스 연동)
- `TemplatesModule` … `/templates`
- `PersistenceModule` … `/graphs` (DB 연동, Prisma/TypeORM)
- 공통: `CommonModule`(logging, filters, interceptors, pipes), `ConfigModule`(.env), `HealthModule`(`/health`)

디렉터리 스케치 (LangGraphVisual2-Backend/):
```
src/
  main.ts
  app.module.ts
  common/
    filters/http-exception.filter.ts
    interceptors/logging.interceptor.ts
    pipes/validation.pipe.ts
  parse/
    parse.module.ts
    parse.controller.ts
    parse.service.ts
    dto/parse.dto.ts
  graph/
    graph.module.ts
    graph.controller.ts
    graph.service.ts
    dto/validate.dto.ts
    dto/layout.dto.ts
  code/
    code.module.ts
    code.controller.ts
    code.service.ts
  execute/
    execute.module.ts
    execute.controller.ts
    execute.service.ts
  persistence/
    persistence.module.ts
    graphs.controller.ts
    graphs.service.ts
    entities/graph.entity.ts (또는 prisma schema)
  templates/
    templates.module.ts
    templates.controller.ts
    templates.service.ts
```

## 7) 데이터 모델 계약 (프론트 정합성)
- `GraphNode { id: string; label: string; type?: string; position?: { x: number; y: number } }`
- `GraphEdge { id: string; source: string; target: string; label?: string; animated?: boolean; isLoopFeedback?: boolean; sourceHandle?: string; targetHandle?: string }`
- `LangGraph { nodes: GraphNode[]; edges: GraphEdge[] }`
- 백엔드는 DTO/스키마로 동일 구조를 검증하고 반환합니다.

## 8) 보안/안전/운영
- 입력 검증: DTO + class-validator로 스키마 강제
- 공통 보안: Helmet, CORS, Rate limiting, CSRF(필요 시)
- 실행 샌드박스(Phase 2): Docker로 네트워크 차단, 메모리/CPU/시간 제한, 임시 파일 격리
- 로깅/관찰성: requestId, 응답시간, 에러스택, 주요 메트릭 노출(Prometheus 호환 지표 고려)

## 9) 프론트엔드 연동 포인트
- `app/page.tsx`의 `handleRunCode()` → `/parse` 호출로 대체 (현재는 클라이언트 파서 사용)
- “Generate Code” 버튼 → `/code/generate` 호출로 대체
- 선택: `/graph/layout` 결과의 `position`을 그대로 반영하여 일관된 배치 유지
- 공용 API 클라이언트 추가: `LangGraphVisual2/lib/api-client.ts`
  - `parseCode`, `validateGraph`, `computeLayout`, `generateCode`, `executeCode`
  - `NEXT_PUBLIC_API_BASE_URL` 사용

## 10) 단계별 로드맵
- __Phase 1 (MVP)__
  - Nest 프로젝트 스캐폴딩, 공통 모듈, Swagger 설정
  - `/parse`, `/graph/validate`, `/graph/layout`, `/code/generate` 구현
  - 프론트엔드 API 클라이언트 및 핸들러 교체
- __Phase 2__
  - `/execute` 샌드박스(옵션 A: Docker) 구현, 리소스 제한/로그 수집
  - 에러 정규화(`/errors/normalize`는 필요 시)
- __Phase 3__
  - `/graphs` 영속화, `/templates` 제공, 인증(옵션)
- __Phase 4__
  - 협업(WebSocket), 텔레메트리/분석, 고급 레이아웃/최적화

## 11) 개발/배포 전략
- 개발
  - Backend: `cd LangGraphVisual2-Backend && npm i && npm run start:dev`
  - Frontend: `pnpm dev` (포트 3000), `.env`에 `NEXT_PUBLIC_API_BASE_URL` 지정
- 배포
  - 백엔드: Dockerize 후 Render/AWS/서버 등 배포, 프로덕션 로깅/모니터링
  - 프론트엔드: Vercel/Netlify 등. CORS/도메인 설정

## 12) 리스크와 완화
- 임의 코드 실행 보안: 샌드박스, 제한 엄수, 감사 로그
- 레이아웃/파싱 성능: 큐/워커 도입, 캐싱, 비동기 처리
- 타입 불일치: 단일 공유 스키마(예: OpenAPI 기반 타입 생성)로 일관성 유지

## 13) 다음 작업(Next Actions)
- [ ] NestJS 스캐폴드 생성 및 모듈 뼈대 추가
- [ ] DTO/스키마 정의(프론트 타입과 일치)
- [ ] `/parse`, `/graph/validate`, `/graph/layout`, `/code/generate` 1차 구현
- [ ] 프론트엔드 API 클라이언트 작성 및 `app/page.tsx` 핸들러 전환
- [ ] 환경변수/문서화/예제 요청/응답 추가
