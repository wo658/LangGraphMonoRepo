"use client"

import React, { useMemo, useCallback, useEffect, useRef } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Connection,
  type BackgroundVariant,
} from 'reactflow'
import { GRAPH_STYLES } from '@/lib/constants'
import "reactflow/dist/style.css"

import { CurvedEdge } from "./curved-edge"
import { NodeCreationDialog } from "./node-creation-dialog"
import { MemoizedGraphNode } from "./graph-node"
import { EdgeMarkers } from "./edge-markers"
import { useTheme } from "next-themes"
import { useGraph, useGraphActions } from '@/stores/graph-store'
import { 
  useSelectedEdgeId,
  useSelectedNodeId,
  useEditingMode,
  useEdgeConnection,
  useDragState,
  useUIDialogs,
  useEditingActions,
  useUIDialogActions
} from '@/stores/ui-store'
import { useChangeActions } from '@/stores/editor-store'
import { useI18n } from '@/stores/i18n-store'
import { useReactFlowData } from '@/hooks/use-reactflow-data'
import { isValidConnection } from '@/lib/edge-connection-utils'
import { getOptimalConnectionPoints } from '@/lib/edge-utils'

// Node and Edge types configuration - static to prevent re-creation
const nodeTypes = {
  custom: MemoizedGraphNode,
}

const edgeTypes = {
  curved: CurvedEdge,
}

// Static configuration objects to prevent re-creation on every render
const STATIC_FIT_VIEW_OPTIONS = {
  padding: 0.2,
  includeHiddenNodes: false,
  minZoom: 0.1,
  maxZoom: 1.5
} as const

const STATIC_DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 } as const
const STATIC_SNAP_GRID: [number, number] = [15, 15]

// Static ReactFlow configuration to prevent re-creation on every render
const STATIC_REACTFLOW_CONFIG = {
  snapToGrid: true,
  snapGrid: STATIC_SNAP_GRID,
  attributionPosition: 'bottom-left' as const,
  proOptions: { hideAttribution: true },
  deleteKeyCode: 'Delete',
  multiSelectionKeyCode: 'Meta',
} as const

function GraphFlow() {
  const { theme, resolvedTheme } = useTheme()
  const { t } = useI18n()
  const isDark = resolvedTheme === "dark"

  // Use separated stores
  const graph = useGraph()
  const { addNode, addEdge, removeNode } = useGraphActions()
  
  const selectedEdgeId = useSelectedEdgeId()
  const selectedNodeId = useSelectedNodeId()
  const editingMode = useEditingMode()
  const edgeConnection = useEdgeConnection()
  const dragState = useDragState()
  const { selectEdge, selectNode, setSourceNode, resetConnectionState } = useEditingActions()
  const { removeEdge } = useGraphActions()
  
  const { markChanges } = useChangeActions()
  
  const uiDialogs = useUIDialogs()
  const { setShowNodeDialog, setNodeCreationPosition } = useUIDialogActions()
  
  // Get ReactFlow data transformation
  const { nodes: initialNodes, edges: initialEdges } = useReactFlowData(graph, isDark)
  
  // Get computed graph statistics

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const hasInitialized = useRef(false)
  
  // Update nodes and edges when graph changes (preserve positions)
  useEffect(() => {
    // Only update if the structure has changed (nodes added/removed)
    setNodes(currentNodes => {
      if (currentNodes.length !== initialNodes.length) {
        return initialNodes
      }
      // Preserve existing positions and only update data
      return currentNodes.map(currentNode => {
        const updatedNode = initialNodes.find(n => n.id === currentNode.id)
        return updatedNode ? { ...updatedNode, position: currentNode.position } : currentNode
      })
    })
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Handle pane click for node creation and selection clearing
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    // Clear all selections when clicking on empty space
    selectEdge(null)
    selectNode(null)
    
    if (editingMode === 'add-node') {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      const flowPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      
      setNodeCreationPosition(flowPosition)
      setShowNodeDialog(true)
    } else if (editingMode === 'add-edge' && edgeConnection.isConnecting) {
      // Cancel connection if clicking on empty space
      resetConnectionState()
    }
  }, [editingMode, edgeConnection.isConnecting, setNodeCreationPosition, setShowNodeDialog, resetConnectionState, selectEdge, selectNode])

  // Handle node click for different modes
  const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    event.stopPropagation() // Prevent pane click
    
    // In add-edge mode, only react if center connector was clicked
    const targetEl = event.target as HTMLElement
    const clickedCenter = targetEl.closest('[data-center-connector="true"]')
    
    const nodeId = node.id
    const nodeLabel = node.data?.label || nodeId
    
    if (editingMode === 'select') {
      // Select mode - select the clicked node
      selectNode(nodeId)
    } else if (editingMode === 'add-edge') {
      // Ignore clicks that are not on the center connector
      if (!clickedCenter) {
        return
      }
      // Add edge mode - handle connection logic
      if (!edgeConnection.isConnecting) {
        // First click - select source node
        setSourceNode(nodeId, nodeLabel)
      } else if (edgeConnection.sourceNodeId && edgeConnection.sourceNodeId !== nodeId) {
        // Second click - create edge if valid
        const sourceNode = nodes.find(n => n.id === edgeConnection.sourceNodeId)
        const targetNode = nodes.find(n => n.id === nodeId)
        
        if (sourceNode && targetNode) {
          // Check if connection is valid using graph edges (not ReactFlow edges)
          const graphEdges = graph?.edges || []
          if (isValidConnection(edgeConnection.sourceNodeId, nodeId, graphEdges)) {
            // Calculate optimal connection points
            const { sourceHandle, targetHandle } = getOptimalConnectionPoints(sourceNode, targetNode)
            
            // Create new edge for Graph Store
            const newGraphEdge = {
              id: `${edgeConnection.sourceNodeId}-${nodeId}-${Date.now()}`,
              source: edgeConnection.sourceNodeId,
              target: nodeId,
              sourceHandle,
              targetHandle,
              label: ''
            }
            
            // Add to Graph Store
            addEdge(newGraphEdge)
            markChanges()
            
            // console.log('Added edge:', newGraphEdge)
          } else {
            console.log('Invalid connection: already exists or same node')
          }
        }
        
        // Reset connection state
        resetConnectionState()
      } else if (edgeConnection.sourceNodeId === nodeId) {
        // Clicking the same node again - cancel
        resetConnectionState()
      }
    }
  }, [editingMode, edgeConnection, nodes, edges, selectNode, setSourceNode, resetConnectionState, addEdge, markChanges])

  // Handle keyboard events for deletion
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Cancel in-progress edge connection
      if (editingMode === 'add-edge' && edgeConnection.isConnecting) {
        event.preventDefault()
        resetConnectionState()
        return
      }
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      if (selectedEdgeId) {
        // Delete selected edge
        removeEdge(selectedEdgeId)
        selectEdge(null) // Clear selection
        markChanges()
      } else if (selectedNodeId) {
        // Delete selected node
        removeNode(selectedNodeId)
        selectNode(null) // Clear selection
        markChanges()
      }
    }
  }, [selectedEdgeId, selectedNodeId, removeEdge, removeNode, selectEdge, selectNode, markChanges, editingMode, edgeConnection.isConnecting, resetConnectionState])

  // Handle node creation
  const handleCreateNode = useCallback((nodeName: string) => {
    if (!uiDialogs.nodeCreationPosition) return

    const nodeId = `node-${Date.now()}`
    
    const newGraphNode = {
      id: nodeId,
      label: nodeName,
      type: 'custom',
      position: {
        x: uiDialogs.nodeCreationPosition.x - 60,
        y: uiDialogs.nodeCreationPosition.y - 25
      }
    }

    // Add to Zustand store (automatically syncs to ReactFlow)
    addNode(newGraphNode, newGraphNode.position)
    markChanges()

    setNodeCreationPosition(null)
    setShowNodeDialog(false)
  }, [uiDialogs.nodeCreationPosition, markChanges, setNodeCreationPosition, setShowNodeDialog])

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return
      const newEdge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        label: ''
      }
      addEdge(newEdge)
      markChanges()
    },
    [addEdge, markChanges]
  )


  // Type-safe change handlers with performance optimization
  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes)

    if (changes.length > 0) {
      const hasUserInteraction = changes.some(change =>
        change.type === 'position' || change.type === 'remove'
      )

      if (hasUserInteraction) {
        markChanges()
      }
    }
  }, [onNodesChange, markChanges])

  const handleEdgesChange = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
    onEdgesChange(changes)

    if (changes.length > 0) {
      const hasUserInteraction = changes.some(change =>
        change.type === 'remove' || change.type === 'add'
      )

      if (hasUserInteraction) {
        markChanges()
      }
    }
  }, [onEdgesChange, markChanges])

  // Memoize ReactFlow styles to prevent recreation
  const dynamicReactFlowStyle = useMemo(() => ({
    backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
  }), [isDark])

  // Memoize MiniMap styles
  const dynamicMiniMapStyle = useMemo(() => ({
    backgroundColor: isDark ? "#1f2937" : "#f9fafb",
    border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
  }), [isDark])

  // No need to update nodes/edges - they come from store

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        {t("graph.noData")}
      </div>
    )
  }

  // Component loads synchronously, no loading state needed

  return (
    <div className="h-full w-full relative">
      {/* Edge Editing Toolbar removed - now in control panel */}

      <div 
        className="h-full w-full"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ outline: 'none' }}
      >
        <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        fitView={!hasInitialized.current}
        fitViewOptions={STATIC_FIT_VIEW_OPTIONS}
        onInit={() => { hasInitialized.current = true }}
        className={isDark ? "dark" : ""}
        // Performance optimizations
        defaultViewport={STATIC_DEFAULT_VIEWPORT}
        {...STATIC_REACTFLOW_CONFIG}
        // Override static config
        nodesDraggable={true}
        nodesConnectable={false}
        minZoom={0.2}
        maxZoom={4}
        elementsSelectable={true}
        // Dark mode styling
        style={dynamicReactFlowStyle}
      >
        <EdgeMarkers />
        <Background
          variant={"dots" as BackgroundVariant}
          gap={12}
          size={1}
          color={isDark ? GRAPH_STYLES.COLORS.DARK_THEME.MINIMAP_BORDER : GRAPH_STYLES.COLORS.LIGHT_THEME.MINIMAP_BORDER}
        />
        <Controls />
        <MiniMap
          maskColor={isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)"}
          nodeColor={isDark ? GRAPH_STYLES.COLORS.DARK_THEME.MINIMAP_BG : GRAPH_STYLES.COLORS.LIGHT_THEME.MINIMAP_BG}
          nodeStrokeColor={isDark ? GRAPH_STYLES.COLORS.DARK_THEME.EDGE_STROKE : GRAPH_STYLES.COLORS.LIGHT_THEME.EDGE_STROKE}
          nodeBorderRadius={4}
          zoomable
          pannable
          style={dynamicMiniMapStyle}
        />
      </ReactFlow>
      </div>

      {/* Node Creation Dialog */}
      <NodeCreationDialog
        open={uiDialogs.showNodeDialog}
        onOpenChange={setShowNodeDialog}
        onCreateNode={handleCreateNode}
      />

    </div>
  )
}

export function LangGraphVisualizer() {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <GraphFlow />
      </ReactFlowProvider>
    </div>
  )
}
