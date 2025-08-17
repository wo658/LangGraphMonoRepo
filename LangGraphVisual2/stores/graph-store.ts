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
        set({ graph })
      },

      addNode: (node: GraphNode, position?: Position) => {
        const { graph } = get()
        if (!graph) {
          // Create new graph with the node
          const newGraph: LangGraph = {
            nodes: [{ ...node, position }],
            edges: []
          }
          set({ graph: newGraph })
          return
        }

        const updatedGraph: LangGraph = {
          ...graph,
          nodes: [...graph.nodes, { ...node, position }]
        }
        set({ graph: updatedGraph })
      },

      removeNode: (nodeId: string) => {
        const { graph } = get()
        if (!graph) return

        const updatedGraph: LangGraph = {
          ...graph,
          nodes: graph.nodes.filter(node => node.id !== nodeId),
          edges: graph.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
        }
        set({ graph: updatedGraph })
      },

      addEdge: (edge: GraphEdge) => {
        const { graph } = get()
        if (!graph) return

        const updatedGraph: LangGraph = {
          ...graph,
          edges: [...graph.edges, edge]
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