import type { ParseResult, ParsedNode, ParsedEdge } from "./python-parser"
import type { LangGraph } from "./types"
import * as ts from "typescript"

// Enhanced logging utility
const logger = {
    debug: (..._args: unknown[]) => {
        // console.log(`[TS Parser]`, ...args)
    },
    error: (..._args: unknown[]) => {
        // console.error(`[TS Parser]`, ...args)
    }
}

 

// ============ AST Utilities (for AST-first parsing) ============
function createSourceFile(code: string): ts.SourceFile {
    return ts.createSourceFile("input.ts", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function isStringLiteralLike(n: ts.Node): n is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
    return ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)
}

function sanitizeTemplateText(text: string): string {
    const noTicks = text.replace(/^`|`$/g, "")
    return noTicks.replace(/\$\{[^}]+\}/g, "var")
}

function propertyNameToString(name: ts.PropertyName): string {
    if (ts.isIdentifier(name)) return name.text
    if (isStringLiteralLike(name)) return name.text
    if (ts.isPrivateIdentifier(name)) return name.text
    if (ts.isComputedPropertyName(name)) {
        const e = name.expression
        if (ts.isIdentifier(e)) return e.text
        if (ts.isPropertyAccessExpression(e)) return e.name.text
        return e.getText()
    }
    return name.getText()
}

function exprToIdentifier(expr: ts.Expression): string {
    if (isStringLiteralLike(expr)) return cleanIdentifier(expr.text)
    if (ts.isIdentifier(expr)) return cleanIdentifier(expr.text)
    if (ts.isPropertyAccessExpression(expr)) return cleanIdentifier(expr.name.text)
    if (ts.isTemplateExpression(expr)) return cleanIdentifier(sanitizeTemplateText(expr.getText()))
    if (ts.isNoSubstitutionTemplateLiteral(expr)) return cleanIdentifier(expr.text)
    return cleanIdentifier(expr.getText())
}

function getCallName(call: ts.CallExpression): string | null {
    const e = call.expression
    if (ts.isPropertyAccessExpression(e)) return e.name.text
    if (ts.isIdentifier(e)) return e.text
    return null
}

function traverse(node: ts.Node, cb: (n: ts.Node) => void) {
    cb(node)
    node.forEachChild(child => traverse(child, cb))
}

// TypeScript LangGraph patterns
const TS_PATTERNS = {
    // const workflow = new StateGraph(State)
    STATE_GRAPH: /(?:const|let|var)\s+(\w+)\s*=\s*new\s+StateGraph\s*\(/g,
    
    // workflow.addNode("agent", agentFunction) or addNode(WorkflowNodes.AGENT, ...)
    ADD_NODE: /(\w+)\.addNode\s*\(\s*((?:"[^"]+"|'[^']+'|`[^`]+`)|\w+(?:\.\w+)*)\s*,?\s*[^)]*\)/g,
    // workflow.addNode(variable)
    ADD_NODE_SINGLE: /(\w+)\.addNode\s*\(\s*(\w+(?:\.\w+)*)\s*\)/g,
    
    // workflow.addEdge("agent", "researcher") or addEdge(WorkflowNodes.AGENT, WorkflowNodes.RESEARCHER)
    ADD_EDGE: /(\w+)\.addEdge\s*\(\s*((?:"[^"]+"|'[^']+'|`[^`]+`)|\w+(?:\.\w+)*)\s*,\s*((?:"[^"]+"|'[^']+'|`[^`]+`)|\w+(?:\.\w+)*)\s*\)/g,
    
    // workflow.addConditionalEdges("agent", condition, { ... }) or enum-like source
    ADD_CONDITIONAL: /(\w+)\.addConditionalEdges\s*\(\s*((?:"[^"]+"|'[^']+'|`[^`]+`)|\w+(?:\.\w+)*)\s*,\s*([^,]+),\s*\{([^}]+)\}/g,
    
    // workflow.setEntryPoint("agent") or enum-like
    SET_ENTRY: /(\w+)\.setEntryPoint\s*\(\s*((?:"[^"]+"|'[^']+'|`[^`]+`)|\w+(?:\.\w+)*)\s*\)/g,
    
    // START, END constants
    START_END: /(?:START|END|REACT_AGENT_BEGIN|REACT_AGENT_END)/g,
    
    // Object mapping for conditional edges: "continue": "researcher" or RouteDecision.CONTINUE: WorkflowNodes.RESEARCHER
    MAPPING: /((?:"[^"]+"|'[^']+'|`[^`]+`|\w+(?:\.\w+)*))\s*:\s*((?:"[^"]+"|'[^']+'|`[^`]+`|\w+(?:\.\w+)*))/g,
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

    // Handle enum-like dotted identifiers: WorkflowNodes.EXTRACT_INFO -> EXTRACT_INFO
    if (cleaned.includes('.')) {
        const parts = cleaned.split('.')
        cleaned = parts[parts.length - 1]
    }
    
    return cleaned
}

/**
 * ===== AST-based extractors =====
 */
function extractNodesAST(sourceFile: ts.SourceFile): { nodes: ParsedNode[], nodeSet: Set<string> } {
    const nodes: ParsedNode[] = []
    const nodeSet = new Set<string>()
    const varToNode: Record<string, { id: string, name?: string }> = {}

    // Collect variable -> {id, name} when object literal has id/name
    traverse(sourceFile, (n) => {
        if (ts.isVariableDeclaration(n) && n.name && ts.isIdentifier(n.name) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
            const varName = n.name.text
            let id: string | undefined
            let name: string | undefined
            n.initializer.properties.forEach(p => {
                if (ts.isPropertyAssignment(p)) {
                    const key = propertyNameToString(p.name)
                    if (key === 'id' && p.initializer && isStringLiteralLike(p.initializer)) id = cleanIdentifier(p.initializer.text)
                    if (key === 'name' && p.initializer && isStringLiteralLike(p.initializer)) name = cleanIdentifier(p.initializer.text)
                }
            })
            if (varName && id) varToNode[varName] = { id, name }
        }
    })

    // addNode(<id or var>)
    traverse(sourceFile, (n) => {
        if (!ts.isCallExpression(n)) return
        const callName = getCallName(n)
        if (callName !== 'addNode') return
        const args = n.arguments
        if (args.length < 1) return
        const first = args[0]

        let nodeId: string | undefined
        let label: string | undefined
        if (ts.isIdentifier(first)) {
            const v = varToNode[first.text]
            if (v) { nodeId = v.id; label = v.name }
            else nodeId = exprToIdentifier(first)
        } else {
            nodeId = exprToIdentifier(first)
        }

        if (nodeId && !nodeSet.has(nodeId)) {
            nodeSet.add(nodeId)
            const finalLabel = label || (nodeId.charAt(0).toUpperCase() + nodeId.slice(1))
            nodes.push({ id: nodeId, label: finalLabel, type: 'default' })
        }
    })

    return { nodes, nodeSet }
}

function extractDirectEdgesAST(sourceFile: ts.SourceFile): ParsedEdge[] {
    const edges: ParsedEdge[] = []
    let edgeCounter = 1

    // addEdge(source, target)
    traverse(sourceFile, (n) => {
        if (!ts.isCallExpression(n)) return
        const callName = getCallName(n)
        if (callName !== 'addEdge') return
        const args = n.arguments
        if (args.length < 2) return
        const source = exprToIdentifier(args[0])
        const target = exprToIdentifier(args[1])
        if (source && target) edges.push({ id: `e${edgeCounter++}`, source, target })
    })

    // literal objects with from/to or source/target
    traverse(sourceFile, (n) => {
        if (!ts.isObjectLiteralExpression(n)) return
        let fromExpr: ts.Expression | undefined
        let toExpr: ts.Expression | undefined
        n.properties.forEach(p => {
            if (!ts.isPropertyAssignment(p)) return
            const key = propertyNameToString(p.name)
            if (key === 'from' || key === 'source') fromExpr = p.initializer
            if (key === 'to' || key === 'target') toExpr = p.initializer
        })
        if (fromExpr && toExpr) {
            const source = exprToIdentifier(fromExpr)
            const target = exprToIdentifier(toExpr)
            if (source && target) edges.push({ id: `e${edgeCounter++}`, source, target })
        }
    })

    return edges
}

function extractConditionalEdgesAST(
    sourceFile: ts.SourceFile,
    nodes: ParsedNode[],
    nodeSet: Set<string>
): ParsedEdge[] {
    const edges: ParsedEdge[] = []
    let edgeCounter = 100

    traverse(sourceFile, (n) => {
        if (!ts.isCallExpression(n)) return
        const callName = getCallName(n)
        if (callName !== 'addConditionalEdges') return
        const args = n.arguments
        if (args.length < 3) return

        const source = exprToIdentifier(args[0])
        const conditionArg = args[1]
        const mappingArg = args[2]
        if (!source || !mappingArg || !ts.isObjectLiteralExpression(mappingArg)) return

        let conditionLabel = 'Condition'
        if (ts.isIdentifier(conditionArg)) conditionLabel = conditionArg.text
        else if (ts.isPropertyAccessExpression(conditionArg)) conditionLabel = conditionArg.name.text

        const conditionNodeId = `${source}_condition`
        if (!nodeSet.has(conditionNodeId)) {
            nodeSet.add(conditionNodeId)
            nodes.push({ id: conditionNodeId, label: conditionLabel || 'Condition', type: 'default' })
        }
        edges.push({ id: `e${edgeCounter++}`, source, target: conditionNodeId })

        mappingArg.properties.forEach(prop => {
            if (!ts.isPropertyAssignment(prop)) return
            const key = propertyNameToString(prop.name)
            const condition = cleanIdentifier(key)
            const target = exprToIdentifier(prop.initializer as ts.Expression)
            if (condition && target) {
                edges.push({ id: `e${edgeCounter++}`, source: conditionNodeId, target, label: condition, animated: true })
            }
        })
    })

    return edges
}

function extractEntryPointAST(sourceFile: ts.SourceFile): ParsedEdge | null {
    let result: ParsedEdge | null = null
    traverse(sourceFile, (n) => {
        if (result) return
        if (!ts.isCallExpression(n)) return
        const callName = getCallName(n)
        if (callName !== 'setEntryPoint') return
        const args = n.arguments
        if (args.length < 1) return
        const entryNode = exprToIdentifier(args[0])
        if (entryNode) result = { id: 'e_entry', source: '__start__', target: entryNode }
    })
    return result
}

/**
 * Extract nodes from TypeScript code
 */
function extractNodes(code: string): { nodes: ParsedNode[], nodeSet: Set<string> } {
    const nodes: ParsedNode[] = []
    const nodeSet = new Set<string>()
    let match: RegExpExecArray | null
    
    // Build a map from variable name -> { id, name }
    const varToNode: Record<string, { id: string, name?: string }> = {}
    try {
        const declRegex = /(?:const|let|var)\s+(\w+)[^=]*=\s*\{[^}]*\bid\s*:\s*("[^"]+"|'[^']+'|`[^`]+`)[^}]*?(?:\bname\s*:\s*("[^"]+"|'[^']+'|`[^`]+`))?[^}]*\}/g
        let dMatch: RegExpExecArray | null
        while ((dMatch = declRegex.exec(code)) !== null) {
            const varName = dMatch[1]
            const id = cleanIdentifier(dMatch[2])
            const name = dMatch[3] ? cleanIdentifier(dMatch[3]) : undefined
            if (varName && id) {
                varToNode[varName] = { id, name }
            }
        }
    } catch { /* noop */ }
    
    // Reset regex
    TS_PATTERNS.ADD_NODE.lastIndex = 0
    
    while ((match = TS_PATTERNS.ADD_NODE.exec(code)) !== null) {
        const rawArg = match[2].trim()
        const varInfo = varToNode[rawArg]
        const nodeId = varInfo ? varInfo.id : cleanIdentifier(rawArg)
        if (nodeId && !nodeSet.has(nodeId)) {
            nodeSet.add(nodeId)
            const label = varInfo?.name || (nodeId.charAt(0).toUpperCase() + nodeId.slice(1))
            nodes.push({ id: nodeId, label, type: "default" })
            logger.debug(`Found node via addNode: ${nodeId}`)
        }
    }
    
    return { nodes, nodeSet }
}

/**
 * Extract direct edges from TypeScript code
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
    // Also support literal arrays of edges: [{ from: 'a', to: 'b' }, ...]
    // and variants using source/target keys
    try {
        const objectEdgeRegex = /\{[^}]*\b(?:from|source)\s*:\s*("[^"]+"|'[^']+'|`[^`]+`)[^}]*\b(?:to|target)\s*:\s*("[^"]+"|'[^']+'|`[^`]+`)[^}]*\}/g
        let objMatch: RegExpExecArray | null
        while ((objMatch = objectEdgeRegex.exec(code)) !== null) {
            const objStr = objMatch[0]
            const fromMatch = /(from|source)\s*:\s*("[^"]+"|'[^']+'|`[^`]+`)/.exec(objStr)
            const toMatch = /(to|target)\s*:\s*("[^"]+"|'[^']+'|`[^`]+`)/.exec(objStr)
            const rawFrom = fromMatch?.[2] || ''
            const rawTo = toMatch?.[2] || ''
            const source = cleanIdentifier(rawFrom)
            const target = cleanIdentifier(rawTo)
            if (source && target) {
                edges.push({ id: `e${edgeCounter++}`, source, target })
                logger.debug(`Found literal edge: ${source} -> ${target}`)
            }
        }
    } catch { /* noop */ }

    return edges
}

/**
 * Extract conditional edges from TypeScript code
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
            const condition = cleanIdentifier(mappingMatch[1])
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
 * Extract entry point from TypeScript code
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
 * Parse via AST (primary)
 */
function parseTypeScriptCodeAST(code: string): ParseResult {
    try {
        logger.debug('AST: Starting TypeScript parsing...')
        const sf = createSourceFile(code)

        const { nodes, nodeSet } = extractNodesAST(sf)
        const directEdges = extractDirectEdgesAST(sf)
        const conditionalEdges = extractConditionalEdgesAST(sf, nodes, nodeSet)

        const allEdges = [...directEdges, ...conditionalEdges]
        const entryEdge = extractEntryPointAST(sf)
        if (entryEdge) allEdges.push(entryEdge)

        addSpecialNodes(nodes, allEdges, nodeSet)
        layoutNodes(nodes, allEdges)
        markLoopFeedbackEdges(allEdges, nodes)

        return { nodes, edges: allEdges, success: true }
    } catch (error) {
        logger.error('AST parse failed:', error)
        return { nodes: [], edges: [], success: false, error: error instanceof Error ? error.message : 'Unknown AST parsing error' }
    }
}

/**
 * Parse via regex (fallback)
 */
function parseTypeScriptCodeRegex(code: string): ParseResult {
    try {
        logger.debug('Regex: Starting TypeScript parsing...')
        
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
        
        return {
            nodes,
            edges: allEdges,
            success: true
        }
    } catch (error) {
        logger.error('Regex parse failed:', error)
        return { nodes: [], edges: [], success: false, error: error instanceof Error ? error.message : 'Unknown regex parsing error' }
    }
}

/**
 * Parse TypeScript LangGraph code.
 * For consistency with the Python parser, we attempt an AST parse opportunistically
 * (for validation/telemetry), but we always build the final result from the regex parser.
 */
export function parseTypeScriptCode(code: string): ParseResult {
    try {
        // Best-effort AST parse (ignore result to keep behavior consistent with Python parser)
        void parseTypeScriptCodeAST(code)
    } catch {
        // Ignore AST errors
    }

    // Always return regex-based extraction to keep behavior predictable and aligned with Python
    return parseTypeScriptCodeRegex(code)
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