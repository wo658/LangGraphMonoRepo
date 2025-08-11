import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Position } from '@/lib/types'

// UI Dialog state
interface UIDialogState {
  showNodeDialog: boolean
  nodeCreationPosition: Position | null
}

// Edge editing state  
interface DragState {
  isDragging: boolean
  edgeId: string | null
  endpoint: 'source' | 'target' | null
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
}

// Edge connection state for Add Edge Mode
interface EdgeConnectionState {
  sourceNodeId: string | null
  sourceNodeLabel: string | null
  isConnecting: boolean
}

interface UIStore {
  // Panel states
  isCodePanelMinimized: boolean
  isControlPanelMinimized: boolean
  
  // Editing states
  selectedEdgeId: string | null
  selectedNodeId: string | null
  editingMode: 'select' | 'add-node' | 'add-edge'
  edgeConnection: EdgeConnectionState
  dragState: DragState
  
  // Dialog states
  uiDialogs: UIDialogState
  
  // Panel actions
  setCodePanelMinimized: (minimized: boolean) => void
  setControlPanelMinimized: (minimized: boolean) => void
  
  // Editing actions
  selectEdge: (edgeId: string | null) => void
  selectNode: (nodeId: string | null) => void
  setEditingMode: (mode: 'select' | 'add-node' | 'add-edge') => void
  setSourceNode: (nodeId: string | null, nodeLabel?: string | null) => void
  setIsConnecting: (isConnecting: boolean) => void
  resetConnectionState: () => void
  startEdgeDrag: (edgeId: string, endpoint: 'source' | 'target', position: { x: number; y: number }) => void
  updateDragPosition: (position: { x: number; y: number }) => void
  endEdgeDrag: () => void
  
  // Dialog actions
  setShowNodeDialog: (show: boolean) => void
  setNodeCreationPosition: (position: Position | null) => void
  
  // Utility actions
  resetEditingState: () => void
}

// Default states
const DEFAULT_DRAG_STATE: DragState = {
  isDragging: false,
  edgeId: null,
  endpoint: null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 }
}

const DEFAULT_UI_DIALOGS: UIDialogState = {
  showNodeDialog: false,
  nodeCreationPosition: null
}

const DEFAULT_EDGE_CONNECTION: EdgeConnectionState = {
  sourceNodeId: null,
  sourceNodeLabel: null,
  isConnecting: false
}

const initialState = {
  isCodePanelMinimized: false,
  isControlPanelMinimized: false,
  selectedEdgeId: null,
  selectedNodeId: null,
  editingMode: 'select' as const,
  edgeConnection: DEFAULT_EDGE_CONNECTION,
  dragState: DEFAULT_DRAG_STATE,
  uiDialogs: DEFAULT_UI_DIALOGS,
}

export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      ...initialState,

      // Panel actions
      setCodePanelMinimized: (minimized: boolean) => {
        set({ isCodePanelMinimized: minimized })
      },

      setControlPanelMinimized: (minimized: boolean) => {
        set({ isControlPanelMinimized: minimized })
      },

      // Editing actions
      selectEdge: (edgeId: string | null) => {
        set({ selectedEdgeId: edgeId, selectedNodeId: null }) // Clear node selection when selecting edge
      },

      selectNode: (nodeId: string | null) => {
        set({ selectedNodeId: nodeId, selectedEdgeId: null }) // Clear edge selection when selecting node
      },

      setEditingMode: (mode: 'select' | 'add-node' | 'add-edge') => {
        set({ 
          editingMode: mode,
          edgeConnection: DEFAULT_EDGE_CONNECTION // Reset connection state when changing modes
        })
      },

      setSourceNode: (nodeId: string | null, nodeLabel: string | null = null) => {
        set(state => ({
          edgeConnection: {
            ...state.edgeConnection,
            sourceNodeId: nodeId,
            sourceNodeLabel: nodeLabel,
            isConnecting: nodeId !== null
          }
        }))
      },

      setIsConnecting: (isConnecting: boolean) => {
        set(state => ({
          edgeConnection: {
            ...state.edgeConnection,
            isConnecting
          }
        }))
      },

      resetConnectionState: () => {
        set({ edgeConnection: DEFAULT_EDGE_CONNECTION })
      },

      startEdgeDrag: (edgeId: string, endpoint: 'source' | 'target', position: { x: number; y: number }) => {
        set({
          dragState: {
            isDragging: true,
            edgeId,
            endpoint,
            startPosition: position,
            currentPosition: position
          }
        })
      },

      updateDragPosition: (position: { x: number; y: number }) => {
        set(state => ({
          dragState: {
            ...state.dragState,
            currentPosition: position
          }
        }))
      },

      endEdgeDrag: () => {
        set({ dragState: DEFAULT_DRAG_STATE })
      },

      // Dialog actions
      setShowNodeDialog: (show: boolean) => {
        set(state => ({
          uiDialogs: {
            ...state.uiDialogs,
            showNodeDialog: show
          }
        }))
      },

      setNodeCreationPosition: (position: Position | null) => {
        set(state => ({
          uiDialogs: {
            ...state.uiDialogs,
            nodeCreationPosition: position
          }
        }))
      },

      // Utility actions
      resetEditingState: () => {
        set({
          selectedEdgeId: null,
          selectedNodeId: null,
          editingMode: 'select',
          edgeConnection: DEFAULT_EDGE_CONNECTION,
          dragState: DEFAULT_DRAG_STATE,
          uiDialogs: DEFAULT_UI_DIALOGS
        })
      },
    })),
    {
      name: 'ui-store',
    }
  )
)

// Typed selectors for optimal performance
export const useSelectedEdgeId = () => useUIStore(state => state.selectedEdgeId)
export const useSelectedNodeId = () => useUIStore(state => state.selectedNodeId)
export const useEditingMode = () => useUIStore(state => state.editingMode)
export const useEdgeConnection = () => useUIStore(state => state.edgeConnection)
export const useDragState = () => useUIStore(state => state.dragState)
export const useUIDialogs = () => useUIStore(state => state.uiDialogs)
export const useIsCodePanelMinimized = () => useUIStore(state => state.isCodePanelMinimized)
export const useIsControlPanelMinimized = () => useUIStore(state => state.isControlPanelMinimized)

// Action selectors with shallow comparison to prevent infinite loops
export const usePanelActions = () => useUIStore(
  useShallow((state) => ({
    setCodePanelMinimized: state.setCodePanelMinimized,
    setControlPanelMinimized: state.setControlPanelMinimized,
  }))
)

export const useEditingActions = () => useUIStore(
  useShallow((state) => ({
    selectEdge: state.selectEdge,
    selectNode: state.selectNode,
    setEditingMode: state.setEditingMode,
    setSourceNode: state.setSourceNode,
    setIsConnecting: state.setIsConnecting,
    resetConnectionState: state.resetConnectionState,
    startEdgeDrag: state.startEdgeDrag,
    updateDragPosition: state.updateDragPosition,
    endEdgeDrag: state.endEdgeDrag,
  }))
)

export const useUIDialogActions = () => useUIStore(
  useShallow((state) => ({
    setShowNodeDialog: state.setShowNodeDialog,
    setNodeCreationPosition: state.setNodeCreationPosition,
  }))
)

export const useUIUtilityActions = () => useUIStore(
  useShallow((state) => ({
    resetEditingState: state.resetEditingState,
  }))
)