import type { ParseResult, ParsedNode, ParsedEdge } from "./python-parser"
import type { LangGraph } from "./types"

// Enhanced logging utility
const logger = {
    debug: (..._args: unknown[]) => {
        // console.log(`[TS Parser]`, ...args)
    },
    error: (..._args: unknown[]) => {
        // console.error(`[TS Parser]`, ...args)
    }
}

// TypeScript/JavaScript LangGraph patterns
const TS_PATTERNS = {
    // const workflow = new StateGraph(State)
    STATE_GRAPH: /(?:const|let|var)\s+(\w+)\s*=\s*new\s+StateGraph\s*\(/g,
    
    // workflow.addNode("agent", agentFunction)
    ADD_NODE: /(\w+)\.addNode\s*\(\s*["'`]([^"'`]+)["'`]\s*,?\s*([^)]*)\)/g,
    
    // workflow.addEdge("agent", "researcher")
    ADD_EDGE: /(\w+)\.addEdge\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]\s*\)/g,
    
    // workflow.addConditionalEdges("agent", condition, { ... })
    ADD_CONDITIONAL: /(\w+)\.addConditionalEdges\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*([^,]+),\s*\{([^}]+)\}/g,
    
    // workflow.setEntryPoint("agent")
    SET_ENTRY: /(\w+)\.setEntryPoint\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
    
    // START, END constants
    START_END: /(?:START|END|REACT_AGENT_BEGIN|REACT_AGENT_END)/g,
    
    // Object mapping for conditional edges: "continue": "researcher"
    MAPPING: /["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]/g,
} as const

/**
 * Clean identifier by removing quotes and handling special cases
 */
function cleanIdentifier(identifier: string): string {
    if (!identifier) return ''
    
    // Remove quotes
    let cleaned = identifier.trim().replace(/^["'`]|["'`]$/g, '')
    
    // Handle special constants
    if (cleaned === 'START' || cleaned === 'REACT_AGENT_BEGIN') {
        return '__start__'
    }
    if (cleaned === 'END' || cleaned === 'REACT_AGENT_END') {
        return '__end__'
    }
    
    // Handle template literals ${...}
    if (cleaned.includes('${')) {
        cleaned = cleaned.replace(/\$\{[^}]+\}/g, 'var')
    }
    
    return cleaned
}

/**
 * Extract nodes from TypeScript/JavaScript code
 */
function extractNodes(code: string): { nodes: ParsedNode[], nodeSet: Set<string> } {
    const nodes: ParsedNode[] = []
    const nodeSet = new Set<string>()
    let match: RegExpExecArray | null
    
    // Reset regex
    TS_PATTERNS.ADD_NODE.lastIndex = 0
    
    while ((match = TS_PATTERNS.ADD_NODE.exec(code)) !== null) {
        const nodeId = cleanIdentifier(match[2])
        
        if (nodeId && !nodeSet.has(nodeId)) {
            nodeSet.add(nodeId)
            nodes.push({
                id: nodeId,
                label: nodeId.charAt(0).toUpperCase() + nodeId.slice(1),
                type: "default"
            })
            logger.debug(`Found node: ${nodeId}`)
        }
    }
    
    return { nodes, nodeSet }
}

/**
 * Extract direct edges from TypeScript/JavaScript code
 */
function extractDirectEdges(code: string): ParsedEdge[] {
    const edges: ParsedEdge[] = []
    let match: RegExpExecArray | null
    let edgeCounter = 1
    
    // Reset regex
    TS_PATTERNS.ADD_EDGE.lastIndex = 0
    
    while ((match = TS_PATTERNS.ADD_EDGE.exec(code)) !== null) {
        const source = cleanIdentifier(match[2])
        const target = cleanIdentifier(match[3])
        
        if (source && target) {
            edges.push({
                id: `e${edgeCounter++}`,
                source,
                target
            })
            logger.debug(`Found edge: ${source} -> ${target}`)
        }
    }
    
    return edges
}

/**
 * Extract conditional edges from TypeScript/JavaScript code
 */
function extractConditionalEdges(
    code: string,
    nodes: ParsedNode[],
    nodeSet: Set<string>
): ParsedEdge[] {
    const edges: ParsedEdge[] = []
    let match: RegExpExecArray | null
    let edgeCounter = 100 // Start from 100 to avoid ID conflicts
    
    // Reset regex
    TS_PATTERNS.ADD_CONDITIONAL.lastIndex = 0
    
    while ((match = TS_PATTERNS.ADD_CONDITIONAL.exec(code)) !== null) {
        const source = cleanIdentifier(match[2])
        const conditionFunc = match[3].trim()
        const mappingStr = match[4]
        
        if (!source || !mappingStr) continue
        
        // Add condition node if needed
        const conditionNodeId = `${source}_condition`
        if (!nodeSet.has(conditionNodeId)) {
            nodeSet.add(conditionNodeId)
            nodes.push({
                id: conditionNodeId,
                label: conditionFunc || 'Condition',
                type: "default"
            })
        }
        
        // Add edge from source to condition
        edges.push({
            id: `e${edgeCounter++}`,
            source,
            target: conditionNodeId
        })
        
        // Parse mapping object
        let mappingMatch: RegExpExecArray | null
        TS_PATTERNS.MAPPING.lastIndex = 0
        
        while ((mappingMatch = TS_PATTERNS.MAPPING.exec(mappingStr)) !== null) {
            const condition = mappingMatch[1]
            const target = cleanIdentifier(mappingMatch[2])
            
            if (condition && target) {
                edges.push({
                    id: `e${edgeCounter++}`,
                    source: conditionNodeId,
                    target,
                    label: condition,
                    animated: true
                })
            }
        }
    }
    
    return edges
}

/**
 * Extract entry point from TypeScript/JavaScript code
 */
function extractEntryPoint(code: string): ParsedEdge | null {
    const match = TS_PATTERNS.SET_ENTRY.exec(code)
    
    if (match) {
        const entryNode = cleanIdentifier(match[2])
        return {
            id: 'e_entry',
            source: '__start__',
            target: entryNode
        }
    }
    
    return null
}

/**
 * Add special START/END nodes if referenced
 */
function addSpecialNodes(nodes: ParsedNode[], edges: ParsedEdge[], nodeSet: Set<string>): void {
    const hasStart = edges.some(e => e.source === '__start__')
    const hasEnd = edges.some(e => e.target === '__end__')
    
    if (hasStart && !nodeSet.has('__start__')) {
        nodes.unshift({
            id: '__start__',
            label: 'START',
            type: 'input'
        })
    }
    
    if (hasEnd && !nodeSet.has('__end__')) {
        nodes.push({
            id: '__end__',
            label: 'END',
            type: 'output'
        })
    }
}

/**
 * Apply consistent layout to nodes
 */
function layoutNodes(nodes: ParsedNode[], edges: ParsedEdge[]): void {
    const SPACING = { x: 350, y: 200 }
    const START = { x: 500, y: 100 }
    
    // Create adjacency map
    const adjacency = new Map<string, string[]>()
    edges.forEach(edge => {
        if (!adjacency.has(edge.source)) {
            adjacency.set(edge.source, [])
        }
        adjacency.get(edge.source)!.push(edge.target)
    })
    
    // Layer nodes
    const layers: string[][] = []
    const visited = new Set<string>()
    
    // Start with START node or first node
    const startNode = nodes.find(n => n.id === '__start__') || nodes[0]
    if (startNode) {
        layers[0] = [startNode.id]
        visited.add(startNode.id)
    }
    
    // Build layers
    let currentLayer = 0
    while (layers[currentLayer]?.length > 0) {
        const nextLayer: string[] = []
        
        layers[currentLayer].forEach(nodeId => {
            const neighbors = adjacency.get(nodeId) || []
            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    nextLayer.push(neighbor)
                    visited.add(neighbor)
                }
            })
        })
        
        if (nextLayer.length > 0) {
            layers[++currentLayer] = nextLayer
        } else {
            break
        }
    }
    
    // Add unvisited nodes
    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            if (!layers[currentLayer + 1]) {
                layers[currentLayer + 1] = []
            }
            layers[currentLayer + 1].push(node.id)
        }
    })
    
    // Position nodes
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    
    layers.forEach((layer, layerIndex) => {
        const y = START.y + layerIndex * SPACING.y
        
        layer.forEach((nodeId, nodeIndex) => {
            const node = nodeMap.get(nodeId)
            if (node) {
                const totalWidth = (layer.length - 1) * SPACING.x
                const x = START.x - totalWidth / 2 + nodeIndex * SPACING.x
                node.position = { x, y }
            }
        })
    })
}

/**
 * Mark loop feedback edges
 */
function markLoopFeedbackEdges(edges: ParsedEdge[], nodes: ParsedNode[]): void {
    const nodePositions = new Map(nodes.map(n => [n.id, n.position?.y || 0]))
    
    edges.forEach(edge => {
        const sourceY = nodePositions.get(edge.source) || 0
        const targetY = nodePositions.get(edge.target) || 0
        
        if (sourceY > targetY) {
            edge.isLoopFeedback = true
        }
    })
}

/**
 * Parse TypeScript/JavaScript LangGraph code
 */
export function parseTypeScriptCode(code: string): ParseResult {
    try {
        logger.debug('Starting TypeScript/JavaScript parsing...')
        
        // Extract components
        const { nodes, nodeSet } = extractNodes(code)
        const directEdges = extractDirectEdges(code)
        const conditionalEdges = extractConditionalEdges(code, nodes, nodeSet)
        
        // Combine edges
        const allEdges = [...directEdges, ...conditionalEdges]
        
        // Add entry point
        const entryEdge = extractEntryPoint(code)
        if (entryEdge) {
            allEdges.push(entryEdge)
        }
        
        // Add special nodes
        addSpecialNodes(nodes, allEdges, nodeSet)
        
        // Layout nodes
        layoutNodes(nodes, allEdges)
        
        // Mark feedback loops
        markLoopFeedbackEdges(allEdges, nodes)
        
        logger.debug(`Parsed ${nodes.length} nodes and ${allEdges.length} edges`)
        
        return {
            nodes,
            edges: allEdges,
            success: true
        }
    } catch (error) {
        logger.error('Failed to parse TypeScript/JavaScript code:', error)
        return {
            nodes: [],
            edges: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown parsing error'
        }
    }
}

/**
 * Convert parse result to LangGraph format
 */
export function convertToLangGraph(parseResult: ParseResult): LangGraph | null {
    if (!parseResult.success) {
        return null
    }
    
    return {
        nodes: parseResult.nodes.map(node => ({
            id: node.id,
            label: node.label,
            type: node.type,
            position: node.position || { x: 0, y: 0 }
        })),
        edges: parseResult.edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            animated: edge.animated || false,
            isLoopFeedback: edge.isLoopFeedback || false
        }))
    }
}