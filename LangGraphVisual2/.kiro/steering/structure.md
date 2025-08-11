# Project Structure

## Directory Organization

```
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and CSS variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # shadcn/ui components (50+ components)
│   ├── app-header.tsx    # Application header with controls
│   ├── curved-edge.tsx   # Custom ReactFlow edge component
│   ├── edge-drag-preview.tsx # Edge dragging visualization
│   ├── edge-editing-toolbar.tsx # Edge editing controls
│   ├── edge-handle.tsx   # Interactive edge endpoints
│   ├── editor-settings.tsx # Code editor configuration
│   ├── graph-node.tsx    # Custom ReactFlow node component
│   ├── graph-stats.tsx   # Real-time graph statistics
│   ├── import-export-buttons.tsx # File I/O functionality
│   ├── langgraph-visualizer.tsx # Main graph visualization
│   ├── node-creation-dialog.tsx # Node creation interface
│   ├── theme-provider.tsx # Theme context wrapper
│   └── toast-container.tsx # Toast notification system
├── stores/              # State management (Zustand)
│   ├── app-store.ts     # Main application store
│   └── store-constants.ts # Store default values
├── hooks/               # Custom React hooks
│   ├── use-mobile.tsx   # Mobile detection
│   ├── use-toast.ts     # Toast notifications
│   └── use-translation.ts # Translation utilities
├── lib/                # Core utilities and types
│   ├── __tests__/       # Unit tests for utilities
│   ├── constants.ts     # Application constants & translations
│   ├── edge-utils.ts    # ReactFlow edge utilities
│   ├── graph-to-code.ts # Graph to code conversion
│   ├── graph-validator.ts # Graph validation logic
│   ├── i18n-types.ts    # Internationalization types
│   ├── python-parser.ts # Python code parsing
│   ├── result.ts        # Result type utilities
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Common utilities
├── utils/              # Application utilities
│   ├── __tests__/      # Utility tests
│   └── python-snippets.ts # Code templates
├── .kiro/              # Kiro IDE configuration
│   ├── hooks/          # Development automation hooks
│   ├── settings/       # IDE settings
│   ├── specs/          # Feature specifications
│   └── steering/       # Development guidelines
├── tests/              # Test configuration
├── public/             # Static assets
│   ├── placeholder-logo.png
│   ├── placeholder-logo.svg
│   └── placeholder.svg
└── Configuration Files
    ├── components.json  # shadcn/ui configuration
    ├── jest.config.js   # Jest testing configuration
    ├── next.config.mjs  # Next.js configuration
    ├── tailwind.config.ts # Tailwind CSS configuration
    └── tsconfig.json    # TypeScript configuration
```

## Code Organization Patterns

### Component Structure
- **TypeScript First**: Use explicit prop interfaces with strict typing
- **Function Components**: Prefer function components with React hooks
- **Client Directives**: Use "use client" directive for client-side components
- **Type Imports**: Import types with `type` keyword for better tree-shaking
- **Component Reuse**: Check Components.md before creating new components

### State Management Architecture
- **Zustand Store**: Centralized state management with typed selectors
- **Store Organization**: 
  - `app-store.ts` - Main application state with unified actions
  - `store-constants.ts` - Default values and constants
- **State Patterns**:
  - Selective subscriptions for performance
  - Persist middleware for user preferences
  - DevTools integration for debugging
  - Change tracking with timestamps

### File Naming Conventions
- **Files**: kebab-case (`graph-node.tsx`, `edge-utils.ts`)
- **Components**: PascalCase (`GraphNode`, `EdgeHandle`)
- **Functions**: camelCase (`calculateComplexity`, `generateNodeId`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_THEME`, `GRAPH_CONFIG`)

### Import Conventions
- **Path Aliases**: Use `@/` for absolute imports
- **Import Grouping**: 
  1. React and Next.js imports
  2. Third-party libraries
  3. Local components and utilities
  4. Type-only imports (with `type` keyword)
- **Example**:
```typescript
import React, { useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import type { GraphNode } from '@/lib/types'
```

### Styling Approach
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **CSS Variables**: Theme-aware styling with CSS custom properties
- **Component Styling**: 
  - Use `className` for component-scoped styles
  - Leverage `cn()` utility for conditional classes
  - Follow design system tokens in `tailwind.config.ts`
- **Theme Support**: 
  - Dark/light mode with system preference detection
  - Consistent color palette across components
  - Accessible contrast ratios

### Testing Strategy
- **Jest + React Testing Library**: Unit and integration testing
- **Mocking Strategy**:
  - Monaco Editor mock for code editor tests
  - ReactFlow mock for graph visualization tests
  - Next.js router and theme provider mocks
- **Test Organization**:
  - `__tests__/` directories alongside source files
  - Comprehensive mocks in `jest.setup.js`
  - Coverage threshold: 70% for all metrics

### Development Workflow
- **Kiro IDE Integration**: 
  - Automated documentation updates via hooks
  - Workspace-specific settings and configurations
  - Feature specifications in `.kiro/specs/`
- **Code Quality**:
  - ESLint with Next.js and TypeScript rules
  - Prettier for consistent formatting
  - TypeScript strict mode enabled
- **Package Management**: pnpm for fast, efficient dependency management