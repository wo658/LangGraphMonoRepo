"use client"

import React, { useEffect } from 'react'
import { MousePointer, Plus, Trash2, GitBranch } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useSelectedEdgeId, useSelectedNodeId, useEditingMode, useEdgeConnection, useEditingActions } from '@/stores/ui-store'

export interface EdgeEditingToolbarProps {
  onDeleteEdge?: () => void
  onDeleteNode?: () => void
  onAddNode?: () => void
  onAddEdge?: () => void
  className?: string
}

export function EdgeEditingToolbar({ 
  onDeleteEdge,
  onDeleteNode,
  className = ""
}: EdgeEditingToolbarProps) {
  const selectedEdgeId = useSelectedEdgeId()
  const selectedNodeId = useSelectedNodeId()
  const editingMode = useEditingMode()
  const edgeConnection = useEdgeConnection()
  const { setEditingMode, selectEdge, selectNode, resetConnectionState } = useEditingActions()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedEdgeId && onDeleteEdge) {
            event.preventDefault()
            onDeleteEdge()
          } else if (selectedNodeId && onDeleteNode) {
            event.preventDefault()
            onDeleteNode()
          }
          break
        case 'Escape':
          event.preventDefault()
          setEditingMode('select')
          selectEdge(null)
          selectNode(null)
          break
        case '1':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setEditingMode('select')
          }
          break
        case '2':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setEditingMode('add-node')
          }
          break
        case '3':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setEditingMode('add-edge')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedEdgeId, selectedNodeId, onDeleteEdge, onDeleteNode, setEditingMode, selectEdge, selectNode])

  const handleModeChange = (value: string) => {
    if (value && (value === 'select' || value === 'add-node' || value === 'add-edge')) {
      // Reset connection state when changing modes
      if (edgeConnection.isConnecting) {
        resetConnectionState()
      }
      setEditingMode(value as 'select' | 'add-node' | 'add-edge')
    }
  }

  const handleDeleteClick = () => {
    if (selectedEdgeId && onDeleteEdge) {
      onDeleteEdge()
    } else if (selectedNodeId && onDeleteNode) {
      onDeleteNode()
    }
  }

  const handleAddNodeClick = () => {
    setEditingMode('add-node')
    // onAddNode callback removed - mode change triggers built-in functionality
  }

  const handleAddEdgeClick = () => {
    setEditingMode('add-edge')
    // onAddEdge callback removed - mode change triggers built-in functionality
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col gap-2 p-2 bg-background border rounded-lg shadow-sm ${className}`}>
        {/* 4x1 Horizontal Layout for buttons */}
        <div className="flex flex-row gap-1">
          {/* Select Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setEditingMode('select')}
                className={`p-3 rounded flex items-center justify-center transition-colors ${
                  editingMode === 'select' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                aria-label="Select Mode"
              >
                <MousePointer className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select (Ctrl+1)</p>
            </TooltipContent>
          </Tooltip>

          {/* Add Node Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAddNodeClick}
                className={`p-3 rounded flex items-center justify-center transition-colors ${
                  editingMode === 'add-node' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
                aria-label="Add Node Mode"
              >
                <Plus className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Node (Ctrl+2)</p>
            </TooltipContent>
          </Tooltip>

          {/* Add Edge Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAddEdgeClick}
                className={`p-3 rounded flex items-center justify-center transition-colors ${
                  editingMode === 'add-edge' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
                aria-label="Add Edge Mode"
              >
                <GitBranch className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Edge (Ctrl+3)</p>
            </TooltipContent>
          </Tooltip>

          {/* Delete Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDeleteClick}
                disabled={!selectedEdgeId && !selectedNodeId}
                className={`p-3 rounded flex items-center justify-center transition-colors ${
                  !selectedEdgeId && !selectedNodeId
                    ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}
                aria-label="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete (Del)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Status Indicators - Always visible for consistent size */}
        <div className="flex flex-col gap-1 min-h-[28px]">
          {editingMode === 'select' && (
            <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-center">
              {selectedEdgeId ? 'Edge Selected' : selectedNodeId ? 'Node Selected' : 'Click item'}
            </span>
          )}
          
          {editingMode === 'add-edge' && (
            <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded animate-pulse text-center">
              {edgeConnection.isConnecting 
                ? `From: ${(edgeConnection.sourceNodeLabel || edgeConnection.sourceNodeId || '').slice(0, 10)}` 
                : 'Click source'}
            </span>
          )}
          
          {editingMode === 'add-node' && (
            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded text-center">
              Click to add
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}