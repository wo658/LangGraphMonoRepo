// TypeScript LangGraph code snippets
export const typescriptSnippets = {
  basic: `// Basic TypeScript LangGraph with Conditional Edges
import { StateGraph } from "langgraph"

// Define the state interface
interface WorkflowState {
  input: string
  status: "start" | "processing" | "success" | "failure"
}

// Create workflow
const workflow = new StateGraph(WorkflowState)

// Node functions
const start = async (state: WorkflowState) => {
  return { ...state, status: "processing" as const }
}

const process = async (state: WorkflowState) => {
  // Simulate processing result
  const ok = Math.random() > 0.5
  return { ...state, status: ok ? "success" as const : "failure" as const }
}

// Routing function that produces labeled conditional edges
const decide = (state: WorkflowState) => {
  if (state.status === "success") return "success"
  if (state.status === "failure") return "failure"
  return "continue"
}

// Terminal handlers
const onSuccess = async (state: WorkflowState) => state
const onFailure = async (state: WorkflowState) => state

// Build the graph
workflow.addNode("start", start)
workflow.addNode("process", process)
workflow.addNode("success", onSuccess)
workflow.addNode("failure", onFailure)

workflow.addEdge("START", "start")
workflow.addEdge("start", "process")

// Conditional edges from process (labels: success, failure, continue)
workflow.addConditionalEdges("process", decide, {
  "success": "success",
  "failure": "failure",
  "continue": "process"
})

workflow.addEdge("success", "END")
workflow.addEdge("failure", "END")

export default workflow`,

  conditional: `// TypeScript LangGraph with Conditional Routing
import { StateGraph } from "langgraph"

interface AgentState {
  task: string
  status: "pending" | "processing" | "complete" | "error"
  result?: any
}

const workflow = new StateGraph(AgentState)

// Node implementations
const initTask = async (state: AgentState) => {
  return { ...state, status: "processing" as const }
}

const processTask = async (state: AgentState) => {
  // Simulate processing
  const success = Math.random() > 0.3
  return {
    ...state,
    status: success ? "complete" as const : "error" as const,
    result: success ? "Task completed" : "Task failed"
  }
}

const handleError = async (state: AgentState) => {
  console.error("Error handling:", state)
  return { ...state, status: "error" as const }
}

const completeTask = async (state: AgentState) => {
  console.log("Task completed:", state.result)
  return state
}

// Add nodes
workflow.addNode("init", initTask)
workflow.addNode("process", processTask)
workflow.addNode("error_handler", handleError)
workflow.addNode("complete", completeTask)

// Routing function
const routeDecision = (state: AgentState) => {
  if (state.status === "error") {
    return "error"
  } else if (state.status === "complete") {
    return "success"
  }
  return "continue"
}

// Add edges
workflow.addEdge("START", "init")
workflow.addEdge("init", "process")

// Add conditional routing
workflow.addConditionalEdges("process", routeDecision, {
  "error": "error_handler",
  "success": "complete",
  "continue": "process"
})

workflow.addEdge("error_handler", "END")
workflow.addEdge("complete", "END")

export default workflow`,

 

  complexWorkflow: `// Complex TypeScript Workflow with Multiple Paths
import { StateGraph } from "langgraph"

interface WorkflowState {
  input: string
  stage: string
  analysisResult?: string
  validationResult?: boolean
  finalOutput?: string
}

const workflow = new StateGraph(WorkflowState)

// Node functions
const preprocessor = async (state: WorkflowState) => {
  return { ...state, stage: "preprocessed" }
}

const analyzer = async (state: WorkflowState) => {
  const result = \`Analysis of: \${state.input}\`
  return { ...state, stage: "analyzed", analysisResult: result }
}

const validator = async (state: WorkflowState) => {
  const isValid = state.analysisResult?.length > 0
  return { ...state, stage: "validated", validationResult: isValid }
}

const transformer = async (state: WorkflowState) => {
  return { ...state, stage: "transformed" }
}

const optimizer = async (state: WorkflowState) => {
  return { ...state, stage: "optimized" }
}

const finalizer = async (state: WorkflowState) => {
  const output = \`Final result: \${state.stage}\`
  return { ...state, stage: "complete", finalOutput: output }
}

// Add all nodes
workflow.addNode("preprocessor", preprocessor)
workflow.addNode("analyzer", analyzer)
workflow.addNode("validator", validator)
workflow.addNode("transformer", transformer)
workflow.addNode("optimizer", optimizer)
workflow.addNode("finalizer", finalizer)

// Define routing logic
const routeAfterValidation = (state: WorkflowState) => {
  return state.validationResult ? "transform" : "reanalyze"
}

// Build the graph
workflow.addEdge("START", "preprocessor")
workflow.addEdge("preprocessor", "analyzer")
workflow.addEdge("analyzer", "validator")

// Conditional routing after validation
workflow.addConditionalEdges("validator", routeAfterValidation, {
  "transform": "transformer",
  "reanalyze": "analyzer"
})

workflow.addEdge("transformer", "optimizer")
workflow.addEdge("optimizer", "finalizer")
workflow.addEdge("finalizer", "END")

// Set entry point
workflow.setEntryPoint("preprocessor")

export default workflow`,

  withLoops: `// TypeScript Workflow with Feedback Loops
import { StateGraph } from "langgraph"

interface IterativeState {
  iteration: number
  maxIterations: number
  score: number
  targetScore: number
  data: any[]
}

const workflow = new StateGraph(IterativeState)

// Node implementations
const initialize = async (state: IterativeState) => {
  return {
    ...state,
    iteration: 0,
    maxIterations: 5,
    score: 0,
    targetScore: 80,
    data: []
  }
}

const collector = async (state: IterativeState) => {
  const newData = { iteration: state.iteration, value: Math.random() * 100 }
  return {
    ...state,
    data: [...state.data, newData]
  }
}

const processor = async (state: IterativeState) => {
  const avgScore = state.data.reduce((sum, d) => sum + d.value, 0) / state.data.length
  return {
    ...state,
    score: avgScore,
    iteration: state.iteration + 1
  }
}

const evaluator = async (state: IterativeState) => {
  console.log(\`Iteration \${state.iteration}: Score = \${state.score}\`)
  return state
}

const optimizer = async (state: IterativeState) => {
  console.log("Optimizing results...")
  return { ...state, score: state.score * 1.1 }
}

// Routing functions
const checkContinue = (state: IterativeState) => {
  if (state.score >= state.targetScore) {
    return "complete"
  }
  if (state.iteration >= state.maxIterations) {
    return "optimize"
  }
  return "continue"
}

// Build graph
workflow.addNode("initialize", initialize)
workflow.addNode("collector", collector)
workflow.addNode("processor", processor)
workflow.addNode("evaluator", evaluator)
workflow.addNode("optimizer", optimizer)

// Add edges
workflow.addEdge("START", "initialize")
workflow.addEdge("initialize", "collector")
workflow.addEdge("collector", "processor")
workflow.addEdge("processor", "evaluator")

// Conditional routing with loop
workflow.addConditionalEdges("evaluator", checkContinue, {
  "continue": "collector",  // Loop back
  "optimize": "optimizer",
  "complete": "END"
})

workflow.addEdge("optimizer", "evaluator")  // Another potential loop

export default workflow`
}

// Helper function to get a random snippet
export function getRandomTypeScriptSnippet(): string {
  const snippetKeys = Object.keys(typescriptSnippets) as Array<keyof typeof typescriptSnippets>
  const randomKey = snippetKeys[Math.floor(Math.random() * snippetKeys.length)]
  return typescriptSnippets[randomKey]
}

// Helper function to detect if code is TypeScript
export function isTypeScriptCode(code: string): boolean {
  const tsPatterns = [
    /new\s+StateGraph/,
    /\.addNode\s*\(/,
    /\.addEdge\s*\(/,
    /\.addConditionalEdges\s*\(/,
    /\.setEntryPoint\s*\(/,
    /interface\s+\w+/,
    /:\s*(string|number|boolean|any|void)/,
    /const\s+\w+\s*=/,
    /=>\s*{/
  ]
  
  return tsPatterns.some(pattern => pattern.test(code))
}