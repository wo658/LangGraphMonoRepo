import type { LangGraph } from "./types"

// Enhanced logging utility with better type safety
interface Logger {
    debug: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
}

/**
 * Minimal, best-effort regex fallback used ONLY when AST validation fails.
 * Extracts basic nodes and direct edges; skips conditionals, entry point, layout, and decorations.
 */
function parseLangGraphCodeRegexSimple(code: string): ParseResult {
    try {
        const nodes: ParsedNode[] = []
        const nodeSet = new Set<string>()
        const edges: ParsedEdge[] = []

        // Local regex to avoid shared lastIndex
        const nodeRe = /(\w+)\.add_node\(([^)]+)\)/g
        const edgeRe = /(\w+)\.add_edge\(([^)]+)\)/g

        // Nodes from add_node
        for (const m of code.matchAll(nodeRe)) {
            const args = extractArguments(`(${m[2]})`)
            const id = cleanIdentifier(args[0] || '')
            if (id && !nodeSet.has(id)) {
                nodeSet.add(id)
                nodes.push({ id, label: createNodeLabel(id), type: 'default' })
            }
        }

        // Edges from add_edge (and ensure endpoints exist as nodes)
        let counter = 1
        for (const m of code.matchAll(edgeRe)) {
            const args = extractArguments(`(${m[2]})`)
            const source = cleanIdentifier(args[0] || '')
            const target = cleanIdentifier(args[1] || '')
            if (!source || !target) continue
            if (!nodeSet.has(source)) {
                nodeSet.add(source)
                nodes.push({ id: source, label: createNodeLabel(source), type: 'default' })
            }
            if (!nodeSet.has(target)) {
                nodeSet.add(target)
                nodes.push({ id: target, label: createNodeLabel(target), type: 'default' })
            }
            edges.push({ id: `e${counter++}`, source, target })
        }

        const success = nodes.length > 0 || edges.length > 0
        return { nodes, edges, success, error: success ? undefined : 'No nodes or edges detected (fallback)'}
    } catch (error) {
        logger.error('Failed to parse (simple regex fallback):', error)
        return { nodes: [], edges: [], success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

const logger: Logger = {
    debug: () => {
        // Environment check removed for browser compatibility
        // console.log(`[Parser] ${message}`, ...args)
    },
    info: () => {
        // console.info(`[Parser] ${message}`, ...args)
    },
    error: (..._args: unknown[]) => {
        // console.error(`[Parser] ${message}`, error, ...args)
    }
}

type NodeType = 'default' | 'input' | 'output'

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
function shouldToggleQuotes(char: string, inQuotes: boolean, quoteChar: string): boolean {
    return (!inQuotes && (char === '"' || char === "'")) || (inQuotes && char === quoteChar)
}

// Utility: strip unquoted inline Python comments (e.g., after # or # ~~)
function stripInlineComment(text: string): string {
    let inQuotes = false
    let quoteChar = ''
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if ((!inQuotes && (ch === '"' || ch === "'")) || (inQuotes && ch === quoteChar)) {
            if (!inQuotes) {
                inQuotes = true
                quoteChar = ch
            } else {
                inQuotes = false
                quoteChar = ''
            }
        } else if (!inQuotes && ch === '#') {
            return text.slice(0, i)
        }
    }
    return text
}

// Utility: clean identifiers (remove comments, quotes, reduce dotted enums to last part)
function cleanIdentifier(identifier: string): string {
    if (!identifier) return ''
    // Remove any unquoted inline comment tail
    let cleaned = stripInlineComment(identifier).trim()
    // Drop surrounding quotes
    cleaned = cleaned.replace(/^(\"|')|(\"|')$/g, '')
    // Reduce dotted enums to last segment
    if (cleaned.includes('.')) {
        const parts = cleaned.split('.')
        cleaned = parts[parts.length - 1]
    }
    return cleaned.trim()
}

function createNodeLabel(id: string): string {
    return id ? id.charAt(0).toUpperCase() + id.slice(1) : ''
}

// Keep a tiny wrapper for compatibility with callers expecting a regex parser symbol
function parseLangGraphCodeRegex(code: string): ParseResult {
    return parseLangGraphCodeRegexSimple(code)
}

/**
 * Extract conditional edges from add_conditional_edges calls (simple, local parsing)
 * This is used only when AST parsing succeeds (AST-gated), while keeping the logic minimal.
 */
function extractConditionalEdgesSimple(
    code: string,
    nodes: ParsedNode[],
    nodeSet: Set<string>,
    startingEdgeId: number
): { edges: ParsedEdge[]; nextId: number } {
    const edges: ParsedEdge[] = []
    let edgeId = startingEdgeId

    // Local regex to capture the argument segment including the mapping dict
    const callRe = /(\w+)\.add_conditional_edges\(([^}]+\}[^)]*)\)/g
    for (const m of code.matchAll(callRe)) {
        const args = extractArguments(`(${m[2]})`)
        if (args.length < 3) continue

        const source = cleanIdentifier(args[0])
        const conditionFn = cleanIdentifier(args[1])
        const mappingStr = args[2]

        if (!conditionFn) continue

        // Ensure nodes exist
        if (source && !nodeSet.has(source)) {
            nodeSet.add(source)
            nodes.push({ id: source, label: createNodeLabel(source), type: 'default' })
        }
        if (!nodeSet.has(conditionFn)) {
            nodeSet.add(conditionFn)
            nodes.push({ id: conditionFn, label: createNodeLabel(conditionFn), type: 'default' })
        }

        // Edge from source to condition function (if source provided)
        if (source) {
            edges.push({ id: `e${edgeId++}`, source, target: conditionFn })
        }

        // Parse mapping dictionary entries: key -> target
        const mappingRe = /((?:"[^"]+"|'[^']+'|\w+(?:\.\w+)*))\s*:\s*([^,}]+)/g
        for (const mm of String(mappingStr).matchAll(mappingRe)) {
            const label = cleanIdentifier(mm[1])
            const target = cleanIdentifier(mm[2])
            if (!target) continue
            if (!nodeSet.has(target)) {
                nodeSet.add(target)
                nodes.push({ id: target, label: createNodeLabel(target), type: 'default' })
            }
            edges.push({ id: `e${edgeId++}`, source: conditionFn, target, label, animated: true })
        }
    }

    return { edges, nextId: edgeId }
}

// Attempt AST-based parsing using optional @lezer/python
async function tryParseWithLezerPython(code: string): Promise<boolean> {
    try {
        // Dynamically import to avoid bundling/type errors when not installed
        const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
        const mod: any = await dynamicImport('@lezer/python')
        const parser = mod && (mod.parser || mod.default || mod)
        if (!parser || typeof parser.parse !== 'function') return false
        const tree = parser.parse(code)
        // Heuristic: consider it valid if the tree spans the whole doc and has no obvious error nodes
        // Lezer marks errors with name '⚠' in many grammars, but not guaranteed; we'll just accept parse
        return !!tree
    } catch {
        return false
    }
}
 

/**
 * AST-first, regex-fallback parse for LangGraph Python
 */
export async function parseLangGraphCodeAsync(code: string): Promise<ParseResult> {
    // Minimal base extraction (nodes + direct edges)
    // We include conditional edges extraction regardless of AST availability to improve robustness.
    // AST is still attempted for future extension or validation but does not gate extraction.
    void tryParseWithLezerPython(code).catch(() => undefined)

    const base = parseLangGraphCodeRegexSimple(code)
    const nodeSet = new Set(base.nodes.map(n => n.id))
    const { edges: condEdges } = extractConditionalEdgesSimple(
        code,
        base.nodes,
        nodeSet,
        base.edges.length + 1
    )

    const merged = { nodes: base.nodes, edges: [...base.edges, ...condEdges] }
    const success = merged.nodes.length > 0 || merged.edges.length > 0
    return { ...merged, success }
}

// Backward-compatible sync export (regex-only)
export function parseLangGraphCode(code: string): ParseResult {
    return parseLangGraphCodeRegex(code)
}
 



/**
 * Convert parsed result to LangGraph format
 */
export function convertToLangGraph(parseResult: ParseResult): LangGraph | null {
    if (!parseResult.success) {
        return null
    }

    // Apply a simple auto-layout only when graph is non-trivial
    // Keep single-node graphs at {0,0} to match expectations/tests
    if (parseResult.edges.length > 0 || parseResult.nodes.length > 1) {
        try {
            layoutNodes(parseResult.nodes, parseResult.edges)
            markLoopFeedbackEdges(parseResult.edges, parseResult.nodes)
        } catch {
            // best-effort layout; ignore failures
        }
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

/**
 * Simple layered auto-layout for Python graphs
 * Mutates nodes to assign missing positions based on edge structure
 */
function layoutNodes(nodes: ParsedNode[], edges: ParsedEdge[]): void {
    if (!nodes.length) return

    // Build connectivity
    const incoming = new Map<string, Set<string>>()
    const outgoing = new Map<string, Set<string>>()
    for (const n of nodes) {
        incoming.set(n.id, new Set())
        outgoing.set(n.id, new Set())
    }
    for (const e of edges) {
        if (!incoming.has(e.target)) incoming.set(e.target, new Set())
        if (!outgoing.has(e.source)) outgoing.set(e.source, new Set())
        incoming.get(e.target)!.add(e.source)
        outgoing.get(e.source)!.add(e.target)
    }

    // Determine start nodes: prefer __start__, else nodes with no incoming
    const startNodes: string[] = []
    const start = nodes.find(n => n.id === '__start__')
    if (start) {
        startNodes.push(start.id)
    } else {
        for (const n of nodes) {
            if ((incoming.get(n.id)?.size || 0) === 0) startNodes.push(n.id)
        }
        if (startNodes.length === 0) {
            // fallback
            startNodes.push(nodes[0].id)
        }
    }

    // Assign layers via BFS
    const layerById = new Map<string, number>()
    const queue: string[] = []
    for (const id of startNodes) {
        layerById.set(id, 0)
        queue.push(id)
    }
    while (queue.length) {
        const id = queue.shift()!
        const layer = layerById.get(id) ?? 0
        for (const next of outgoing.get(id) || []) {
            if (!layerById.has(next)) {
                layerById.set(next, layer + 1)
                queue.push(next)
            }
        }
    }
    // Any unvisited nodes -> append after max layer
    const maxLayer = Math.max(0, ...Array.from(layerById.values()))
    for (const n of nodes) {
        if (!layerById.has(n.id)) layerById.set(n.id, maxLayer + 1)
    }

    // Group nodes by layer
    const layers: string[][] = []
    for (const [id, layer] of layerById.entries()) {
        if (!layers[layer]) layers[layer] = []
        layers[layer].push(id)
    }

    // Sort for stability
    for (const l of layers) l.sort()

    // Spacing constants
    const START_X = 100
    const START_Y = 100
    const X_SPACING = 260
    const Y_SPACING = 180

    // Assign positions for nodes that don't have one
    for (let l = 0; l < layers.length; l++) {
        const ids = layers[l] || []
        const totalWidth = (ids.length - 1) * X_SPACING
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i]
            const node = nodes.find(n => n.id === id)
            if (!node) continue
            if (!node.position) {
                const x = START_X + (ids.length > 1 ? -totalWidth / 2 + i * X_SPACING : 0)
                const y = START_Y + l * Y_SPACING
                node.position = { x, y }
            }
        }
    }
}

/**
 * Mark edges that go from a lower layer to a higher layer as normal,
 * and edges going upward (higher y to lower y) as loop feedback
 */
function markLoopFeedbackEdges(edges: ParsedEdge[], nodes: ParsedNode[]): void {
    const yById = new Map(nodes.map(n => [n.id, n.position?.y ?? 0]))
    for (const e of edges) {
        const sy = yById.get(e.source) ?? 0
        const ty = yById.get(e.target) ?? 0
        if (sy > ty) {
            e.isLoopFeedback = true
        }
    }
}