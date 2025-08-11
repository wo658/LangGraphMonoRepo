# Product Overview

**LangGraph Playground** is a modern web-based visualization tool for LangGraph workflows built with Next.js 15, React 19, and TypeScript. It provides an intuitive split-pane interface where users can write Python code defining LangGraph state machines and visualize the resulting graph structure in real-time.

## Key Features

### Core Functionality
- **Real-time Code Editing**: Monaco Editor with Python syntax highlighting and auto-completion
- **Interactive Graph Visualization**: ReactFlow-powered graph rendering with:
  - Drag-and-drop node positioning
  - Smooth animated edges with collision avoidance
  - Interactive minimap and controls
  - Real-time node/edge statistics display
  - Theme-aware styling (dark/light mode)
- **Import/Export Functionality**: Save and load workflow configurations as JSON files
- **Multi-language Support**: English and Korean localization with type-safe translations
- **Theme Support**: Dark/light mode with system preference detection
- **Configurable Editor**: Customizable font size, word wrap, minimap, and tab settings

### State Management & Architecture
- **Unified Zustand Store**: Centralized state management with:
  - Edge editing capabilities with drag state tracking
  - Theme and language state integration
  - Toast notification system
  - UI dialog state management
  - Persistent user preferences
- **Type Safety**: Comprehensive TypeScript definitions with strict mode
- **Performance Optimized**: Selective subscriptions and memoized selectors

### Interactive Features
- **Edge Selection**: Click-to-select edges with visual highlighting
- **Graph Statistics**: Real-time complexity analysis and connectivity metrics
- **Responsive Design**: Mobile-friendly interface with resizable panels
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Target Users
- **LangGraph Developers**: Primary users who need to visualize and debug state machine workflows
- **Python Developers**: Working with complex workflow orchestration
- **Data Scientists**: Building and visualizing data processing pipelines
- **DevOps Engineers**: Creating deployment and automation workflows
- **Educators**: Teaching workflow concepts and state machine patterns

## Current Status
- ✅ **Production Ready**: Core visualization and editing features
- 🚧 **Active Development**: Interactive edge editing and enhanced code examples
- 📋 **Planned**: Real Python code execution and advanced analysis tools