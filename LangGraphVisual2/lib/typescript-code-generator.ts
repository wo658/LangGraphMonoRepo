// Convert LangGraph back to TypeScript code
import type { LangGraph, GraphNode, GraphEdge } from "@/lib/types"

// (JavaScript support removed)

// Constants for better maintainability
const SPECIAL_NODES = ['__start__', '__end__'] as const

// Utility functions for TypeScript code generation
const TSCodeGenerationUtils = {
  /**
   * Sanitizes a node ID to be a valid TypeScript function name
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
   * Formats a node reference for TypeScript code (string constants)
   */
  formatNodeReference(nodeId: string): string {
    if (nodeId === '__start__') return '"START"'
    if (nodeId === '__end__') return '"END"'
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
interface TSCodeGenerator {
  generate(graph: LangGraph): string
}

class TSImportsGenerator implements TSCodeGenerator {
  generate(_graph: LangGraph): string {
    return `import { StateGraph } from "langgraph"

// Define the state interface
interface WorkflowState {
  // Add your state fields here
  [key: string]: any
}`
  }
}

class TSNodeFunctionsGenerator implements TSCodeGenerator {
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

// ${node.label}
const ${sanitizedId} = async (state: WorkflowState): Promise<WorkflowState> => {
  console.log("Processing ${node.label}:", state)
  // TODO: Implement ${node.label} logic
  return { ...state, currentStep: "${node.id}" }
}`
  }

  private sanitizeFunctionName(id: string): string {
    return TSCodeGenerationUtils.sanitizeFunctionName(id)
  }
}

class TSWorkflowGenerator implements TSCodeGenerator {
  generate(graph: LangGraph): string {
    const setup = `

// Build the workflow
const workflow = new StateGraph(WorkflowState)

// Add nodes`
    
    const nodes = this.getRegularNodes(graph)
      .map(node => `workflow.addNode("${node.id}", ${this.sanitizeFunctionName(node.id)})`)
      .join('\n')

    return [setup, nodes].join('\n')
  }

  private getRegularNodes(graph: LangGraph): GraphNode[] {
    return graph.nodes.filter(node => !SPECIAL_NODES.includes(node.id as any))
  }

  private sanitizeFunctionName(id: string): string {
    return TSCodeGenerationUtils.sanitizeFunctionName(id)
  }
}

class TSEdgesGenerator implements TSCodeGenerator {
  generate(graph: LangGraph): string {
    const header = `

// Add edges`
    
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
    const conditionalEdges = graph.edges.filter(edge => edge.label && edge.label !== '')
    
    if (conditionalEdges.length === 0) return ''

    // Group conditional edges by source node
    const edgeGroups = new Map<string, GraphEdge[]>()
    conditionalEdges.forEach(edge => {
      if (!edgeGroups.has(edge.source)) {
        edgeGroups.set(edge.source, [])
      }
      edgeGroups.get(edge.source)!.push(edge)
    })

    let result = ''
    edgeGroups.forEach((edges, source) => {
      const routingFunctionName = `route${this.capitalizeFirst(source)}`
      
      // Generate routing function
      result += `
// Routing function for ${source}
const ${routingFunctionName} = (state: WorkflowState): string => {
  // TODO: Implement routing logic
  // Return one of: ${edges.map(e => `"${e.label}"`).join(', ')}
  return "default"
}`

      // Generate mapping object
      const mappings = edges.map(edge => `  "${edge.label}": "${edge.target}"`).join(',\n')
      
      result += `

// Add conditional edges for ${source}
workflow.addConditionalEdges("${source}", ${routingFunctionName}, {
${mappings}
})`
    })

    return result
  }

  private formatDirectEdge(edge: GraphEdge): string {
    const source = TSCodeGenerationUtils.formatNodeReference(edge.source)
    const target = TSCodeGenerationUtils.formatNodeReference(edge.target)
    return `workflow.addEdge(${source}, ${target})`
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

class TSEntryPointGenerator implements TSCodeGenerator {
  generate(graph: LangGraph): string {
    // Find the entry point (node that START points to)
    const startEdge = graph.edges.find(edge => edge.source === '__start__')
    const entryNode = startEdge ? startEdge.target : graph.nodes[0]?.id
    
    if (!entryNode || entryNode === '__end__') {
      return ''
    }

    return `

// Set entry point
workflow.setEntryPoint("${entryNode}")`
  }
}

class TSExportGenerator implements TSCodeGenerator {
  generate(_graph: LangGraph): string {
    return `

// Compile and export the workflow
const compiledWorkflow = workflow.compile()
export default compiledWorkflow`
  }
}

/**
 * Main TypeScript code generator using Template Method Pattern
 */
class TypeScriptCodeGenerator {
  private generators: TSCodeGenerator[]

  constructor() {
    this.generators = [
      new TSImportsGenerator(),
      new TSNodeFunctionsGenerator(),
      new TSWorkflowGenerator(),
      new TSEdgesGenerator(),
      new TSEntryPointGenerator(),
      new TSExportGenerator()
    ]
  }

  generate(graph: LangGraph): string {
    if (!this.isValidGraph(graph)) {
      return ""
    }

    const validation = TSCodeGenerationUtils.validateGraphStructure(graph)
    if (!validation.isValid) {
      console.warn('Graph validation errors:', validation.errors)
      // Continue generation but add comments about errors
    }

    return this.generators
      .map(generator => generator.generate(graph))
      .join('\n')
  }

  private isValidGraph(graph: LangGraph | null): graph is LangGraph {
    return Boolean(graph && graph.nodes.length > 0)
  }
}

// Factory functions for better testability and dependency injection
export function createTypeScriptCodeGenerator(): TypeScriptCodeGenerator {
  return new TypeScriptCodeGenerator()
}

// Main export functions
export function generateTypeScriptCode(graph: LangGraph): string {
  const generator = createTypeScriptCodeGenerator()
  return generator.generate(graph)
}