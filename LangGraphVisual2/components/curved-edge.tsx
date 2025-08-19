"use client"

import React, { useCallback, useMemo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'
import { useSelectedEdgeId, useDragState, useEditingActions } from '@/stores/ui-store'
import { EdgeHandle } from './edge-handle'
import { EdgeDragPreview } from './edge-drag-preview'
import { GRAPH_STYLES } from '@/lib/constants'

interface CurvedEdgeData {
  curvature?: number
  originalEdge?: any
  selfLoop?: boolean
}

export function CurvedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  label,
  selected,
}: EdgeProps<CurvedEdgeData>) {
  const selectedEdgeId = useSelectedEdgeId()
  const dragState = useDragState()
  const { selectEdge, startEdgeDrag, updateDragPosition, endEdgeDrag } = useEditingActions()
  const curvature = data?.curvature || 0
  const isSelfLoop = data?.selfLoop === true || (sourceX === targetX && sourceY === targetY)
  
  // Check if this edge is selected
  const isSelected = selectedEdgeId === id || selected
  
  // 곡률에 따라 베지어 곡선의 제어점을 조정
  // 곡률이 높을수록 더 큰 곡선을 만들어 충돌을 회피
  const adjustedCurvature = curvature === 0 ? 0.1 : curvature * 0.8 + 0.2

  let edgePath: string
  let labelX: number
  let labelY: number

  if (isSelfLoop) {
    // Self-loop: exit from right handle (source) and enter via top handle (target)
    // Use a single cubic curve that arcs around the top-right quadrant
    const sx = sourceX
    const sy = sourceY
    const tx = targetX
    const ty = targetY
    const dx = 48 // outward x offset
    const dy = 64 // upward y offset
    const c1x = sx + dx
    const c1y = sy - dy
    const c2x = tx + dx
    const c2y = ty - dy * 0.4
    edgePath = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`
    // Place label roughly near the apex of the arc
    labelX = (sx + tx) / 2 + dx * 0.3
    labelY = Math.min(sy, ty) - dy * 0.6
  } else {
    const result = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: adjustedCurvature,
    })
    edgePath = result[0]
    labelX = result[1]
    labelY = result[2]
  }

  // Handle edge click for selection
  const handleEdgeClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    selectEdge(isSelected ? null : id)
  }, [id, isSelected, selectEdge])

  // Handle keyboard interaction
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectEdge(isSelected ? null : id)
    }
  }, [id, isSelected, selectEdge])

  // Handle drag operations
  const handleDragStart = useCallback((edgeId: string, endpoint: 'source' | 'target', position: { x: number; y: number }) => {
    startEdgeDrag(edgeId, endpoint, position)
  }, [startEdgeDrag])

  const handleDragMove = useCallback((position: { x: number; y: number }) => {
    updateDragPosition(position)
  }, [updateDragPosition])

  const handleDragEnd = useCallback(() => {
    endEdgeDrag()
  }, [endEdgeDrag])

  // Calculate handle positions
  const sourceHandlePosition = useMemo(() => ({
    x: sourceX,
    y: sourceY
  }), [sourceX, sourceY])

  const targetHandlePosition = useMemo(() => ({
    x: targetX,
    y: targetY
  }), [targetX, targetY])

  // Memoized edge styles with selection feedback
  const edgeStyle = useMemo(() => {
    const baseStyle = {
      ...style,
      cursor: 'pointer',
      transition: GRAPH_STYLES.TRANSITIONS.DEFAULT,
      strokeWidth: isSelected ? 3 : 2,
    }

    if (isSelected) {
      return {
        ...baseStyle,
        stroke: GRAPH_STYLES.COLORS.SELECTED_EDGE,
        filter: GRAPH_STYLES.SHADOWS.SELECTED_EDGE,
      }
    }

    return baseStyle
  }, [style, isSelected])

  // Update markerEnd based on selection - override only if selected
  const currentMarkerEnd = useMemo(() => {
    if (isSelected) return 'url(#arrow-marker-selected)'
    // Respect provided markerEnd (e.g., self-loop or loop feedback)
    return markerEnd || 'url(#arrow-marker)'
  }, [isSelected, markerEnd])

  return (
    <>
      {/* Main edge path */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={currentMarkerEnd} 
        style={edgeStyle}
      />
      
      {/* Drag preview for this edge when being dragged */}
      {dragState.isDragging && dragState.edgeId === id && (
        <EdgeDragPreview
          sourceX={sourceX}
          sourceY={sourceY}
          targetX={targetX}
          targetY={targetY}
        />
      )}
      
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: 'pointer' }}
        onClick={handleEdgeClick}
        onKeyDown={handleKeyDown}
        className={`edge-click-area ${isSelected ? 'selected' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Graph edge from ${data?.originalEdge?.source || 'unknown'} to ${data?.originalEdge?.target || 'unknown'}${isSelected ? ' (selected)' : ''}`}
        aria-pressed={isSelected}
      />
      
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
              padding: '2px 6px',
              backgroundColor: isSelected ? GRAPH_STYLES.COLORS.SELECTED_EDGE : 'rgba(255, 255, 255, 0.9)',
              color: isSelected ? 'white' : '#374151',
              borderRadius: '4px',
              border: isSelected ? `1px solid ${GRAPH_STYLES.COLORS.SELECTED_EDGE}` : '1px solid #d1d5db',
              transition: GRAPH_STYLES.TRANSITIONS.DEFAULT,
              cursor: 'pointer',
            }}
            className="nodrag nopan edge-label"
            onClick={handleEdgeClick}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Draggable handles for selected edges */}
      <EdgeHandle
        edgeId={id}
        endpoint="source"
        position={sourceHandlePosition}
        isVisible={isSelected || false}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <EdgeHandle
        edgeId={id}
        endpoint="target"
        position={targetHandlePosition}
        isVisible={isSelected || false}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <style jsx>{`
        .edge-click-area:hover + path,
        .edge-click-area:focus + path {
          stroke-width: ${isSelected ? 4 : 3};
          filter: ${isSelected 
            ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.7))' 
            : GRAPH_STYLES.SHADOWS.HOVER_EDGE};
        }
        
        .edge-click-area:focus {
          outline: none;
        }
      `}</style>
    </>
  )
}