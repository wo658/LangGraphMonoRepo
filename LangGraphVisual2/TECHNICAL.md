# Technical Documentation

## Current Implementation Analysis

### What's Working ✅

The LangGraph Playground currently provides a solid foundation with these functional components:

#### 1. Frontend Architecture
- **Next.js 15.2.4** with App Router and React 19 support
- **React 19** with concurrent features and TypeScript integration
- **TypeScript 5** with strict mode and comprehensive type checking
- **Modern UI Stack**: shadcn/ui components (50+ components) with Radix UI primitives
- **Code Editor**: Monaco Editor (latest) with Python syntax highlighting and @monaco-editor/react wrapper
- **Graph Visualization**: ReactFlow (latest) for interactive node-edge diagrams with custom components
- **Styling**: Tailwind CSS 3.4.17 with custom design system and CSS variables
- **Icons**: Lucide React 0.454.0 for consistent iconography
- **Responsive Design**: Mobile-friendly with React Resizable Panels 2.1.7
- **Internationalization**: English/Korean language support with type-safe translations
- **Theme System**: next-themes with system preference detection and Tailwind Animate

#### 2. Component Structure
```typescript
// Current working components:
├── app-header.tsx           ✅ Header with controls and branding
├── editor-settings.tsx      ✅ Configurable editor preferences
├── import-export-buttons.tsx ✅ JSON file import/export functionality
├── langgraph-visualizer.tsx ✅ ReactFlow graph rendering with drag-and-drop
├── theme-provider.tsx       ✅ Theme context management
└── language-context.tsx     ✅ Internationalization context

// Core infrastructure:
├── lib/types.ts            ✅ Comprehensive TypeScript definitions
├── lib/constants.ts        ✅ Centralized configuration values
├── lib/utils.ts           ✅ Utility functions (cn, etc.)
└── contexts/language-context.tsx ✅ i18n support
```

#### 3. State Management Architecture (Zustand Store)
```typescript
// stores/app-store.ts - Modern Zustand implementation
export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      persist((set, get) => ({
        // === Core State ===
        graph: null,
        nodes: [],
        edges: [],
        code: `# LangGraph 기본 워크플로우...`,
        
        // === Edge Editing State ===
        selectedEdgeId: null,
        editingMode: 'select',
        dragState: {
          isDragging: false,
          edgeId: null,
          endpoint: null,
          startPosition: { x: 0, y: 0 },
          currentPosition: { x: 0, y: 0 }
        },
        
        // === Actions ===
        updateGraph: (graph: LangGraph) => {
          // Convert LangGraph to ReactFlow format with collision avoidance
          const nodes = graph.nodes.map((node, index) => ({
            id: node.id,
            type: "custom",
            data: { label: node.label, nodeType: node.type },
            position: node.position || calculateNodePosition(index, graph.nodes.length),
            draggable: true,
          }))
          
          const edges = createStyledEdgesWithCollisionAvoidance(graph.edges, nodes, isDark)
          set({ graph, nodes, edges })
        },
        
        // Edge editing actions
        selectEdge: (edgeId: string | null) => set({ selectedEdgeId: edgeId }),
        startEdgeDrag: (edgeId, endpoint, position) => set({
          dragState: { isDragging: true, edgeId, endpoint, startPosition: position, currentPosition: position }
        }),
        // ... more actions
      }), {
        name: 'app-store-persist',
        partialize: (state) => ({ 
          editorSettings: state.editorSettings,
          code: state.code 
        })
      })
    ),
    { name: 'app-store' }
  )
)

// Performance-optimized selectors
export const useEdgeEditingState = () => useAppStore(state => ({
  selectedEdgeId: state.selectedEdgeId,
  editingMode: state.editingMode,
  dragState: state.dragState
}))
```

#### 4. Enhanced Graph Visualization Features
```typescript
// Enhanced features with state management integration
- Interactive drag-and-drop node positioning with ReactFlow
- Smooth animated edges with "smoothstep" styling and collision avoidance
- Real-time statistics display (node/edge count badges)
- Theme-aware background patterns and colors
- Minimap with theme-specific masking
- Edge selection with visual highlighting and drag handles
- Configurable graph layout with constants from lib/constants.ts
- State persistence across browser sessions
- Performance-optimized re-renders with selective subscriptions
```

### What's Missing ❌

#### 1. Python Code Execution Engine
**Current State**: The `handleRunCode` function in `app/page.tsx` uses hardcoded sample data
**Required**: Actual Python code parsing and execution

```typescript
// Current (Mock)
const sampleGraph = { /* hardcoded data */ }
setGraph(sampleGraph)

// Needed (Real)
const parsedGraph = await parseLangGraphCode(code)
const executionResult = await executePythonCode(code)
setGraph(parsedGraph)
```

#### 2. LangGraph Structure Analysis
**Missing Components**:
- Python AST parsing for LangGraph syntax
- Node and edge extraction from StateGraph definitions
- Conditional edge logic interpretation
- Error detection and validation

#### 3. Backend Infrastructure
**Options to Implement**:

**Option A: FastAPI Backend**
```python
# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import ast
import json

app = FastAPI()

class CodeRequest(BaseModel):
    code: str
    timeout: int = 30

@app.post("/api/execute-python")
async def execute_python(request: CodeRequest):
    try:
        # Parse Python code
        tree = ast.parse(request.code)
        
        # Extract LangGraph structure
        graph_data = extract_langgraph_structure(tree)
        
        # Execute code safely
        result = execute_in_sandbox(request.code)
        
        return {
            "success": True,
            "graph": graph_data,
            "output": result.output,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "graph": None,
            "output": None,
            "error": str(e)
        }
```

**Option B: Pyodide (Client-side)**
```typescript
// lib/python-executor.ts
import { loadPyodide } from 'pyodide'

let pyodide: any = null

export async function initializePython() {
  if (!pyodide) {
    pyodide = await loadPyodide()
    await pyodide.loadPackage(['ast', 'json'])
    // Install LangGraph if available
    // await pyodide.loadPackage(['langgraph', 'langchain'])
  }
  return pyodide
}

export async function executePythonCode(code: string) {
  const py = await initializePython()
  
  try {
    // Execute code and extract graph structure
    const result = py.runPython(`
import ast
import json

# Parse the code
tree = ast.parse('''${code}''')

# Extract LangGraph nodes and edges
# ... parsing logic here ...

json.dumps(graph_data)
    `)
    
    return JSON.parse(result)
  } catch (error) {
    throw new Error(`Python execution failed: ${error}`)
  }
}
```

## Current Project Status

### ✅ Already Implemented
- **TypeScript Configuration**: Strict mode enabled in `tsconfig.json`
- **VS Code Workspace Settings**: Configured for consistent development experience (`.vscode/settings.json`)
  - TypeScript auto-closing tags disabled (`"typescript.autoClosingTags": false`) for better control over JSX/TSX formatting
  - Ready for team-specific TypeScript and editor configurations
  - Workspace-level settings available for customization
- **shadcn/ui Integration**: Complete setup with 50+ components installed
  - All major components available: button, card, dropdown-menu, toast, alert, badge, skeleton, etc.
  - Proper configuration in `components.json` with path aliases (`@/components`, `@/lib/utils`, `@/components/ui`)
  - CSS variables integration for theming (default style with cssVariables: true)
- **Type System**: Comprehensive type definitions in `lib/types.ts`
  - Core graph types (GraphNode, GraphEdge, LangGraph)
  - Component prop interfaces
  - Editor settings and configuration types
  - Language and theme types
- **Constants Management**: Centralized configuration across multiple files
  - **`lib/constants.ts`**: Application-wide constants (editor settings, graph config, translations)
  - **`stores/store-constants.ts`**: Store-specific default values with enhanced TypeScript typing
    - Properly typed toast state with complete interface definitions
    - Consistent indentation and code formatting
    - Default values for drag state, graph statistics, and UI dialogs
- **Utility Functions**: `lib/utils.ts` with `cn()` function for class merging
- **Path Aliases**: Clean `@/*` imports configured in both `tsconfig.json` and `components.json`
- **Tailwind CSS**: Fully integrated with design system tokens and CSS variables
- **Testing Infrastructure**: Jest + React Testing Library with comprehensive mocks
  - Monaco Editor mock for testing code editor components
  - ReactFlow mock for graph visualization testing
  - Next.js router and theme provider mocks
  - Global test utilities (ResizeObserver, matchMedia)
  - Coverage threshold configuration (70% for all metrics)
  - Test path configuration for components, lib, hooks, contexts, utils, and app directories
- **Development Automation**: Kiro IDE hooks configured
  - Automatic documentation updates on source file changes
  - File pattern monitoring for TypeScript, React, and configuration files

### ✅ Recently Completed
- **Type System**: Comprehensive type definitions moved to `lib/types.ts` ✅
- **Constants**: Configuration values centralized in `lib/constants.ts` ✅
- **Testing Setup**: Jest + React Testing Library with proper mocks configured ✅
- **Code Quality**: Fixed unused imports in `import-export-buttons.tsx` ✅
- **State Management Refactor**: Major Zustand store architecture improvements ✅
  - **Persist Middleware**: Added state persistence across browser sessions for editor settings and code
  - **DevTools Integration**: Enhanced debugging capabilities with Zustand DevTools
  - **Subscription Selectors**: Fine-grained reactivity with `subscribeWithSelector` middleware
  - **Unified Edge Editing**: Integrated edge editing state directly into main app store
  - **Performance Optimization**: Typed selectors for optimal re-render performance
  - **Enhanced Utilities**: New utility functions for graph complexity calculation and node positioning

### 🚧 In Development
- **Interactive Edge Editing**: Comprehensive visual graph editing capabilities (`.kiro/specs/edge-editing/`)
  - ✅ **Unified State Management**: Centralized Zustand store with edge editing capabilities (`stores/app-store.ts`)
    - Modern Zustand patterns with persist, devtools, and subscribeWithSelector middleware
    - Integrated edge editing state directly in main app store for better performance
    - TypeScript interfaces for drag state (`DragState`) and comprehensive store typing
    - Typed selectors and actions for optimal performance and type safety
    - Selection state management for edges with automatic deselection
    - Editing mode control (select, add-node, add-edge) with mode-specific behavior
    - Drag state management with position tracking for edge endpoint modification
    - Comprehensive change tracking with timestamps and sync status
    - Performance-optimized selectors: `useEdgeEditingState()`, `useGraphActions()`, etc.
  - ✅ **Enhanced Utility Functions**: New utility functions in `lib/utils.ts`
    - `calculateComplexity()`: Graph complexity calculation based on edge-to-node ratio
    - `generateNodeId()`: Unique node ID generation with timestamp and random suffix
    - `getFlowPosition()`: ReactFlow coordinate conversion utilities
  - 🚧 Requirements defined for edge selection, modification, and deletion
  - 🚧 Drag-and-drop edge endpoint modification with EdgeHandle component
  - 🚧 Node creation and edge creation through UI controls
  - 🚧 Real-time code synchronization for all visual changes
  - 🚧 Comprehensive error handling and validation
- **Enhanced Code Editor Examples**: Comprehensive LangGraph examples feature (`.kiro/specs/code-editor-examples/`)
  - Requirements defined for bilingual (Korean/English) commented examples
  - Multiple workflow patterns planned: linear, conditional, loop-based
  - State management explanations and transformations
  - Meaningful graph structures with 4-6 nodes for effective visualization
  - Both regular and conditional edge demonstrations

### ⚠️ Still Needed
- **Code Quality Enhancement**: ESLint and Prettier rules need refinement
- **Test Coverage**: Write actual tests (currently 0% coverage, target: 70%)
- **Python Execution**: Core functionality still uses mock data

## Implementation Roadmap

### Phase 1: Foundation Setup (Week 1-2)
```bash
# 1. Development tools setup
npm install -D eslint prettier husky lint-staged
npm install -D jest @testing-library/react @testing-library/jest-dom

# 2. TypeScript strict mode
# Update tsconfig.json with strict: true

# 3. Code quality configuration
# Create .eslintrc.json, .prettierrc, jest.config.js
```

### Phase 2: Python Execution Implementation (Week 3-4)

#### Option A: Backend API Approach
```bash
# Backend setup
mkdir backend
cd backend
pip install fastapi uvicorn python-multipart
pip install langgraph langchain
pip install docker  # for sandboxing

# Frontend API client
npm install axios
# Create lib/api-client.ts
```

#### Option B: Pyodide Approach
```bash
# Client-side Python
npm install pyodide
# Create lib/python-executor.ts
```

### Phase 3: Graph Parsing Logic (Week 5-6)

**Core Requirements**:
1. **StateGraph Detection**: Identify `StateGraph` class instantiation
2. **Node Extraction**: Parse `add_node()` calls and extract node definitions
3. **Edge Analysis**: Handle both regular and conditional edges
4. **Entry Point**: Identify `set_entry_point()` calls
5. **Compilation**: Detect `compile()` calls

**Example Parser Structure**:
```typescript
// lib/langgraph-parser.ts
export interface ParsedGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  entryPoint: string
  metadata: {
    stateType: string
    hasConditionalEdges: boolean
    compiledSuccessfully: boolean
  }
}

export async function parseLangGraphCode(code: string): Promise<ParsedGraph> {
  // 1. Validate Python syntax
  // 2. Extract StateGraph definition
  // 3. Parse node definitions
  // 4. Parse edge definitions
  // 5. Handle conditional edges
  // 6. Return structured graph data
}
```

## Testing Strategy

### Current Test Coverage: 0% ❌
### Target Test Coverage: 70% ✅

#### Unit Tests
```typescript
// __tests__/lib/langgraph-parser.test.ts
describe('LangGraph Parser', () => {
  it('should parse basic StateGraph structure', () => {
    const code = `
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_function)
workflow.set_entry_point("agent")
    `
    const result = parseLangGraphCode(code)
    expect(result.nodes).toHaveLength(1)
    expect(result.entryPoint).toBe("agent")
  })
})
```

#### Integration Tests
```typescript
// __tests__/components/LangGraphVisualizer.test.tsx
describe('LangGraph Visualizer', () => {
  it('should render graph with nodes and edges', () => {
    const mockGraph = { /* test data */ }
    render(<LangGraphVisualizer graph={mockGraph} />)
    expect(screen.getByText('Agent')).toBeInTheDocument()
  })
})
```

## Performance Considerations & Optimizations

### Current Optimizations
- **Code Splitting** with dynamic imports for heavy components
- **Bundle Optimization** with Next.js built-in optimizations
- **Image Optimization** with Sharp (disabled for static export compatibility)
- **CSS Optimization** with PostCSS and Tailwind purging
- **State Management** with selective Zustand subscriptions and memoized selectors
- **Memoization** strategies for expensive computations

### Bundle Size Management
1. **Monaco Editor**: Heavy bundle size (~2MB) - loaded dynamically
2. **ReactFlow**: Large dependency for graph rendering - optimized with selective imports
3. **Component Libraries**: Tree-shaking enabled for shadcn/ui and Lucide React

### Optimization Implementation
```typescript
// Dynamic imports for heavy components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorSkeleton />
})

const ReactFlowVisualizer = dynamic(
  () => import('@/components/langgraph-visualizer'),
  { ssr: false, loading: () => <GraphSkeleton /> }
)

// Selective Zustand subscriptions for performance
export const useEdgeEditingState = () => useAppStore(state => ({
  selectedEdgeId: state.selectedEdgeId,
  editingMode: state.editingMode,
  dragState: state.dragState
}))
```

### Build Configuration Optimizations
- **Next.js Configuration**: App Router with React 19 support and static generation
- **TypeScript Configuration**: Strict mode with path aliases and build info caching
- **Tailwind Configuration**: Custom design system with dark/light mode support
- **Testing Configuration**: Jest environment optimized for React components

## Security Considerations

### Python Code Execution Risks
1. **Arbitrary Code Execution**: User can run any Python code
2. **Resource Consumption**: Infinite loops, memory exhaustion
3. **File System Access**: Potential security vulnerabilities

### Mitigation Strategies
```python
# Backend sandboxing with Docker
import docker
import tempfile
import os

def execute_in_sandbox(code: str, timeout: int = 30):
    client = docker.from_env()
    
    # Create temporary file with code
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        temp_file = f.name
    
    try:
        # Run in isolated container
        result = client.containers.run(
            'python:3.11-slim',
            f'python {temp_file}',
            timeout=timeout,
            mem_limit='128m',
            network_disabled=True,
            remove=True
        )
        return result.decode('utf-8')
    finally:
        os.unlink(temp_file)
```

## Deployment Strategy

### Development Environment
```bash
# Local development
pnpm dev  # Frontend on :3000

# If using backend option
cd backend && uvicorn main:app --reload  # Backend on :8000
```

### Production Deployment
```bash
# Frontend (Vercel/Netlify)
pnpm build
pnpm start

# Backend (if needed)
# Docker container with FastAPI
# Or serverless functions (Vercel Functions, AWS Lambda)
```

## Monitoring and Analytics

### Error Tracking
- Python execution errors
- Graph parsing failures
- UI component errors

### Performance Metrics
- Code execution time
- Graph rendering performance
- Bundle size optimization

### User Analytics
- Most used features
- Common error patterns
- Performance bottlenecks

---

This technical documentation will be updated as the implementation progresses through each phase.