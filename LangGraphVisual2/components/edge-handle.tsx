"use client"

import React, { useCallback, useMemo } from 'react'
import { useDragState } from '@/stores/ui-store'
import type { Position } from '@/lib/types'

interface EdgeHandleProps {
  edgeId: string
  endpoint: 'source' | 'target'
  position: Position
  isVisible: boolean
  onDragStart: (edgeId: string, endpoint: 'source' | 'target', position: Position) => void
  onDragMove: (position: Position) => void
  onDragEnd: () => void
}

export function EdgeHandle({
  edgeId,
  endpoint,
  position,
  isVisible,
  onDragStart,
  onDragMove,
  onDragEnd
}: EdgeHandleProps) {
  const dragState = useDragState()
  
  // Check if this handle is currently being dragged
  const isDragging = dragState.isDragging && 
                    dragState.edgeId === edgeId && 
                    dragState.endpoint === endpoint

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const startPosition = {
      x: event.clientX,
      y: event.clientY
    }
    
    onDragStart(edgeId, endpoint, startPosition)
    
    // Add global mouse move and mouse up listeners
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPosition = {
        x: moveEvent.clientX,
        y: moveEvent.clientY
      }
      onDragMove(currentPosition)
    }
    
    const handleMouseUp = () => {
      onDragEnd()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [edgeId, endpoint, onDragStart, onDragMove, onDragEnd])

  // Handle styles with drag state
  const handleStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: position.x - 6,
    top: position.y - 6,
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: isDragging ? '#ef4444' : (endpoint === 'source' ? '#10b981' : '#3b82f6'),
    border: '2px solid white',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: 1000,
    transform: isDragging ? 'scale(1.2)' : 'scale(1)',
    transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
    boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.2)',
    opacity: isVisible ? 1 : 0,
    pointerEvents: (isVisible ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],
  }), [position, isDragging, endpoint, isVisible])

  if (!isVisible) {
    return null
  }

  return (
    <div
      style={handleStyle}
      onMouseDown={handleMouseDown}
      className="edge-handle"
      role="button"
      tabIndex={0}
      aria-label={`Drag to modify ${endpoint} connection`}
      title={`Drag to modify ${endpoint} connection`}
    />
  )
}