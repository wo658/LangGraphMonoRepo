// Types for code generation with better error handling
export interface CodeGenerationResult {
  success: boolean
  code: string
  errors: CodeGenerationError[]
  warnings: string[]
}

export interface CodeGenerationError {
  type: 'validation' | 'generation' | 'syntax'
  message: string
  nodeId?: string
  edgeId?: string
  line?: number
}

export interface CodeGenerationOptions {
  includeComments: boolean
  indentSize: number
  validateSyntax: boolean
  generateTests: boolean
}

export interface GeneratorMetrics {
  nodeCount: number
  edgeCount: number
  conditionalEdgeCount: number
  generationTimeMs: number
}