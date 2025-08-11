# Design Document

## Overview

This design enhances the LangGraph Playground's code editor with comprehensive example code featuring detailed bilingual comments and improved initial user experience. The solution focuses on providing educational examples that demonstrate various LangGraph patterns while creating meaningful visualizations.

## Architecture

### Component Structure
```
app/page.tsx (Modified)
├── Enhanced initial code state with comprehensive example
├── Improved code comments (Korean/English)
└── Better default workflow demonstration

utils/python-snippets.ts (Enhanced)
├── Expanded example templates
├── Bilingual comment system
└── Multiple workflow patterns

lib/example-workflows.ts (New)
├── Comprehensive example definitions
├── Comment generation utilities
└── Template management system
```

### Data Flow
```
User loads application
    ↓
Load default comprehensive example
    ↓
Display in Monaco Editor with syntax highlighting
    ↓
User runs code
    ↓
Python parser extracts graph structure
    ↓
ReactFlow renders meaningful visualization
```

## Components and Interfaces

### Enhanced Initial Code State
```typescript
// app/page.tsx - Enhanced useState initialization
const [code, setCode] = useState(getDefaultExampleCode())

// New function to provide comprehensive example
function getDefaultExampleCode(): string {
  return generateBilingualExample({
    type: 'comprehensive',
    language: currentLanguage,
    includeComments: true
  })
}
```

### Example Workflow System
```typescript
// lib/example-workflows.ts
export interface WorkflowExample {
  id: string
  title: { ko: string; en: string }
  description: { ko: string; en: string }
  code: string
  nodeCount: number
  edgeCount: number
  hasConditionalEdges: boolean
  hasLoops: boolean
}

export interface CommentConfig {
  language: 'ko' | 'en'
  includeStateExplanation: boolean
  includeNodeExplanation: boolean
  includeEdgeExplanation: boolean
  includeVisualizationTips: boolean
}

export function generateBilingualExample(config: {
  type: 'basic' | 'comprehensive' | 'conditional' | 'loop'
  language: 'ko' | 'en'
  includeComments: boolean
}): string
```

### Enhanced Python Snippets
```typescript
// utils/python-snippets.ts - Enhanced structure
export const workflowExamples = {
  comprehensive: {
    title: { ko: '종합 워크플로우 예제', en: 'Comprehensive Workflow Example' },
    code: generateComprehensiveExample(),
    features: ['multiple_nodes', 'conditional_edges', 'state_management', 'loops']
  },
  
  linear: {
    title: { ko: '선형 워크플로우', en: 'Linear Workflow' },
    code: generateLinearExample(),
    features: ['sequential_nodes', 'simple_state']
  },
  
  conditional: {
    title: { ko: '조건부 워크플로우', en: 'Conditional Workflow' },
    code: generateConditionalExample(),
    features: ['conditional_edges', 'decision_nodes']
  },
  
  loop: {
    title: { ko: '반복 워크플로우', en: 'Loop Workflow' },
    code: generateLoopExample(),
    features: ['cycles', 'iteration_control']
  }
}
```

## Data Models

### Example Code Structure
```python
# Comprehensive example with detailed comments
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, START, END

# 상태 정의 / State Definition
# 워크플로우 전체에서 사용될 데이터 구조를 정의합니다
# Define the data structure that will be used throughout the workflow
class WorkflowState(TypedDict):
    # 사용자 입력 / User input
    user_input: str
    
    # 처리된 데이터 / Processed data
    processed_data: dict
    
    # 현재 단계 / Current step
    current_step: str
    
    # 결과 / Results
    results: list
    
    # 오류 정보 / Error information
    error: str

# 노드 함수들 / Node Functions
# 각 노드는 상태를 받아서 수정된 상태를 반환합니다
# Each node receives state and returns modified state

def input_processor(state: WorkflowState) -> WorkflowState:
    """
    입력 처리 노드 / Input Processing Node
    사용자 입력을 검증하고 전처리합니다
    Validates and preprocesses user input
    """
    # 입력 검증 로직 / Input validation logic
    processed_input = state["user_input"].strip().lower()
    
    return {
        **state,
        "processed_data": {"input": processed_input},
        "current_step": "input_processed"
    }

def data_analyzer(state: WorkflowState) -> WorkflowState:
    """
    데이터 분석 노드 / Data Analysis Node
    처리된 데이터를 분석합니다
    Analyzes the processed data
    """
    # 분석 로직 / Analysis logic
    analysis_result = {
        "length": len(state["processed_data"]["input"]),
        "type": "text_analysis"
    }
    
    return {
        **state,
        "processed_data": {**state["processed_data"], "analysis": analysis_result},
        "current_step": "data_analyzed"
    }

def decision_maker(state: WorkflowState) -> WorkflowState:
    """
    의사결정 노드 / Decision Making Node
    분석 결과를 바탕으로 다음 단계를 결정합니다
    Determines next steps based on analysis results
    """
    analysis = state["processed_data"]["analysis"]
    
    if analysis["length"] > 10:
        decision = "complex_processing"
    else:
        decision = "simple_processing"
    
    return {
        **state,
        "processed_data": {**state["processed_data"], "decision": decision},
        "current_step": "decision_made"
    }

def complex_processor(state: WorkflowState) -> WorkflowState:
    """
    복잡한 처리 노드 / Complex Processing Node
    복잡한 데이터에 대한 고급 처리를 수행합니다
    Performs advanced processing for complex data
    """
    result = f"Complex processing completed for: {state['processed_data']['input']}"
    
    return {
        **state,
        "results": [result],
        "current_step": "complex_processed"
    }

def simple_processor(state: WorkflowState) -> WorkflowState:
    """
    간단한 처리 노드 / Simple Processing Node
    간단한 데이터에 대한 기본 처리를 수행합니다
    Performs basic processing for simple data
    """
    result = f"Simple processing completed for: {state['processed_data']['input']}"
    
    return {
        **state,
        "results": [result],
        "current_step": "simple_processed"
    }

def result_formatter(state: WorkflowState) -> WorkflowState:
    """
    결과 포맷팅 노드 / Result Formatting Node
    최종 결과를 사용자에게 표시할 형태로 포맷팅합니다
    Formats final results for user display
    """
    formatted_result = {
        "final_output": state["results"][0],
        "processing_type": state["processed_data"]["decision"],
        "timestamp": "2024-01-01T00:00:00Z"
    }
    
    return {
        **state,
        "results": [formatted_result],
        "current_step": "completed"
    }

# 조건부 엣지 함수 / Conditional Edge Function
def route_processing(state: WorkflowState) -> Literal["complex_processor", "simple_processor"]:
    """
    처리 경로 결정 / Processing Route Decision
    의사결정 결과에 따라 다음 노드를 선택합니다
    Selects next node based on decision results
    """
    decision = state["processed_data"]["decision"]
    
    if decision == "complex_processing":
        return "complex_processor"
    else:
        return "simple_processor"

# 워크플로우 그래프 구성 / Workflow Graph Construction
# StateGraph를 생성하고 노드와 엣지를 추가합니다
# Create StateGraph and add nodes and edges

workflow = StateGraph(WorkflowState)

# 노드 추가 / Add Nodes
# 각 노드는 고유한 이름과 함수를 가집니다
# Each node has a unique name and function
workflow.add_node("input_processor", input_processor)
workflow.add_node("data_analyzer", data_analyzer)
workflow.add_node("decision_maker", decision_maker)
workflow.add_node("complex_processor", complex_processor)
workflow.add_node("simple_processor", simple_processor)
workflow.add_node("result_formatter", result_formatter)

# 엣지 추가 / Add Edges
# 노드 간의 연결을 정의합니다
# Define connections between nodes

# 시작점 설정 / Set entry point
workflow.add_edge(START, "input_processor")

# 순차적 엣지 / Sequential edges
workflow.add_edge("input_processor", "data_analyzer")
workflow.add_edge("data_analyzer", "decision_maker")

# 조건부 엣지 / Conditional edges
# 의사결정 노드에서 처리 타입에 따라 분기
# Branch from decision node based on processing type
workflow.add_conditional_edges(
    "decision_maker",
    route_processing,
    {
        "complex_processor": "complex_processor",
        "simple_processor": "simple_processor"
    }
)

# 처리 완료 후 결과 포맷팅으로 수렴 / Converge to result formatting after processing
workflow.add_edge("complex_processor", "result_formatter")
workflow.add_edge("simple_processor", "result_formatter")

# 종료점 설정 / Set end point
workflow.add_edge("result_formatter", END)

# 그래프 컴파일 / Compile Graph
# 워크플로우를 실행 가능한 형태로 컴파일합니다
# Compile workflow into executable form
graph = workflow.compile()

# 사용 예제 / Usage Example
# 이 코드는 실제로는 실행되지 않지만 사용법을 보여줍니다
# This code won't actually run but shows usage
"""
# 워크플로우 실행 / Execute workflow
result = graph.invoke({
    "user_input": "Hello LangGraph Playground!",
    "processed_data": {},
    "current_step": "start",
    "results": [],
    "error": ""
})

print("Final result:", result)
"""
```

## Error Handling

### Code Validation
- Syntax error detection and user-friendly messages
- LangGraph structure validation
- State type checking

### Example Loading
- Fallback to basic example if comprehensive example fails
- Graceful degradation for missing templates
- Error recovery with default code

## Graph Layout Optimization

### Automatic Layout Selection
The system will automatically choose between horizontal and vertical node arrangements to create the most square-like bounding rectangle for optimal visualization.

```typescript
// lib/graph-layout.ts - New layout optimization system
interface LayoutDimensions {
  width: number
  height: number
  aspectRatio: number
  area: number
}

interface NodePosition {
  x: number
  y: number
}

export function optimizeGraphLayout(nodes: GraphNode[]): GraphNode[] {
  // Calculate horizontal layout
  const horizontalLayout = calculateHorizontalLayout(nodes)
  const horizontalDimensions = calculateBoundingBox(horizontalLayout)
  
  // Calculate vertical layout  
  const verticalLayout = calculateVerticalLayout(nodes)
  const verticalDimensions = calculateBoundingBox(verticalLayout)
  
  // Choose layout with aspect ratio closest to 1 (most square-like)
  const horizontalSquareness = Math.abs(1 - horizontalDimensions.aspectRatio)
  const verticalSquareness = Math.abs(1 - verticalDimensions.aspectRatio)
  
  return horizontalSquareness < verticalSquareness 
    ? horizontalLayout 
    : verticalLayout
}

function calculateHorizontalLayout(nodes: GraphNode[]): GraphNode[] {
  // Arrange nodes horizontally with proper spacing
  const HORIZONTAL_SPACING = 200
  const BASE_Y = 100
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: index * HORIZONTAL_SPACING + 100,
      y: BASE_Y
    }
  }))
}

function calculateVerticalLayout(nodes: GraphNode[]): GraphNode[] {
  // Arrange nodes vertically with proper spacing
  const VERTICAL_SPACING = 150
  const BASE_X = 200
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: BASE_X,
      y: index * VERTICAL_SPACING + 100
    }
  }))
}

function calculateBoundingBox(nodes: GraphNode[]): LayoutDimensions {
  const positions = nodes.map(n => n.position)
  const minX = Math.min(...positions.map(p => p.x))
  const maxX = Math.max(...positions.map(p => p.x))
  const minY = Math.min(...positions.map(p => p.y))
  const maxY = Math.max(...positions.map(p => p.y))
  
  const width = maxX - minX + NODE_WIDTH
  const height = maxY - minY + NODE_HEIGHT
  
  return {
    width,
    height,
    aspectRatio: width / height,
    area: width * height
  }
}
```

### Enhanced Graph Visualization
```typescript
// components/langgraph-visualizer.tsx - Integration with layout optimization
import { optimizeGraphLayout } from '@/lib/graph-layout'

export function LangGraphVisualizer({ graph }: LangGraphVisualizerProps) {
  const optimizedGraph = useMemo(() => {
    if (!graph) return null
    
    return {
      ...graph,
      nodes: optimizeGraphLayout(graph.nodes)
    }
  }, [graph])
  
  // ... rest of component
}
```

## Testing Strategy

### Unit Tests
- Example code generation functions
- Comment insertion logic
- Template selection mechanisms
- Graph layout optimization algorithms
- Bounding box calculations

### Integration Tests
- Full workflow from example loading to visualization
- Multi-language comment rendering
- Graph generation from example code
- Layout optimization with different node counts

### User Experience Tests
- Initial loading experience
- Code readability and comprehension
- Visualization quality from examples
- Graph layout visual appeal and readability