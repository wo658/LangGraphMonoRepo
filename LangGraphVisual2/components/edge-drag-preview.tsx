"use client"

import React, { useMemo } from 'react'
import { useDragState } from '@/stores/ui-store'
import { GRAPH_STYLES } from '@/lib/constants'

interface EdgeDragPreviewProps {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

export function EdgeDragPreview({ sourceX, sourceY, targetX, targetY }: EdgeDragPreviewProps) {
  const dragState = useDragState()
  
  // Calculate preview path based on drag state
  const previewPath = useMemo(() => {
    if (!dragState.isDragging) return '';
    let previewSourceX = sourceX
    let previewSourceY = sourceY
    let previewTargetX = targetX
    let previewTargetY = targetY

    // Update the appropriate endpoint based on which one is being dragged
    if (dragState.endpoint === 'source') {
      previewSourceX = dragState.currentPosition.x
      previewSourceY = dragState.currentPosition.y
    } else if (dragState.endpoint === 'target') {
      previewTargetX = dragState.currentPosition.x
      previewTargetY = dragState.currentPosition.y
    }

    // Create a simple straight line for preview (could be enhanced to bezier curve)
    return `M ${previewSourceX} ${previewSourceY} L ${previewTargetX} ${previewTargetY}`
  }, [sourceX, sourceY, targetX, targetY, dragState])

  const previewStyle = useMemo(() => ({
    stroke: GRAPH_STYLES.COLORS.LOOP_FEEDBACK_EDGE,
    strokeWidth: 2,
    strokeDasharray: '5,5',
    fill: 'none',
    pointerEvents: 'none' as const,
    opacity: 0.7,
  }), [])

  // Only show preview when dragging
  if (!dragState.isDragging) {
    return null
  }

  return (
    <path
      d={previewPath}
      style={previewStyle}
      className="edge-drag-preview"
      aria-hidden="true"
    />
  )
}