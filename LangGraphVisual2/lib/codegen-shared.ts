// Shared utilities for code generation across languages
import type { LangGraph } from "@/lib/types"

export const SPECIAL_NODES = ['__start__', '__end__'] as const

export function isSpecialNode(id: string): boolean {
  return (SPECIAL_NODES as readonly string[]).includes(id)
}

export function sanitizeFunctionName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&')
}

// Deduplicate nodes/edges for stable codegen
export function normalizeGraph(graph: LangGraph): LangGraph {
  if (!graph) return graph

  const seenNodes = new Set<string>()
  const nodes = [] as LangGraph["nodes"]
  for (const n of graph.nodes || []) {
    if (!seenNodes.has(n.id)) {
      seenNodes.add(n.id)
      nodes.push(n)
    }
  }

  const seenEdges = new Set<string>()
  const edges = [] as LangGraph["edges"]
  for (const e of graph.edges || []) {
    const key = `${e.source}|${e.target}|${e.label ?? ''}`
    if (!seenEdges.has(key)) {
      seenEdges.add(key)
      edges.push(e)
    }
  }

  return { nodes, edges, entryPoint: graph.entryPoint }
}
