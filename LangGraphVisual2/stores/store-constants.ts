import type { EditorSettings } from '@/lib/types'

// Store-specific default values
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    tabSize: 2,
} as const

// Edge editing state defaults
export const DEFAULT_DRAG_STATE = {
    isDragging: false,
    edgeId: null,
    endpoint: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
} as const

// Graph statistics defaults
export const DEFAULT_GRAPH_STATS = {
    nodeCount: 0,
    edgeCount: 0,
    complexity: 0,
    complexityLabel: 'Empty',
    connected: false,
    averageConnections: 0,
    isolatedNodes: 0
} as const

// UI dialog defaults
export const DEFAULT_UI_DIALOGS = {
    showNodeDialog: false,
    nodeCreationPosition: null
} as const

// Toast state defaults
export const DEFAULT_TOAST_STATE = {
    toasts: [] as Array<{
        id: string
        title: string
        description?: string
        variant?: 'default' | 'destructive'
        duration?: number
    }>
}