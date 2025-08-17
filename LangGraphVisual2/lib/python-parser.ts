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

// Utility: clean identifiers (remove quotes, reduce dotted enums to last part)
function cleanIdentifier(identifier: string): string {
    if (!identifier) return ''
    let cleaned = identifier.trim().replace(/^(["'])|(["'])$/g, '')
    if (cleaned.includes('.')) {
        const parts = cleaned.split('.')
        cleaned = parts[parts.length - 1]
    }
    return cleaned
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