import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { EditorSettings, UserChangeTracker } from '@/lib/types'
import { DEFAULT_EDITOR_SETTINGS } from '@/lib/constants'

interface EditorStore {
  // Editor state
  code: string
  language: 'python' | 'typescript'
  editorSettings: EditorSettings
  isRunning: boolean
  isGeneratingCode: boolean
  
  // Change tracking
  changeTracker: UserChangeTracker
  
  // Actions
  updateCode: (code: string) => void
  setLanguage: (language: 'python' | 'typescript') => void
  setIsRunning: (running: boolean) => void
  setIsGeneratingCode: (generating: boolean) => void
  updateEditorSettings: (settings: Partial<EditorSettings>) => void
  
  // Change tracking actions
  markChanges: () => void
  resetChangeTracker: () => void
}

// DEFAULT_EDITOR_SETTINGS는 '@/lib/constants'에서 단일 소스로 제공합니다.

// Default code template (통합 예제: 단일 코드에서 조건부 엣지 테스트)
const DEFAULT_CODE = `# LangGraph 통합 예제: 단일 워크플로우에서 조건부 엣지 테스트
from langgraph.graph import StateGraph, END

# 노드 함수 정의
def init(state):
    # 초기화 단계
    return {**state, "status": "processing"}

def process(state):
    # 처리 단계: 성공/실패/계속 중 하나를 반환하도록 상태를 업데이트
    # 입력값(result)에 따라 분기합니다.
    result = state.get("result")
    if result == "success":
        return {**state, "status": "success"}
    elif result == "failure":
        return {**state, "status": "failure"}
    else:
        # 반복을 보고 싶다면 result를 None 또는 다른 값으로 두세요.
        return {**state, "status": "continue"}

def on_success(state):
    # 성공 처리
    return state

def on_failure(state):
    # 실패 처리
    return state

# 조건 라우팅 함수: 상태에 따라 라벨을 반환
def route_result(state):
    status = state.get("status")
    if status == "success":
        return "success"
    if status == "failure":
        return "failure"
    return "continue"

# 워크플로우 생성
workflow = StateGraph()

# 노드 추가
workflow.add_node("init", init)
workflow.add_node("process", process)
workflow.add_node("success", on_success)
workflow.add_node("failure", on_failure)

# 엔트리 포인트 설정 (START 대신 사용)
workflow.set_entry_point("init")

# 직선 엣지
workflow.add_edge("init", "process")

# 조건부 엣지: process 결과에 따라 분기 (라벨: success, failure, continue)
workflow.add_conditional_edges(
    "process",
    route_result,
    {
        "success": "success",
        "failure": "failure",
        "continue": "process"  # 루프백
    }
)

# 종료 엣지
workflow.add_edge("success", END)
workflow.add_edge("failure", END)

# 그래프 컴파일
graph = workflow.compile()

# 사용 예시:
# graph.invoke({"result": "success"})   # success 경로
# graph.invoke({"result": "failure"})   # failure 경로
# graph.invoke({})                        # continue 경로(루프)
`

const initialState = {
  code: DEFAULT_CODE,
  language: 'python' as const,
  editorSettings: DEFAULT_EDITOR_SETTINGS,
  isRunning: false,
  isGeneratingCode: false,
  changeTracker: {
    hasChanges: false,
    lastSyncedGraph: '',
    lastChangeTimestamp: Date.now()
  },
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      updateCode: (code: string) => {
        set({ 
          code,
          changeTracker: {
            ...get().changeTracker,
            hasChanges: true,
            lastChangeTimestamp: Date.now()
          }
        })
      },

      setLanguage: (language: 'python' | 'typescript') => {
        set({ language })
      },

      setIsRunning: (running: boolean) => {
        set({ isRunning: running })
      },

      setIsGeneratingCode: (generating: boolean) => {
        set({ isGeneratingCode: generating })
      },

      updateEditorSettings: (settings: Partial<EditorSettings>) => {
        set(state => ({
          editorSettings: { ...state.editorSettings, ...settings }
        }))
      },

      markChanges: () => {
        set(state => ({
          changeTracker: {
            ...state.changeTracker,
            hasChanges: true,
            lastChangeTimestamp: Date.now()
          }
        }))
      },

      resetChangeTracker: () => {
        set(state => ({
          changeTracker: {
            ...state.changeTracker,
            hasChanges: false,
            lastChangeTimestamp: Date.now()
          }
        }))
      },
    })),
    {
      name: 'editor-store',
    }
  )
)

// Typed selectors for optimal performance
export const useCode = () => useEditorStore(state => state.code)
export const useLanguage = () => useEditorStore(state => state.language)
export const useEditorSettings = () => useEditorStore(state => state.editorSettings)
export const useIsRunning = () => useEditorStore(state => state.isRunning)
export const useIsGeneratingCode = () => useEditorStore(state => state.isGeneratingCode)
export const useChangeTracker = () => useEditorStore(state => state.changeTracker)

// Action selectors with shallow comparison to prevent infinite loops
export const useEditorActions = () => useEditorStore(
  useShallow((state) => ({
    updateCode: state.updateCode,
    setLanguage: state.setLanguage,
    setIsRunning: state.setIsRunning,
    setIsGeneratingCode: state.setIsGeneratingCode,
    updateEditorSettings: state.updateEditorSettings,
  }))
)

export const useChangeActions = () => useEditorStore(
  useShallow((state) => ({
    markChanges: state.markChanges,
    resetChangeTracker: state.resetChangeTracker,
  }))
)