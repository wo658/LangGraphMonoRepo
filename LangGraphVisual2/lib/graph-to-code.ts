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
    return graph.edges
      .filter(edge => edge.label && edge.label !== '')
      .map(edge => `# TODO: Add conditional edge logic for ${edge.source} -> ${edge.target} (condition: ${edge.label})`)
      .join('\n')
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

    return this.generators
      .map(generator => generator.generate(graph))
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
  switch (language) {
    case 'python':
      return generatePythonCode(graph)
    case 'typescript':
      return generateTypeScriptCode(graph)
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