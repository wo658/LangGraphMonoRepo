import type { Node } from 'reactflow'

/**
 * Calculate the optimal connection direction between two nodes
 * based on their relative positions
 */
export function calculateOptimalDirection(
  sourceNode: Node,
  targetNode: Node
): { sourceHandle: string; targetHandle: string } {
  const sourceX = sourceNode.position.x
  const sourceY = sourceNode.position.y
  const targetX = targetNode.position.x
  const targetY = targetNode.position.y
  
  // Calculate relative position
  const deltaX = targetX - sourceX
  const deltaY = targetY - sourceY
  
  // Determine primary direction based on larger difference
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  
  // If horizontal distance is greater
  if (absX > absY) {
    if (deltaX > 0) {
      // Target is to the right of source
      return {
        sourceHandle: 'right-source',
        targetHandle: 'left'
      }
    } else {
      // Target is to the left of source
      return {
        sourceHandle: 'left-source',
        targetHandle: 'right'
      }
    }
  } else {
    // Vertical distance is greater
    if (deltaY > 0) {
      // Target is below source
      return {
        sourceHandle: 'bottom-source',
        targetHandle: 'top'
      }
    } else {
      // Target is above source
      return {
        sourceHandle: 'top-source',
        targetHandle: 'bottom'
      }
    }
  }
}

/**
 * Get the position of a handle on a node
 * Used for drawing preview connections
 */
export function getHandlePosition(
  node: Node,
  handleId: string
): { x: number; y: number } {
  const nodeWidth = 120 // Default node width
  const nodeHeight = 50 // Default node height
  
  const centerX = node.position.x + nodeWidth / 2
  const centerY = node.position.y + nodeHeight / 2
  
  switch (handleId) {
    case 'top':
    case 'top-source':
      return { x: centerX, y: node.position.y }
    case 'right':
    case 'right-source':
      return { x: node.position.x + nodeWidth, y: centerY }
    case 'bottom':
    case 'bottom-source':
      return { x: centerX, y: node.position.y + nodeHeight }
    case 'left':
    case 'left-source':
      return { x: node.position.x, y: centerY }
    default:
      return { x: centerX, y: centerY }
  }
}

/**
 * Check if a connection between two nodes would be valid
 * (Can add custom validation logic here)
 */
export function isValidConnection(
  sourceNodeId: string,
  targetNodeId: string,
  existingEdges: Array<{ source: string; target: string }>
): boolean {
  // Can't connect a node to itself
  if (sourceNodeId === targetNodeId) {
    return false
  }

  // Allow multiple edges between the same node pair (duplicates permitted)
  // Additional validation rules can be added here as needed.

  return true
}