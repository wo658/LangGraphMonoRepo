# Design Document

## Overview

This design document outlines the implementation of comprehensive edge editing capabilities for the LangGraph Playground. The feature will extend the existing ReactFlow-based graph visualization to support interactive edge manipulation, including selection, connection modification, deletion, and creation of new nodes and edges. All visual changes will be synchronized with the Python code editor to maintain consistency between the visual representation and the underlying code.

## Architecture

### High-Level Architecture

The edge editing system will be built on top of the existing ReactFlow infrastructure, extending the current `LangGraphVisualizer` component with new interaction modes and state management. The architecture follows a unidirectional data flow pattern:

```
Visual Interactions → State Updates → Code Generation → Code Editor Update
```

### Component Hierarchy

```
LangGraphVisualizer (Enhanced)
├── GraphFlow (Enhanced)
│   ├── ReactFlow (with new event handlers)
│   ├── EdgeEditingToolbar (New)
│   ├── NodeCreationModal (New)
│   └── EdgeSelectionOverlay (New)
├── EdgeEditingContext (New)
└── CodeSynchronizer (Enhanced)
```

### State Management Strategy

The system will use React's built-in state management with custom hooks for complex edge editing operations:

- **Selection State**: Track currently selected edges and nodes
- **Editing Mode State**: Manage different interaction modes (select, add-node, add-edge)
- **Drag State**: Handle edge endpoint dragging operations
- **Synchronization State**: Track pending changes that need code updates

## Components and Interfaces

### 1. Enhanced LangGraphVisualizer

**Purpose**: Main container component that orchestrates edge editing functionality

**New Props**:
```typescript
interface LangGraphVisualizerProps {
  graph: LangGraph | null
  onGraphChange?: (graph: LangGraph, changeEvent?: GraphChangeEvent) => void
  onCodeChange?: (code: string) => void // New: Direct code updates
  editable?: boolean
  enableEdgeEditing?: boolean // New: Feature flag
}
```

**Key Enhancements**:
- Integration with EdgeEditingContext
- Enhanced event handling for edge operations
- Coordination between visual changes and code updates

### 2. EdgeEditingContext

**Purpose**: Centralized state management for edge editing operations

```typescript
interface EdgeEditingContextType {
  // Selection state
  selectedEdgeId: string | null
  selectedNodeIds: string[]
  
  // Editing mode
  editingMode: 'select' | 'add-node' | 'add-edge'
  
  // Drag state
  isDraggingEdge: boolean
  draggedEdgeId: string | null
  draggedEndpoint: 'source' | 'target' | null
  
  // Actions
  selectEdge: (edgeId: string | null) => void
  deleteSelectedEdge: () => void
  startEdgeDrag: (edgeId: string, endpoint: 'source' | 'target') => void
  updateEdgeConnection: (edgeId: string, newSource?: string, newTarget?: string) => void
  addNode: (name: string, position: Position) => void
  addEdge: (sourceId: string, targetId: string) => void
  setEditingMode: (mode: 'select' | 'add-node' | 'add-edge') => void
}
```

### 3. EdgeEditingToolbar

**Purpose**: UI controls for edge editing operations

```typescript
interface EdgeEditingToolbarProps {
  selectedEdgeId: string | null
  editingMode: 'select' | 'add-node' | 'add-edge'
  onDeleteEdge: () => void
  onAddNode: () => void
  onAddEdge: () => void
  onModeChange: (mode: 'select' | 'add-node' | 'add-edge') => void
}
```

**Features**:
- Mode toggle buttons (Select, Add Node, Add Edge)
- Delete button (enabled when edge is selected)
- Visual feedback for current mode
- Keyboard shortcut support

### 4. Enhanced Edge Component

**Purpose**: Custom edge component with selection and drag capabilities

```typescript
interface EditableEdgeProps extends EdgeProps {
  selected: boolean
  onSelect: (edgeId: string) => void
  onStartDrag: (edgeId: string, endpoint: 'source' | 'target', event: MouseEvent) => void
  showHandles: boolean
}
```

**Features**:
- Click selection with visual feedback
- Draggable endpoint handles when selected
- Hover effects and visual states
- Integration with existing curved edge styling

### 5. NodeCreationModal

**Purpose**: Modal dialog for creating new nodes with name input

```typescript
interface NodeCreationModalProps {
  isOpen: boolean
  position: Position
  existingNodeNames: string[]
  onConfirm: (name: string) => void
  onCancel: () => void
}
```

**Features**:
- Text input with validation
- Duplicate name checking
- Auto-focus and keyboard navigation
- Position-aware placement

### 6. Enhanced CodeSynchronizer

**Purpose**: Bidirectional synchronization between visual graph and Python code

```typescript
interface CodeSynchronizerProps {
  graph: LangGraph
  onCodeUpdate: (code: string) => void
  preserveFormatting: boolean
}
```

**Key Functions**:
- `updateNodeInCode(nodeId: string, operation: 'add' | 'remove')`
- `updateEdgeInCode(edge: GraphEdge, operation: 'add' | 'remove' | 'modify')`
- `validateCodeStructure(code: string): ValidationResult`
- `preserveCodeFormatting(originalCode: string, updates: CodeUpdate[])`

## Data Models

### Enhanced GraphChangeEvent

```typescript
interface GraphChangeEvent {
  type: 'node-add' | 'node-remove' | 'edge-add' | 'edge-remove' | 'edge-modify'
  nodeId?: string
  edgeId?: string
  data?: {
    // For edge modifications
    oldSource?: string
    oldTarget?: string
    newSource?: string
    newTarget?: string
    // For node additions
    nodeName?: string
    position?: Position
  }
  timestamp: number
}
```

### Edge Selection State

```typescript
interface EdgeSelectionState {
  selectedEdgeId: string | null
  selectionTimestamp: number
  dragState: {
    isDragging: boolean
    edgeId: string | null
    endpoint: 'source' | 'target' | null
    startPosition: Position
    currentPosition: Position
  }
}
```

### Node Creation State

```typescript
interface NodeCreationState {
  isCreating: boolean
  position: Position | null
  pendingName: string
  validationError: string | null
}
```

## Error Handling

### Edge Editing Errors

1. **Invalid Connection Attempts**
   - Self-loops (node connecting to itself)
   - Duplicate edges between same nodes
   - Connections to non-existent nodes

2. **Node Creation Errors**
   - Duplicate node names
   - Invalid node name characters
   - Reserved name conflicts

3. **Code Synchronization Errors**
   - Malformed Python code structure
   - Syntax errors in generated code
   - Conflicts with existing code patterns

### Error Recovery Strategies

- **Optimistic Updates**: Apply visual changes immediately, rollback on code sync failure
- **Validation Gates**: Prevent invalid operations before they occur
- **User Feedback**: Clear error messages with suggested corrections
- **Graceful Degradation**: Disable editing features if code structure is too complex

## Testing Strategy

### Unit Tests

1. **EdgeEditingContext Tests**
   - State transitions for different editing modes
   - Edge selection and deselection logic
   - Drag state management
   - Node and edge creation/deletion

2. **Component Tests**
   - EdgeEditingToolbar interaction handling
   - NodeCreationModal validation logic
   - Enhanced edge component selection behavior

3. **Code Synchronization Tests**
   - Python code generation for various graph structures
   - Code parsing and validation
   - Formatting preservation

### Integration Tests

1. **End-to-End Editing Workflows**
   - Complete edge editing cycle (select → modify → sync)
   - Node creation with code update
   - Edge deletion with code cleanup

2. **Cross-Component Communication**
   - Context state propagation
   - Event handling between components
   - Code editor synchronization

### Visual Testing

1. **Interaction States**
   - Edge selection visual feedback
   - Drag handle appearance and behavior
   - Mode-specific cursor changes

2. **Responsive Behavior**
   - Toolbar layout on different screen sizes
   - Modal positioning and responsiveness

## Implementation Phases

### Phase 1: Core Edge Selection
- Implement edge selection with visual feedback
- Add basic EdgeEditingContext
- Create EdgeEditingToolbar with delete functionality

### Phase 2: Edge Connection Modification
- Add draggable endpoint handles
- Implement drag state management
- Add connection validation logic

### Phase 3: Node and Edge Creation
- Implement NodeCreationModal
- Add node creation workflow
- Add edge creation mode with click-to-connect

### Phase 4: Code Synchronization
- Enhance CodeSynchronizer for bidirectional updates
- Add code validation and error handling
- Implement formatting preservation

### Phase 5: Polish and Optimization
- Add keyboard shortcuts
- Optimize performance for large graphs
- Add accessibility features
- Comprehensive testing and bug fixes

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use React.memo for expensive components
2. **Event Debouncing**: Debounce code synchronization updates
3. **Selective Re-rendering**: Minimize unnecessary component updates
4. **Lazy Loading**: Load editing features only when needed

### Memory Management

- Clean up event listeners on component unmount
- Optimize context state structure to prevent unnecessary re-renders
- Use weak references for temporary drag state

## Accessibility

### Keyboard Navigation
- Tab navigation through editing controls
- Keyboard shortcuts for common operations (Delete, Escape)
- Focus management during modal interactions

### Screen Reader Support
- ARIA labels for editing states and controls
- Announcements for state changes
- Semantic HTML structure for toolbar elements

### Visual Accessibility
- High contrast selection indicators
- Clear visual feedback for all interaction states
- Consistent focus indicators