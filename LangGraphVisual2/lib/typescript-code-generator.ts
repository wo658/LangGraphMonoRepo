// Convert LangGraph back to TypeScript code
import type { LangGraph, GraphNode, GraphEdge } from "@/lib/types"
import { SPECIAL_NODES, sanitizeFunctionName, normalizeGraph } from "./codegen-shared"

// TS-specific helper for node ref formatting
function tsRef(nodeId: string): string {
  if (nodeId === '__start__') return 'START'
  if (nodeId === '__end__') return 'END'
  return `"${nodeId}"`
}

/**
 * Code generation strategies using Strategy Pattern
 */
interface TSCodeGenerator {
  generate(graph: LangGraph): string
}

class TSImportsGenerator implements TSCodeGenerator {
  generate(_graph: LangGraph): string {
    return `import { StateGraph, START, END } from "langgraph"

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
const ${sanitizedId} = async (state: WorkflowState): Promise<WorkflowState> => state`
  }

  private sanitizeFunctionName(id: string): string {
    return sanitizeFunctionName(id)
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
    return sanitizeFunctionName(id)
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
    const edges = graph.edges
      .filter(edge => !edge.label || edge.label === '')

    return edges
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
      const labels = edges.map(e => String(e.label))
      
      // Generate routing function
      result += `
// Routing function for ${source}
const ${routingFunctionName} = (state: WorkflowState): string => {
  // TODO: Implement routing logic
  // Return one of: ${labels.map(l => `"${l}"`).join(', ')}
  return ${labels.length > 0 ? `"${labels[0]}"` : `""`}
}`

      // Generate mapping object
      const mappings = edges.map(edge => `  "${edge.label}": ${tsRef(edge.target)}`).join(',\n')
      
      result += `

// Add conditional edges for ${source}
workflow.addConditionalEdges(${tsRef(source)}, ${routingFunctionName}, {
${mappings}
})`
    })

    return result
  }

  private formatDirectEdge(edge: GraphEdge): string {
    const source = tsRef(edge.source)
    const target = tsRef(edge.target)
    return `workflow.addEdge(${source}, ${target})`
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

class TSEntryPointGenerator implements TSCodeGenerator {
  generate(graph: LangGraph): string {
    const entryNode = graph.entryPoint
    if (!entryNode || entryNode === '__end__' || entryNode === '__start__') {
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

    const normalized = normalizeGraph(graph)

    return this.generators
      .map(generator => generator.generate(normalized))
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