// Core graph types
export interface Position {
  x: number
  y: number
}

export interface GraphNode {
  id: string
  label: string
  type?: string
  position?: Position
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  isLoopFeedback?: boolean
  sourceHandle?: string
  targetHandle?: string
}

export interface LangGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  // Optional entry point node id (when set_entry_point was specified in code)
  entryPoint?: string
}

// Derived graph helpers
export type NodePositionMap = Record<string, Position>

export interface GraphConnectivity {
  incoming: Record<string, string[]>
  outgoing: Record<string, string[]>
}

// Editor settings
export interface EditorSettings {
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  tabSize: number
}

// Language and theme
export type Language = 'en' | 'ko'

// User change tracking
export interface UserChangeTracker {
  hasChanges: boolean
  lastSyncedGraph: string
  lastChangeTimestamp?: number
}

// Component props




export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

export interface ExportData {
  graph: LangGraph
  code: string
  timestamp: string
  version: string
  metadata: {
    nodeCount: number
    edgeCount: number
  }
}