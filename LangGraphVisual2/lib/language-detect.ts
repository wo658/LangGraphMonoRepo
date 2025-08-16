// Centralized language detection utility
// Detects 'python' | 'typescript' | 'javascript'

// Basic JavaScript patterns (when TS types aren’t present)
const jsPatterns: RegExp[] = [
  /\bfunction\s+\w+\s*\(/,
  /\b(const|let|var)\s+\w+\s*=/,
  /=>\s*\{/,
  /console\.(log|error|warn)\s*\(/,
  /require\s*\(/,
]

// Basic Python patterns targeting LangGraph examples and general Python code
const pyPatterns: RegExp[] = [
  /\bdef\s+\w+\s*\(/,
  /\bclass\s+\w+\s*\(/,
  /\bimport\s+\w+/, 
  /\bfrom\s+\w+\s+import\b/,
  /\badd_node\b|\badd_edge\b|\badd_conditional_edges\b/,
  /\bStateGraph\b/,
]

export function detectLanguage(code: string): 'python' | 'typescript' | 'javascript' {
  const snippet = code.slice(0, 50_000) // limit to avoid pathological cases

  // 1) TypeScript patterns
  const tsPatterns: RegExp[] = [
    /:\s*(string|number|boolean|object|any|unknown|void|never|null|undefined)\b/,
    /\binterface\s+\w+\b/,
    /\btype\s+\w+\s*=\b/,
    /\benum\s+\w+\b/,
    /<\w+>/, // generic
    /\bas\s+\w+\b/, // type assertion
    /\bimplements\s+\w+\b/,
  ]
  const tsScore = tsPatterns.reduce((s, r) => s + (r.test(snippet) ? 1 : 0), 0)
  if (tsScore > 0) return 'typescript'

  // 2) JS patterns
  const jsScore = jsPatterns.reduce((s, r) => s + (r.test(snippet) ? 1 : 0), 0)

  // 3) Python patterns
  const pyScore = pyPatterns.reduce((s, r) => s + (r.test(snippet) ? 1 : 0), 0)

  if (pyScore >= jsScore) return 'python'
  return 'javascript'
}
