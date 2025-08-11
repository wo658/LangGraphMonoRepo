import { useMemo } from 'react'
import type { Node, Edge } from 'reactflow'
import type { LangGraph, Position } from '@/lib/types'
import { createStyledEdgesWithCollisionAvoidance } from '@/lib/edge-utils'
import { GRAPH_CONFIG } from '@/lib/constants'

// Position calculator for new nodes
const calculateNodePosition = (index: number, totalNodes: number): Position => {
  if (totalNodes <= 3) {
    return {
      x: index * GRAPH_CONFIG.DEFAULT_NODE_SPACING + 100,
      y: 100
    }
  }
  const cols = Math.ceil(Math.sqrt(totalNodes))
  const row = Math.floor(index / cols)
  const col = index % cols
  return {
    x: col * GRAPH_CONFIG.DEFAULT_NODE_SPACING + 100,
    y: row * 150 + 100
  }
}

/**
 * Hook that converts LangGraph data to ReactFlow format
 * This handles the transformation of graph data to ReactFlow nodes and edges
 */
export const useReactFlowData = (graph: LangGraph | null, isDark: boolean) => {
  return useMemo(() => {
    if (!graph) {
      return { nodes: [] as Node[], edges: [] as Edge[] }
    }

    // Convert LangGraph nodes to ReactFlow format
    const nodes: Node[] = graph.nodes.map((node, index) => ({
      id: node.id,
      type: "custom" as const,
      data: {
        label: node.label,
        nodeType: node.type || 'default'
      },
      position: node.position || calculateNodePosition(index, graph.nodes.length),
      draggable: true,
      connectable: false,
    }))

    // Convert LangGraph edges to ReactFlow format with styling
    const edges: Edge[] = createStyledEdgesWithCollisionAvoidance(graph.edges, nodes, isDark)

    return { nodes, edges }
  }, [graph, isDark])
}

/**
 * Hook that only converts nodes (useful when you don't need edges)
 */
export const useReactFlowNodes = (graph: LangGraph | null) => {
  return useMemo(() => {
    if (!graph) {
      return [] as Node[]
    }

    return graph.nodes.map((node, index) => ({
      id: node.id,
      type: "custom" as const,
      data: {
        label: node.label,
        nodeType: node.type || 'default'
      },
      position: node.position || calculateNodePosition(index, graph.nodes.length),
      draggable: true,
      connectable: false,
    }))
  }, [graph])
}

/**
 * Hook that only converts edges (useful when you don't need nodes recalculated)
 */
export const useReactFlowEdges = (graph: LangGraph | null, nodes: Node[], isDark: boolean) => {
  return useMemo(() => {
    if (!graph || !nodes.length) {
      return [] as Edge[]
    }

    return createStyledEdgesWithCollisionAvoidance(graph.edges, nodes, isDark)
  }, [graph, nodes, isDark])
}

/**
 * Utility hook to get node position calculator
 */
export const useNodePositionCalculator = () => {
  return useMemo(() => calculateNodePosition, [])
}