import type { LangGraph } from "./types"

// Enhanced logging utility with better type safety
interface Logger {
    debug: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
}

const logger: Logger = {
    debug: () => {
        // Environment check removed for browser compatibility
        // console.log(`[Parser] ${message}`, ...args)
    },
    info: () => {
        // console.info(`[Parser] ${message}`, ...args)
    },
    error: () => {
        // console.error(`[Parser] ${message}`, error, ...args)
    }
}

export interface ParsedNode {
    id: string
    label: string
    type: NodeType
    position?: { x: number; y: number }
}

export interface ParsedEdge {
    id: string
    source: string
    target: string
    label?: string
    animated?: boolean
    isLoopFeedback?: boolean
}

export interface ParseResult {
    nodes: ParsedNode[]
    edges: ParsedEdge[]
    success: boolean
    error?: string
}

/**
 * Extracts arguments from parentheses with proper handling of nested structures
 * @param text - The text containing parentheses with arguments
 * @returns Array of extracted arguments
 */
const extractArguments = (text: string): string[] => {
    const match = text.match(/\(([^)]+)\)/)
    if (!match) return []

    return parseArgumentString(match[1])
}

/**
 * Parses a comma-separated argument string while respecting quotes and nested structures
 */
const parseArgumentString = (argString: string): string[] => {
    const args: string[] = []
    let current = ''
    let depth = 0
    let inQuotes = false
    let quoteChar = ''

    for (const char of argString) {
        if (shouldToggleQuotes(char, inQuotes, quoteChar)) {
            inQuotes = !inQuotes
            quoteChar = inQuotes ? char : ''
        } else if (!inQuotes) {
            if (char === '{') depth++
            else if (char === '}') depth--
            else if (char === ',' && depth === 0) {
                if (current.trim()) args.push(current.trim())
                current = ''
                continue
            }
        }

        current += char
    }

    if (current.trim()) {
        args.push(current.trim())
    }

    return args
}

/**
 * Determines if quote state should be toggled
 */
const shouldToggleQuotes = (char: string, inQuotes: boolean, quoteChar: string): boolean => {
    return (!inQuotes && (char === '"' || char === "'")) || (inQuotes && char === quoteChar)
}

// Utility function to clean identifiers (remove quotes, handle ENUMs)
const cleanIdentifier = (identifier: string): string => {
    if (!identifier) return ''

    // Remove quotes if present
    let cleaned = identifier.trim().replace(/^["']|["']$/g, '')

    // Handle ENUM format (e.g., WorkflowNodes.EXTRACT_INFO -> EXTRACT_INFO)
    if (cleaned.includes('.')) {
        const parts = cleaned.split('.')
        cleaned = parts[parts.length - 1] // Take the last part
    }

    return cleaned
}

// Enhanced regex patterns that capture full method calls
const REGEX_PATTERNS = {
    NODE: /(\w+)\.add_node\(([^)]+)\)/g,
    DIRECT_EDGE: /(\w+)\.add_edge\(([^)]+)\)/g,
    CONDITIONAL_EDGE: /(\w+)\.add_conditional_edges\(([^}]+\}[^)]*)\)/g,
    ENTRY_POINT: /(\w+)\.set_entry_point\(([^)]+)\)/g,
    MAPPING: /["']([^"']+)["']\s*:\s*([^,}]+)/g,
} as const

type RegexMatch = RegExpExecArray | null
type NodeType = "default" | "input" | "output"

// Utility functions
const normalizeNodeName = (name: string): string =>
    name === "START" ? "__start__" : name === "END" ? "__end__" : name

const createNodeLabel = (id: string): string =>
    id.charAt(0).toUpperCase() + id.slice(1)

/**
 * Extract nodes from add_node calls
 */
function extractNodes(code: string): { nodes: ParsedNode[], nodeSet: Set<string> } {
    const nodes: ParsedNode[] = []
    const nodeSet = new Set<string>()
    let nodeMatch: RegexMatch

    try {
        while ((nodeMatch = REGEX_PATTERNS.NODE.exec(code)) !== null) {
            if (!nodeMatch[2]) {
                logger.debug('Skipping node match with missing arguments')
                continue
            }

            const argsString = nodeMatch[2]
            const args = extractArguments(`(${argsString})`)

            if (args.length >= 1) {
                const nodeId = cleanIdentifier(args[0])

                if (nodeId && !nodeSet.has(nodeId)) {
                    nodeSet.add(nodeId)
                    nodes.push({
                        id: nodeId,
                        label: createNodeLabel(nodeId),
                        type: "default"
                    })
                    logger.debug(`Extracted node: ${nodeId}`)
                }
            }
        }
    } catch (error) {
        logger.error('Error extracting nodes:', error)
    }

    return { nodes, nodeSet }
}

/**
 * Extract direct edges from add_edge calls
 */
function extractDirectEdges(code: string): { edges: ParsedEdge[], edgeCounter: number } {
    const edges: ParsedEdge[] = []
    let edgeMatch: RegexMatch
    let edgeCounter = 1

    try {
        while ((edgeMatch = REGEX_PATTERNS.DIRECT_EDGE.exec(code)) !== null) {
            if (!edgeMatch[2]) {
                logger.debug('Skipping edge match with missing arguments')
                continue
            }

            const argsString = edgeMatch[2]
            const args = extractArguments(`(${argsString})`)

            if (args.length >= 2) {
                const source = cleanIdentifier(args[0])
                const target = cleanIdentifier(args[1])

                if (!source || !target) {
                    logger.debug('Skipping edge with invalid source or target')
                    continue
                }

                const sourceNode = normalizeNodeName(source)
                const targetNode = normalizeNodeName(target)

                edges.push({
                    id: `e${edgeCounter++}`,
                    source: sourceNode,
                    target: targetNode
                })
                logger.debug(`Extracted edge: ${sourceNode} -> ${targetNode}`)
            }
        }
    } catch (error) {
        logger.error('Error extracting direct edges:', error)
    }

    return { edges, edgeCounter }
}

/**
 * Extract conditional edges from add_conditional_edges calls
 */
function extractConditionalEdges(
    code: string,
    nodes: ParsedNode[],
    nodeSet: Set<string>,
    startingEdgeCounter: number
): { edges: ParsedEdge[], edgeCounter: number } {
    const edges: ParsedEdge[] = []
    let conditionalMatch: RegexMatch
    let edgeCounter = startingEdgeCounter

    try {
        while ((conditionalMatch = REGEX_PATTERNS.CONDITIONAL_EDGE.exec(code)) !== null) {
            if (!conditionalMatch[2]) {
                logger.debug('Skipping conditional edge with missing arguments')
                continue
            }

            // Extract arguments from the captured arguments string
            const argsString = conditionalMatch[2]
            const args = extractArguments(`(${argsString})`)

            if (args.length < 3) {
                logger.debug('Skipping conditional edge with insufficient arguments')
                continue
            }

            const source = normalizeNodeName(cleanIdentifier(args[0]))
            const conditionFunction = cleanIdentifier(args[1])
            const mappingStr = args[2]

            if (!conditionFunction || !source || !mappingStr) {
                logger.debug('Skipping conditional edge with missing data')
                continue
            }

            // Add condition function node if it doesn't exist
            if (!nodeSet.has(conditionFunction)) {
                nodeSet.add(conditionFunction)
                nodes.push({
                    id: conditionFunction,
                    label: createNodeLabel(conditionFunction),
                    type: "default"
                })
            }

            // Add edge from source to condition function
            edges.push({
                id: `e${edgeCounter++}`,
                source,
                target: conditionFunction
            })

            // Parse mapping dictionary
            let mappingMatch: RegexMatch
            // Reset regex state before parsing a new mapping string
            REGEX_PATTERNS.MAPPING.lastIndex = 0
            while ((mappingMatch = REGEX_PATTERNS.MAPPING.exec(mappingStr)) !== null) {
                const condition = mappingMatch[1]
                const target = cleanIdentifier(mappingMatch[2])

                if (!condition || !target) {
                    logger.debug('Skipping mapping with missing condition or target')
                    continue
                }

                const targetNode = normalizeNodeName(target)

                edges.push({
                    id: `e${edgeCounter++}`,
                    source: conditionFunction,
                    target: targetNode,
                    label: condition,
                    animated: true
                })
            }
        }
    } catch (error) {
        logger.error('Error extracting conditional edges:', error)
    }

    return { edges, edgeCounter }
}

/**
 * Extract entry point and create START edge
 */
function extractEntryPoint(code: string, edgeCounter: number): ParsedEdge | null {
    const entryPointMatch = REGEX_PATTERNS.ENTRY_POINT.exec(code)

    if (entryPointMatch) {
        const argsString = entryPointMatch[2]
        const args = extractArguments(`(${argsString})`)

        if (args.length >= 1) {
            const entryNode = cleanIdentifier(args[0])
            logger.debug(`Extracted entry point: ${entryNode}`)

            return {
                id: `e${edgeCounter}`,
                source: "__start__",
                target: entryNode
            }
        }
    }

    return null
}

/**
 * Add special START and END nodes if referenced in edges
 */
function addSpecialNodes(nodes: ParsedNode[], edges: ParsedEdge[], nodeSet: Set<string>): void {
    const hasStart = edges.some(e => e.source === "__start__")
    const hasEnd = edges.some(e => e.target === "__end__")

    if (hasStart && !nodeSet.has("__start__")) {
        nodes.unshift({
            id: "__start__",
            label: "START",
            type: "input"
        })
    }

    if (hasEnd && !nodeSet.has("__end__")) {
        nodes.push({
            id: "__end__",
            label: "END",
            type: "output"
        })
    }
}

/**
 * Mark loop feedback edges based on layer information
 */
function markLoopFeedbackEdges(edges: ParsedEdge[], nodeLayerMap: Map<string, number>): void {
    edges.forEach(edge => {
        const sourceLayer = getNodeLayer(edge.source, nodeLayerMap)
        const targetLayer = getNodeLayer(edge.target, nodeLayerMap)

        if (sourceLayer > targetLayer) {
            edge.isLoopFeedback = true
        }
    })
}

/**
 * Parse LangGraph Python code to extract nodes and edges
 */
export function parseLangGraphCode(code: string): ParseResult {
    try {
        const parseContext = createParseContext(code)
        const processedGraph = processGraphElements(parseContext)
        const layoutResult = applyLayoutAndProcessing(processedGraph)

        return {
            nodes: layoutResult.nodes,
            edges: layoutResult.edges,
            success: true
        }
    } catch (error) {
        logger.error('Failed to parse LangGraph code:', error)
        return {
            nodes: [],
            edges: [],
            success: false,
            error: error instanceof Error ? error.message : "Unknown parsing error"
        }
    }
}

/**
 * Create initial parsing context with extracted elements
 */
function createParseContext(code: string) {
    const { nodes, nodeSet } = extractNodes(code)
    const { edges: directEdges, edgeCounter } = extractDirectEdges(code)

    return {
        code,
        nodes,
        nodeSet,
        directEdges,
        edgeCounter
    }
}

/**
 * Process all graph elements including conditional edges and entry points
 */
function processGraphElements(context: ReturnType<typeof createParseContext>) {
    const { edges: conditionalEdges, edgeCounter: finalEdgeCounter } = extractConditionalEdges(
        context.code,
        context.nodes,
        context.nodeSet,
        context.edgeCounter
    )

    const allEdges = [...context.directEdges, ...conditionalEdges]

    // Add entry point edge if exists
    const entryPointEdge = extractEntryPoint(context.code, finalEdgeCounter)
    if (entryPointEdge) {
        allEdges.push(entryPointEdge)
    }

    return {
        nodes: context.nodes,
        edges: allEdges,
        nodeSet: context.nodeSet
    }
}

/**
 * Apply layout and final processing steps
 */
function applyLayoutAndProcessing(graph: ReturnType<typeof processGraphElements>) {
    // Add special START/END nodes
    addSpecialNodes(graph.nodes, graph.edges, graph.nodeSet)

    // Layout nodes and get layer information
    const nodeLayerMap = layoutNodes(graph.nodes, graph.edges)

    // Mark loop feedback edges
    markLoopFeedbackEdges(graph.edges, nodeLayerMap)

    return {
        nodes: graph.nodes,
        edges: graph.edges
    }
}

/**
 * Layout configuration constants
 */
const LAYOUT_CONFIG = {
    HORIZONTAL_SPACING: 350,
    VERTICAL_SPACING: 200,
    CENTER_X: 500,
    START_Y: 100
} as const

/**
 * Builds adjacency map while avoiding cycles from bidirectional edges
 */
function buildAdjacencyMap(edges: ParsedEdge[]): Map<string, string[]> {
    const adjacencyMap = new Map<string, string[]>()
    const bidirectionalPairs = findBidirectionalPairs(edges)

    edges.forEach(edge => {
        const isBidirectional = bidirectionalPairs.some(pair =>
            pair.includes(edge.source) && pair.includes(edge.target)
        )

        if (!isBidirectional || edge.source < edge.target) {
            if (!adjacencyMap.has(edge.source)) {
                adjacencyMap.set(edge.source, [])
            }
            adjacencyMap.get(edge.source)!.push(edge.target)
        }
    })

    return adjacencyMap
}

/**
 * Builds node layers using BFS traversal
 */
function buildNodeLayers(
    nodes: ParsedNode[],
    adjacencyMap: Map<string, string[]>
): { [layer: number]: string[] } {
    const layers: { [layer: number]: string[] } = {}
    const visited = new Set<string>()

    // Layer 0: START nodes
    const startNodes = nodes.filter(n => n.type === "input" || n.id === "__start__")
    if (startNodes.length > 0) {
        layers[0] = startNodes.map(n => n.id)
        startNodes.forEach(n => visited.add(n.id))
    }

    // Build layers using BFS
    let currentLayer = 0
    while (Object.keys(layers).length === 0 || layers[currentLayer]?.length > 0) {
        const nextLayer = getNextLayerNodes(
            layers[currentLayer] || [],
            adjacencyMap,
            visited,
            nodes
        )

        if (nextLayer.length > 0) {
            currentLayer++
            layers[currentLayer] = nextLayer
            logger.debug(`Layer ${currentLayer}:`, nextLayer)
        } else {
            break
        }
    }

    return layers
}

/**
 * Gets nodes for the next layer in BFS traversal
 */
function getNextLayerNodes(
    currentLayerNodes: string[],
    adjacencyMap: Map<string, string[]>,
    visited: Set<string>,
    allNodes: ParsedNode[]
): string[] {
    const nextLayer: string[] = []

    // Add neighbors of current layer nodes
    currentLayerNodes.forEach(nodeId => {
        const neighbors = adjacencyMap.get(nodeId) || []
        neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
                nextLayer.push(neighbor)
                visited.add(neighbor)
            }
        })
    })

    // Handle remaining unvisited nodes
    if (nextLayer.length === 0 && visited.size < allNodes.length) {
        const remaining = allNodes.filter(n => !visited.has(n.id))
        if (remaining.length > 0) {
            const endNodes = remaining.filter(n => n.type === "output" || n.id === "__end__")
            if (endNodes.length > 0) {
                nextLayer.push(...endNodes.map(n => n.id))
                endNodes.forEach(n => visited.add(n.id))
            } else {
                nextLayer.push(remaining[0].id)
                visited.add(remaining[0].id)
            }
        }
    }

    return nextLayer
}

/**
 * Positions nodes within their assigned layers
 */
function positionNodesInLayers(
    layers: { [layer: number]: string[] },
    nodeMap: Map<string, ParsedNode>
): void {
    Object.entries(layers).forEach(([layerStr, nodeIds]) => {
        const layer = parseInt(layerStr)
        const y = layer * LAYOUT_CONFIG.VERTICAL_SPACING + LAYOUT_CONFIG.START_Y

        const sortedNodes = sortNodesByPriority(nodeIds)

        if (sortedNodes.length === 1) {
            positionSingleNode(sortedNodes[0], nodeMap, y)
        } else {
            positionMultipleNodes(sortedNodes, nodeMap, y)
        }
    })
}

/**
 * Sorts nodes by priority for consistent positioning
 */
function sortNodesByPriority(nodeIds: string[]): string[] {
    return nodeIds.sort((a, b) => {
        if (a.includes("agent")) return -1
        if (b.includes("agent")) return 1
        if (a.includes("researcher")) return -1
        if (b.includes("researcher")) return 1
        return a.localeCompare(b)
    })
}

/**
 * Positions a single node in the center of its layer
 */
function positionSingleNode(
    nodeId: string,
    nodeMap: Map<string, ParsedNode>,
    y: number
): void {
    const node = nodeMap.get(nodeId)
    if (node) {
        node.position = { x: LAYOUT_CONFIG.CENTER_X, y }
        logger.debug(`Positioned ${nodeId} at center: (${LAYOUT_CONFIG.CENTER_X}, ${y})`)
    }
}

/**
 * Positions multiple nodes horizontally across their layer
 */
function positionMultipleNodes(
    nodeIds: string[],
    nodeMap: Map<string, ParsedNode>,
    y: number
): void {
    const totalWidth = (nodeIds.length - 1) * LAYOUT_CONFIG.HORIZONTAL_SPACING
    const startX = LAYOUT_CONFIG.CENTER_X - totalWidth / 2

    nodeIds.forEach((nodeId, index) => {
        const node = nodeMap.get(nodeId)
        if (node) {
            const x = startX + index * LAYOUT_CONFIG.HORIZONTAL_SPACING
            node.position = { x, y }
            logger.debug(`Positioned ${nodeId}: (${x}, ${y})`)
        }
    })
}

/**
 * Creates a map of node IDs to their layer numbers
 */
function createNodeLayerMap(layers: { [layer: number]: string[] }): Map<string, number> {
    const nodeLayerMap = new Map<string, number>()
    Object.entries(layers).forEach(([layerStr, nodeIds]) => {
        const layer = parseInt(layerStr)
        nodeIds.forEach(nodeId => {
            nodeLayerMap.set(nodeId, layer)
        })
    })
    return nodeLayerMap
}

/**
 * Consistent flow-based layout algorithm
 */
function layoutNodes(nodes: ParsedNode[], edges: ParsedEdge[]): Map<string, number> {
    logger.debug("Starting consistent flow-based layout...")

    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const adjacencyMap = buildAdjacencyMap(edges)

    logger.debug("Adjacency map (cycle-free):", Object.fromEntries(adjacencyMap))

    const layers = buildNodeLayers(nodes, adjacencyMap)
    logger.debug("Final consistent layers:", layers)

    positionNodesInLayers(layers, nodeMap)
    logger.debug("Layout completed")

    return createNodeLayerMap(layers)
}

/**
 * Get the layer number for a given node
 */
function getNodeLayer(nodeId: string, nodeLayerMap: Map<string, number>): number {
    return nodeLayerMap.get(nodeId) || 0
}

/**
 * Find bidirectional pairs of nodes for same-layer placement
 */
function findBidirectionalPairs(edges: ParsedEdge[]): string[][] {
    const pairs: string[][] = []
    const processed = new Set<string>()

    edges.forEach(edge => {
        const reverseEdge = edges.find(e =>
            e.source === edge.target && e.target === edge.source
        )

        if (reverseEdge) {
            const pairKey = [edge.source, edge.target].sort().join('-')
            if (!processed.has(pairKey)) {
                pairs.push([edge.source, edge.target])
                processed.add(pairKey)
            }
        }
    })

    return pairs
}



/**
 * Convert parsed result to LangGraph format
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