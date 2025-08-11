import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { EditorSettings, UserChangeTracker } from '@/lib/types'

interface EditorStore {
  // Editor state
  code: string
  language: 'python' | 'typescript' | 'javascript'
  editorSettings: EditorSettings
  isRunning: boolean
  isGeneratingCode: boolean
  
  // Change tracking
  changeTracker: UserChangeTracker
  
  // Actions
  updateCode: (code: string) => void
  setLanguage: (language: 'python' | 'typescript' | 'javascript') => void
  setIsRunning: (running: boolean) => void
  setIsGeneratingCode: (generating: boolean) => void
  updateEditorSettings: (settings: Partial<EditorSettings>) => void
  
  // Change tracking actions
  markChanges: () => void
  resetChangeTracker: () => void
}

// Default editor settings
const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  wordWrap: true,
  minimap: true,
  tabSize: 2,
}

// Default code template
const DEFAULT_CODE = `# LangGraph 기본 워크플로우
from langgraph.graph import StateGraph

def agent_function(state):
    # 에이전트 함수 구현
    return {"result": "처리 완료"}

def researcher_function(state):
    # 연구 함수 구현  
    return {"data": "연구 결과"}

def should_continue(state):
    # 조건부 로직
    return "continue" if state.get("continue") else "end"

# 워크플로우 생성
workflow = StateGraph()

# 노드 추가
workflow.add_node("agent", agent_function)
workflow.add_node("researcher", researcher_function)
workflow.add_node("final_check", should_continue)

# 엣지 추가
workflow.add_edge(START, "agent")
workflow.add_edge("agent", "researcher")
workflow.add_conditional_edges(
    "researcher",
    should_continue,
    {
        "continue": "final_check",
        "end": END
    }
)

# Compile the graph
graph = workflow.compile()

# Example usage:
# result = graph.invoke({"topic": "dogs", "joke": ""})
# print(result)
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

      setLanguage: (language: 'python' | 'typescript' | 'javascript') => {
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