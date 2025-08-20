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

// Default code template
const DEFAULT_CODE = `# LangGraph Integration Example: Testing Conditional Edges in a Single Workflow
from langgraph.graph import StateGraph, END

# Define node functions
def init(state):
    # Initialization phase
    return {**state, "status": "processing"}

def process(state):
    # Processing phase: Updates state to return either success/failure/continue
    # Branches based on input value (result)
    result = state.get("result")
    if result == "success":
        return {**state, "status": "success"}
    elif result == "failure":
        return {**state, "status": "failure"}
    else:
        # To see loops, leave result as None or other value
        return {**state, "status": "continue"}

def on_success(state):
    # Success handler
    return state

def on_failure(state):
    # Failure handler
    return state

# Conditional routing function: Returns label based on state
def route_result(state):
    status = state.get("status")
    if status == "success":
        return "success"
    if status == "failure":
        return "failure"
    return "continue"

# Create workflow
workflow = StateGraph()

# Add nodes
workflow.add_node("init", init)
workflow.add_node("process", process)
workflow.add_node("success", on_success)
workflow.add_node("failure", on_failure)

# Set entry point (used instead of START)
workflow.set_entry_point("init")

# Direct edge
workflow.add_edge("init", "process")

# Conditional edges: Branch based on process result (labels: success, failure, continue)
workflow.add_conditional_edges(
    "process",
    route_result,
    {
        "success": "success",
        "failure": "failure",
        "continue": "process"  # Loop back
    }
)

# Terminal edges
workflow.add_edge("success", END)
workflow.add_edge("failure", END)

# Compile graph
graph = workflow.compile()

# Usage examples:
# graph.invoke({"result": "success"})   # success path
# graph.invoke({"result": "failure"})   # failure path
# graph.invoke({})                      # continue path (loop)
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