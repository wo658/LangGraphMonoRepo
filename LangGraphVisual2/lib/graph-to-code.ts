// Convert LangGraph back to Python/TypeScript code
import type { LangGraph, GraphNode, GraphEdge } from "@/lib/types"
import { generateTypeScriptCode } from "./typescript-code-generator"

// Supported code generation languages
export type SupportedLanguage = 'python' | 'typescript'

// Constants for better maintainability
const SPECIAL_NODES = ['__start__', '__end__'] as const
const PYTHON_IMPORTS = `from typing import TypedDict
from langgraph.graph import StateGraph, START, END

# Define the state
class State(TypedDict):
    # Add your state fields here
    pass
` as const

// Utility functions for code generation
const CodeGenerationUtils = {
  /**
   * Sanitizes a node ID to be a valid Python function name
   */
  sanitizeFunctionName(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&')
  },

  /**
   * Checks if a node is a special system node
   */
  isSpecialNode(nodeId: string): boolean {
    return SPECIAL_NODES.includes(nodeId as any)
  },

  /**
   * Formats a node reference for Python code
   */
  formatNodeReference(nodeId: string): string {
    if (nodeId === '__start__') return 'START'
    if (nodeId === '__end__') return 'END'
    return `"${nodeId}"`
  },

  /**
   * Validates that a graph has the minimum required structure
   */
  validateGraphStructure(graph: LangGraph): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!graph.nodes || graph.nodes.length === 0) {
      errors.push('Graph must contain at least one node')
    }
    
    // Check for duplicate node IDs
    const nodeIds = graph.nodes.map(n => n.id)
    const duplicates = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate node IDs found: ${duplicates.join(', ')}`)
    }
    
    // Check for edges referencing non-existent nodes
    const validNodeIds = new Set(nodeIds.concat(SPECIAL_NODES))
    const invalidEdges = graph.edges.filter(edge => 
      !validNodeIds.has(edge.source) || !validNodeIds.has(edge.target)
    )
    if (invalidEdges.length > 0) {
      errors.push(`Edges reference non-existent nodes: ${invalidEdges.map(e => `${e.source}->${e.target}`).join(', ')}`)
    }
    
    return { isValid: errors.length === 0, errors }
  }
} as const

/**
 * Normalize a LangGraph by de-duplicating nodes and edges.
 * - Nodes: unique by id (first occurrence wins)
 * - Edges: unique by source-target-label triplet (first occurrence wins)
 */
function normalizeGraph(graph: LangGraph): LangGraph {
  if (!graph) return graph

  // Deduplicate nodes by id (preserve first occurrence)
  const seenNodes = new Set<string>()
  const nodes = [] as LangGraph["nodes"]
  for (const n of graph.nodes || []) {
    if (!seenNodes.has(n.id)) {
      seenNodes.add(n.id)
      nodes.push(n)
    }
  }

  // Deduplicate edges by key: source|target|label
  const seenEdges = new Set<string>()
  const edges = [] as LangGraph["edges"]
  for (const e of graph.edges || []) {
    const key = `${e.source}|${e.target}|${e.label ?? ''}`
    if (!seenEdges.has(key)) {
      seenEdges.add(key)
      edges.push(e)
    }
  }

  return { nodes, edges }
}

/**
 * Code generation strategies using Strategy Pattern
 */
interface CodeGenerator {
  generate(graph: LangGraph): string
}

class ImportsGenerator implements CodeGenerator {
  generate(): string {
    return PYTHON_IMPORTS
  }
}

class NodeFunctionsGenerator implements CodeGenerator {
  generate(graph: LangGraph): string {
    return this.getRegularNodes(graph)
      .map(node => this.generateNodeFunction(node))
      .join('')
  }

  private getRegularNodes(graph: LangGraph): GraphNode[] {
    return graph.nodes.filter(node => !SPECIAL_NODES.includes(node.id as any))
  }

  private generateNodeFunction(node: GraphNode): string {
    const sanitizedId = this.sanitizeFunctionName(node.id)
    return `
def ${sanitizedId}(state: State):
    """${node.label}"""
    # TODO: Implement ${node.label} logic
    return state
`
  }

  private sanitizeFunctionName(id: string): string {
    return CodeGenerationUtils.sanitizeFunctionName(id)
  }
}

class WorkflowGenerator implements CodeGenerator {
  generate(graph: LangGraph): string {
    const setup = `
# Build the graph
workflow = StateGraph(State)

# Add nodes`
    
    const nodes = this.getRegularNodes(graph)
      .map(node => `workflow.add_node("${node.id}", ${this.sanitizeFunctionName(node.id)})`)
      .join('\n')

    return [setup, nodes].join('\n')
  }

  private getRegularNodes(graph: LangGraph): GraphNode[] {
    return graph.nodes.filter(node => !SPECIAL_NODES.includes(node.id as any))
  }

  private sanitizeFunctionName(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&')
  }
}

class EdgesGenerator implements CodeGenerator {
  generate(graph: LangGraph): string {
    const header = `
# Add edges`
    
    const directEdges = this.generateDirectEdges(graph)
    const conditionalEdges = this.generateConditionalEdges(graph)

    return [header, directEdges, conditionalEdges].filter(Boolean).join('\n')
  }

  private generateDirectEdges(graph: LangGraph): string {
    return graph.edges
      .filter(edge => !edge.label || edge.label === '')
      .map(edge => this.formatDirectEdge(edge))
      .join('\n')
  }

  private generateConditionalEdges(graph: LangGraph): string {
    // Group labeled edges by source to build a mapping per source
    const bySource = new Map<string, { label: string; target: string }[]>()
    for (const e of graph.edges) {
      if (e.label && e.label !== '') {
        if (!bySource.has(e.source)) bySource.set(e.source, [])
        bySource.get(e.source)!.push({ label: String(e.label), target: e.target })
      }
    }

    if (bySource.size === 0) return ''

    const parts: string[] = []
    for (const [source, items] of bySource.entries()) {
      // Build unique label->target mapping (last one wins if duplicates)
      const mapping = new Map<string, string>()
      for (const { label, target } of items) {
        mapping.set(label, target)
      }

      const funcName = `route_${source.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&')}`
      const labels = Array.from(mapping.keys())

      // Emit a minimal routing function stub so the code is runnable and parsable
      parts.push(`
def ${funcName}(state: State):
    """Routing logic for ${source}. Must return one of: ${labels.map(l => `'${l}'`).join(', ')}"""
    # TODO: Implement routing; return a label matching one of the mapping keys below
    return ${labels.length > 0 ? `'${labels[0]}'` : "''"}
`)

      // Emit add_conditional_edges with mapping
      const sourceRef = source === '__start__' ? 'START' : `"${source}"`
      const mappingEntries = Array.from(mapping.entries())
        .map(([label, target]) => `    "${label}": ${target === '__end__' ? 'END' : `"${target}"`}`)
        .join(',\n')

      parts.push(`workflow.add_conditional_edges(${sourceRef}, ${funcName}, {\n${mappingEntries}\n})`)
    }

    return parts.join('\n')
  }

  private formatDirectEdge(edge: GraphEdge): string {
    const source = edge.source === '__start__' ? 'START' : `"${edge.source}"`
    const target = edge.target === '__end__' ? 'END' : `"${edge.target}"`
    return `workflow.add_edge(${source}, ${target})`
  }
}

class CompilationGenerator implements CodeGenerator {
  generate(): string {
    return `
# Compile the graph
graph = workflow.compile()
`
  }
}

/**
 * Main code generator using Template Method Pattern
 */
class PythonCodeGenerator {
  private generators: CodeGenerator[]

  constructor() {
    this.generators = [
      new ImportsGenerator(),
      new NodeFunctionsGenerator(),
      new WorkflowGenerator(),
      new EdgesGenerator(),
      new CompilationGenerator()
    ]
  }

  generate(graph: LangGraph): string {
    if (!this.isValidGraph(graph)) {
      return ""
    }

    const normalized = normalizeGraph(graph)

    return this.generators
      .map(generator => generator.generate(normalized))
      .join('\n')
  }

  private isValidGraph(graph: LangGraph | null): graph is LangGraph {
    return Boolean(graph && graph.nodes.length > 0)
  }
}

// Factory function for better testability and dependency injection
export function createPythonCodeGenerator(): PythonCodeGenerator {
  return new PythonCodeGenerator()
}

// Main export function - maintains backward compatibility
export function generatePythonCode(graph: LangGraph): string {
  const generator = createPythonCodeGenerator()
  return generator.generate(graph)
}

// Universal code generator that supports all languages
export function generateCode(graph: LangGraph, language: SupportedLanguage): string {
  const normalized = normalizeGraph(graph)
  switch (language) {
    case 'python':
      // generatePythonCode internally normalizes as well for safety
      return generatePythonCode(normalized)
    case 'typescript':
      return generateTypeScriptCode(normalized)
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}

// Utility function to get available languages
export function getSupportedLanguages(): SupportedLanguage[] {
  return ['python', 'typescript']
}

// Utility function to get language display names
export function getLanguageDisplayName(language: SupportedLanguage): string {
  switch (language) {
    case 'python':
      return 'Python'
    case 'typescript':
      return 'TypeScript'
    default:
      return language
  }
}