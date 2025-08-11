# Implementation Plan

## Phase 1: 기반 설정 및 코드 품질 개선

- [x] 1. 개발 환경 설정 및 코드 품질 도구 구축
  - ✅ TypeScript strict 모드 (이미 활성화됨)
  - ✅ shadcn/ui 설정 완료 (components.json 존재)
  - ✅ lib/utils.ts cn() 함수 (이미 구현됨)
  - ✅ ESLint 설정 파일 생성 (.eslintrc.json) - **완료**
  - ✅ Prettier 설정 파일 생성 (.prettierrc) - **완료**
  - ✅ Jest + React Testing Library 테스트 환경 구축 - **완료**
    - Monaco Editor, ReactFlow, Next.js 라우터 모킹 완료
    - 글로벌 테스트 유틸리티 설정 (ResizeObserver, matchMedia)
    - 커버리지 임계값 70% 설정
    - 테스트 경로 구성 완료
  - ✅ Kiro IDE 훅 설정 (자동 문서 업데이트)
  - _Requirements: 3.1, 3.2, 7.1, 7.3_

- [x] 2. 타입 시스템 개선 및 코드 구조 정리
  - `components/langgraph.ts` → `lib/types.ts`로 이동 - **필요**
  - `lib/constants.ts` 파일 생성 (기본 설정값들) - **필요**
  - 모든 컴포넌트 props에 명시적 타입 정의 추가 - **필요**
  - _Requirements: 2.2, 3.2, 5.3_

## Phase 2: UI 컴포넌트 개선

- [ ] 4. AppHeader 컴포넌트 shadcn/ui로 리팩토링
  - 기존 Button을 shadcn/ui Button으로 교체
  - DropdownMenu 컴포넌트로 언어/테마 선택 개선
  - ImportExportButtons 통합 및 접근성 개선
  - 반응형 디자인 및 모바일 최적화
  - _Requirements: 2.1, 4.3, 6.2_

- [ ] 5. EditorSettings 컴포넌트 UI/UX 개선
  - Popover 대신 DropdownMenu로 단순화
  - 설정 변경 시 로컬 스토리지 자동 저장
  - 사용자 친화적인 설정 인터페이스 구현
  - 실시간 미리보기 기능 추가
  - _Requirements: 6.1, 6.2_

- [ ] 6. LangGraphVisualizer 컴포넌트 개선




  - ReactFlow를 shadcn/ui Card로 감싸기
  - Badge 컴포넌트로 그래프 통계 표시 개선
  - Skeleton 컴포넌트로 로딩 상태 개선
  - 그래프 상호작용 성능 최적화
  - _Requirements: 6.2, 6.3, 4.1_

- [ ] 7. 에러 처리 및 사용자 피드백 시스템 개선
  - 기존 toast 시스템을 shadcn/ui Toaster로 업그레이드
  - Alert 컴포넌트로 에러 상황 표시
  - 다국어 에러 메시지 지원
  - 재시도 및 복구 기능 구현
  - _Requirements: 3.1, 6.1_

## Phase 3: 핵심 기능 구현 (현재 누락된 부분)


- [ ] 8. Python 코드 파싱 및 실행 로직 구현
  - **현재 샘플 데이터만 사용하는 부분을 실제 파싱으로 교체**
  - Python AST 파싱 라이브러리 연구 및 선택
  - LangGraph 코드 구조 분석 및 노드/엣지 추출 로직
  - 코드 오류 감지 및 디버깅 정보 제공
  - _Requirements: 8.1, 8.2_

- [ ] 9. Python 실행 환경 구축
  - **백엔드 API 서버 구축 또는 클라이언트 사이드 실행 환경 선택**
  - Pyodide (브라우저에서 Python 실행) 또는 FastAPI 백엔드 구현
  - 안전한 코드 실행을 위한 샌드박스 환경
  - 실행 상태 관리 및 취소 기능
  - API 호출 실패 시 폴백 메커니즘
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10. 실시간 코드 분석 및 그래프 업데이트
  - **코드 변경 시 실시간 그래프 업데이트 (현재 미구현)**
  - 디바운스된 코드 분석
  - 점진적 그래프 업데이트 (전체 재생성 방지)
  - 복잡한 그래프의 효율적 렌더링
  - _Requirements: 8.3, 6.1_

## Phase 4: 성능 최적화 및 품질 보증

- [ ] 11. 성능 최적화 및 코드 분할 구현
  - Monaco Editor와 ReactFlow 동적 로딩 최적화
  - React.memo, useCallback, useMemo 적용
  - 컴포넌트 레벨 코드 분할
  - 번들 크기 분석 및 최적화
  - _Requirements: 4.1, 4.2, 5.1_

- [ ] 12. 테스트 코드 작성 및 품질 보증
  - 주요 컴포넌트 단위 테스트
  - Python 파싱 로직 테스트
  - 사용자 인터랙션 통합 테스트
  - Context Provider 및 커스텀 훅 테스트
  - 테스트 커버리지 70% 이상 달성
  - _Requirements: 3.3, 7.1_

## Phase 5: 최종 통합 및 배포 준비

- [ ] 13. Context7 MCP 설정 및 개발 워크플로우 통합
  - `.kiro/settings/mcp.json` 파일 생성
  - Context7 MCP 서버 설정 및 테스트
  - Next.js 문서 참조 워크플로우 구축
  - 코드 생성 및 리뷰에 MCP 활용
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 14. 접근성 및 사용자 경험 최종 검증
  - WCAG 접근성 표준 준수 검증
  - 키보드 네비게이션 및 스크린 리더 지원
  - 다양한 디바이스/브라우저 테스트
  - 사용자 플로우 최적화
  - _Requirements: 4.3, 6.2, 6.3_

- [ ] 15. 최종 통합 테스트 및 문서화
  - 전체 애플리케이션 통합 테스트
  - 성능 메트릭 측정 및 최적화
  - 개발 가이드라인 작성
  - 컴포넌트 문서화
  - 프로덕션 빌드 최적화
  - _Requirements: 5.2, 7.2_

## 🚨 Critical Missing Functionality

**현재 상태**: 애플리케이션이 하드코딩된 샘플 데이터만 사용하고 실제 Python 코드를 실행하지 않음

**즉시 해결해야 할 핵심 누락 기능:**

### 🔥 Priority 1: Core Functionality (Weeks 1-2)
1. **Task 8**: Python 코드 파싱 로직 구현
   - 현재: `app/page.tsx`의 `handleRunCode`에서 하드코딩된 `sampleGraph` 사용
   - 필요: 실제 LangGraph 코드 구조 분석 및 노드/엣지 추출
   
2. **Task 9**: Python 실행 환경 구축
   - 옵션 A: FastAPI 백엔드 + Docker 샌드박스
   - 옵션 B: Pyodide 클라이언트 사이드 실행
   - 옵션 C: WebAssembly Python 런타임

3. **Task 10**: 실시간 코드 분석 및 그래프 업데이트
   - 현재: 항상 동일한 그래프 표시
   - 필요: 코드 변경에 따른 동적 그래프 생성

### 🛠️ Priority 2: Development Foundation (Week 3)
1. **Task 1-3**: 개발 환경 및 코드 품질 도구
   - TypeScript strict 모드
   - ESLint, Prettier, Jest 설정
   - Git hooks 및 자동화

### 🎨 Priority 3: UI Enhancement (Week 4)
1. **Task 4-7**: UI 컴포넌트 shadcn/ui 통합
   - 기존 컴포넌트 개선
   - 에러 처리 강화
   - 접근성 개선

## 📋 Implementation Sequence

**Week 1-2: Make it Actually Work**
- Implement Python code parsing (Task 8)
- Choose and implement execution environment (Task 9)
- Connect real parsing to visualization (Task 10)

**Week 3: Stabilize Foundation**
- Set up development tools (Tasks 1-3)
- Add comprehensive testing
- Implement error handling

**Week 4: Polish and Enhance**
- UI component improvements (Tasks 4-7)
- Performance optimization
- Documentation updates

이 순서로 진행하면 현재 "데모용 껍데기"에서 **실제 동작하는 LangGraph 플레이그라운드**로 발전시킬 수 있습니다.