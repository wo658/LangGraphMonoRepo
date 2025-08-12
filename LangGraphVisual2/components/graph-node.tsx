"use client"

import React, { useMemo } from "react"
import { useTheme } from "next-themes"
import { Handle, Position } from "reactflow"
import { GRAPH_STYLES } from "@/lib/constants"
import { useEditingMode, useEdgeConnection } from "@/stores/ui-store"

interface CustomNodeData {
  label: string
  nodeType?: 'start' | 'end' | 'process' | 'decision' | 'custom'
}

interface GraphNodeProps {
  id: string
  data: CustomNodeData
  selected: boolean
}

// Handle configuration (kept for edge anchoring) - will be invisible and non-interactive
const HANDLE_CONFIG = {
  BASE_CLASSES: "w-3 h-3 border-2 border-white",
  TARGET_CLASSES: "!bg-transparent",
  SOURCE_CLASSES: "!bg-transparent",
  POSITIONS: {
    TOP: { top: -6, left: '50%', transform: 'translateX(-50%)' },
    RIGHT: { right: -6, top: '50%', transform: 'translateY(-50%)' },
    BOTTOM: { bottom: -6, left: '50%', transform: 'translateX(-50%)' },
    LEFT: { left: -6, top: '50%', transform: 'translateY(-50%)' },
  }
} as const

// Pre-defined handle configurations (ids must stay stable for existing edges)
const HANDLE_DEFINITIONS = [
  { id: "top-source", type: "source" as const, position: Position.Top, style: HANDLE_CONFIG.POSITIONS.TOP, ariaLabel: "Top source connection point" },
  { id: "top", type: "target" as const, position: Position.Top, style: HANDLE_CONFIG.POSITIONS.TOP, ariaLabel: "Top target connection point" },
  { id: "right-source", type: "source" as const, position: Position.Right, style: HANDLE_CONFIG.POSITIONS.RIGHT, ariaLabel: "Right source connection point" },
  { id: "right", type: "target" as const, position: Position.Right, style: HANDLE_CONFIG.POSITIONS.RIGHT, ariaLabel: "Right target connection point" },
  { id: "bottom-source", type: "source" as const, position: Position.Bottom, style: HANDLE_CONFIG.POSITIONS.BOTTOM, ariaLabel: "Bottom source connection point" },
  { id: "bottom", type: "target" as const, position: Position.Bottom, style: HANDLE_CONFIG.POSITIONS.BOTTOM, ariaLabel: "Bottom target connection point" },
  { id: "left-source", type: "source" as const, position: Position.Left, style: HANDLE_CONFIG.POSITIONS.LEFT, ariaLabel: "Left source connection point" },
  { id: "left", type: "target" as const, position: Position.Left, style: HANDLE_CONFIG.POSITIONS.LEFT, ariaLabel: "Left target connection point" },
] as const

interface NodeHandleProps {
  id: string
  type: "source" | "target"
  position: Position
  style: React.CSSProperties
  ariaLabel: string
}

function NodeHandle({ id, type, position, style, ariaLabel }: NodeHandleProps) {
  const className = `${HANDLE_CONFIG.BASE_CLASSES} ${
    type === "target" ? HANDLE_CONFIG.TARGET_CLASSES : HANDLE_CONFIG.SOURCE_CLASSES
  }`

  return (
    <Handle
      id={id}
      type={type}
      position={position}
      className={className}
      // invisible and non-interactive, but present in DOM so edges can anchor
      style={{ ...style, opacity: 0, pointerEvents: 'none' }}
      aria-label={ariaLabel}
    />
  )
}

export function GraphNode({ id, data, selected }: GraphNodeProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const editingMode = useEditingMode()
  const edgeConnection = useEdgeConnection()

  const nodeStyle = useMemo(() => {
    const themeColors = isDark ? GRAPH_STYLES.COLORS.DARK_THEME : GRAPH_STYLES.COLORS.LIGHT_THEME
    
    // Check if this node is the source node in add-edge mode
    const isSourceNode = editingMode === 'add-edge' && 
      edgeConnection.isConnecting && 
      edgeConnection.sourceNodeId === id
    
    let borderColor = themeColors.NODE_STROKE
    
    return {
      backgroundColor: themeColors.BACKGROUND,
      color: isDark ? "#ffffff" : "#111827",
      borderColor,
    }
  }, [isDark, selected, editingMode, edgeConnection, id])

  // Add visual feedback for connection mode
  const isSourceNode = editingMode === 'add-edge' && 
    edgeConnection.isConnecting && 
    edgeConnection.sourceNodeId === id
  
  const isHoverable = editingMode === 'add-edge' && 
    edgeConnection.isConnecting && 
    edgeConnection.sourceNodeId !== id

  // Debug log (removed for production)
  
  const nodeClassName = `px-4 py-2 shadow-md rounded-lg border-2 min-w-[120px] text-center relative transition-all duration-200 ${
    selected ? 'ring-2 ring-blue-500 scale-105' : 
    isSourceNode ? 'ring-2 ring-green-500 animate-pulse' :
    isHoverable ? 'hover:ring-2 hover:ring-purple-400 hover:scale-105' :
    'hover:shadow-lg'
  } ${
    editingMode === 'add-edge' ? 'cursor-pointer' : ''
  }`

  return (
    <div
      className={nodeClassName}
      style={nodeStyle}
      role="button"
      tabIndex={0}
      aria-label={`Graph node: ${data.label}${selected ? ' (selected)' : ''}`}
      aria-pressed={selected}
      aria-describedby={`node-${data.label.replace(/\s+/g, '-').toLowerCase()}-description`}
    >
      {/* Invisible, non-interactive handles for edge anchoring */}
      {HANDLE_DEFINITIONS.map((handleDef) => (
        <NodeHandle
          key={handleDef.id}
          id={handleDef.id}
          type={handleDef.type}
          position={handleDef.position}
          style={handleDef.style}
          ariaLabel={handleDef.ariaLabel}
        />
      ))}

      <div 
        className="text-sm font-medium" 
        title={data.label}
        id={`node-${data.label.replace(/\s+/g, '-').toLowerCase()}-description`}
      >
        {data.label}
      </div>
      {data.nodeType && (
        <div className="sr-only">
          Node type: {data.nodeType}
        </div>
      )}

      {/* Center connector for click-to-connect in Add Edge mode */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        data-center-connector="true"
        aria-hidden={editingMode !== 'add-edge'}
      >
        <span
          data-center-connector="true"
          className={`transition-all rounded-full border ${editingMode === 'add-edge' ? 'pointer-events-auto w-4 h-4 bg-blue-500/70 border-white shadow-lg hover:scale-110 focus:outline-none focus:ring-2 ring-offset-2 ring-blue-400' : 'w-0 h-0 opacity-0'}`}
          title={editingMode === 'add-edge' ? 'Click to connect' : undefined}
          role="button"
          tabIndex={editingMode === 'add-edge' ? 0 : -1}
          aria-label={`Center connector for ${data.label}`}
        />
      </div>
    </div>
  )
}

export const MemoizedGraphNode = React.memo(GraphNode)