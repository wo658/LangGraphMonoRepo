import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { LangGraph, GraphNode, GraphEdge, Position, NodePositionMap, GraphConnectivity } from '@/lib/types'

interface GraphStore {
  // Core graph state
  graph: LangGraph | null
  
  // Actions
  updateGraph: (graph: LangGraph) => void
  addNode: (node: GraphNode, position?: Position) => void
  removeNode: (nodeId: string) => void
  addEdge: (edge: GraphEdge) => void
  removeEdge: (edgeId: string) => void
  clearGraph: () => void

  // Derived getters
  getNodePositions: () => NodePositionMap
  getConnectivity: () => GraphConnectivity
}

const initialState = {
  graph: null,
}

export const useGraphStore = create<GraphStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      updateGraph: (graph: LangGraph) => {
        // Normalize incoming graph to use internal special IDs
        const normalized = normalizeGraphSpecialIds(graph)
        set({ graph: normalized })
      },

      addNode: (node: GraphNode, position?: Position) => {
        const { graph } = get()
        if (!graph) {
          // Create new graph with the node
          const n = normalizeNodeSpecialIds({ ...node, position })
          const newGraph: LangGraph = {
            nodes: [n],
            edges: [],
            entryPoint: undefined,
          }
          set({ graph: newGraph })
          return
        }

        const updatedGraph: LangGraph = {
          ...graph,
          nodes: [...graph.nodes, normalizeNodeSpecialIds({ ...node, position })]
        }
        set({ graph: updatedGraph })
      },

      removeNode: (nodeId: string) => {
        const { graph } = get()
        if (!graph) return
        const nid = normalizeId(nodeId)
        const updatedGraph: LangGraph = {
          ...graph,
          nodes: graph.nodes.filter(node => node.id !== nid),
          edges: graph.edges.filter(edge => edge.source !== nid && edge.target !== nid)
        }
        set({ graph: updatedGraph })
      },

      addEdge: (edge: GraphEdge) => {
        const { graph } = get()
        if (!graph) return
        const e = normalizeEdgeSpecialIds(edge)
        const updatedGraph: LangGraph = {
          ...graph,
          edges: [...graph.edges, e]
        }
        set({ graph: updatedGraph })
      },

      removeEdge: (edgeId: string) => {
        const { graph } = get()
        if (!graph) return

        const updatedGraph: LangGraph = {
          ...graph,
          edges: graph.edges.filter(edge => edge.id !== edgeId)
        }
        set({ graph: updatedGraph })
      },

      clearGraph: () => {
        set({ graph: null })
      },

      // Derived getters
      getNodePositions: () => {
        const graph = get().graph
        const map: NodePositionMap = {}
        if (!graph) return map
        for (const n of graph.nodes) {
          if (n.position) {
            map[n.id] = { x: n.position.x, y: n.position.y }
          }
        }
        return map
      },

      getConnectivity: () => {
        const graph = get().graph
        const connectivity: GraphConnectivity = { incoming: {}, outgoing: {} }
        if (!graph) return connectivity

        for (const n of graph.nodes) {
          connectivity.incoming[n.id] = []
          connectivity.outgoing[n.id] = []
        }
        for (const e of graph.edges) {
          if (!connectivity.outgoing[e.source]) connectivity.outgoing[e.source] = []
          if (!connectivity.incoming[e.target]) connectivity.incoming[e.target] = []
          connectivity.outgoing[e.source].push(e.target)
          connectivity.incoming[e.target].push(e.source)
        }
        return connectivity
      },
    })),
    {
      name: 'graph-store',
    }
  )
)

// Typed selectors for optimal performance
export const useGraph = () => useGraphStore(state => state.graph)
export const useGraphActions = () => useGraphStore(
  useShallow((state) => ({
    updateGraph: state.updateGraph,
    addNode: state.addNode,
    removeNode: state.removeNode,
    addEdge: state.addEdge,
    removeEdge: state.removeEdge,
    clearGraph: state.clearGraph,
  }))
)

// --- Internal helpers to normalize special node aliases ---
function normalizeId(id: string): string {
  if (!id) return id
  if (id === 'START') return '__start__'
  if (id === 'END') return '__end__'
  return id
}

function normalizeNodeSpecialIds(node: GraphNode): GraphNode {
  const nid = normalizeId(node.id)
  return { ...node, id: nid }
}

function normalizeEdgeSpecialIds(edge: GraphEdge): GraphEdge {
  return { ...edge, source: normalizeId(edge.source), target: normalizeId(edge.target) }
}

function normalizeGraphSpecialIds(graph: LangGraph): LangGraph {
  return {
    ...graph,
    nodes: (graph.nodes || []).map(normalizeNodeSpecialIds),
    edges: (graph.edges || [])
      .map(normalizeEdgeSpecialIds)
      // Filter out implicit entry edges so they don't persist in store/state
      .filter(e => e.id !== 'e_entry' && e.source !== '__start__'),
    entryPoint: graph.entryPoint ? normalizeId(graph.entryPoint) : undefined,
  }
}