# UI Components Reference

## ShadcnUI Components Used

The project uses **shadcn/ui component library** with 50+ components based on Radix UI primitives, providing accessible components with ARIA support and customizable styling through CSS variables and Tailwind variants.

### Layout & Structure
- **Card** (`@/components/ui/card`)
  - `Card`: Main container with theme-aware styling
  - `CardHeader`: Header section with title
  - `CardContent`: Main content area
  - `CardTitle`: Title component with proper typography
  - `CardDescription`: Subtitle/description text

- **Button** (`@/components/ui/button`)
  - Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`
  - Sizes: `sm`, `md`, `lg`, `icon`
  - Full TypeScript support with variant props

- **Separator** (`@/components/ui/separator`)
  - Horizontal/vertical dividers with theme support

### Form & Input Components
- **Badge** (`@/components/ui/badge`)
  - Variants: `default`, `secondary`, `outline`, `destructive`
  - Used for status indicators and labels

- **Input** (`@/components/ui/input`)
  - Form input fields with consistent styling

- **Label** (`@/components/ui/label`)
  - Accessible form labels

- **Select** (`@/components/ui/select`)
  - Dropdown selection component

- **Textarea** (`@/components/ui/textarea`)
  - Multi-line text input

### Navigation & Controls
- **Tabs** (`@/components/ui/tabs`)
  - `Tabs`: Container with keyboard navigation
  - `TabsList`: Tab navigation with ARIA support
  - `TabsTrigger`: Individual tab buttons
  - `TabsContent`: Tab content areas

- **Dropdown Menu** (`@/components/ui/dropdown-menu`)
  - Context menus and action dropdowns
  - Full keyboard navigation support

### Feedback & Notifications
- **Toast** (`@/hooks/use-toast` + **Sonner 1.7.1**)
  - Success, error, info, warning notifications
  - Integrated with Zustand store for state management
  - Accessible with screen reader support

- **Alert** (`@/components/ui/alert`)
  - Status messages and notifications
  - Variants for different alert types

- **Skeleton** (`@/components/ui/skeleton`)
  - Loading placeholders for better UX

### Dialog & Modal Components
- **Dialog** (`@/components/ui/dialog`)
  - Modal dialogs with backdrop and focus management
  - Accessible with proper ARIA attributes

- **Sheet** (`@/components/ui/sheet`)
  - Slide-out panels and drawers

### Data Display
- **Table** (`@/components/ui/table`)
  - Data tables with sorting and styling
  - Responsive design support

- **Avatar** (`@/components/ui/avatar`)
  - User profile images and placeholders

### Utility Components
- **Scroll Area** (`@/components/ui/scroll-area`)
  - Custom scrollbars with theme support

- **Progress** (`@/components/ui/progress`)
  - Progress bars and loading indicators

## Custom Components

### Application Components
- **AppHeader** (`@/components/app-header`)
  - Main application header with import/export
  
- **LangGraphVisualizer** (`@/components/langgraph-visualizer`)
  - Graph visualization with ReactFlow
  - Enhanced with interactive edge editing capabilities (in development)
  
- **EditorSettings** (`@/components/editor-settings`)
  - Monaco editor configuration

- **ImportExportButtons** (`@/components/import-export-buttons`)
  - File operations

### State Management
- **AppStore** (`@/stores/app-store`) ✅ **Implemented**
  - **Zustand 5.0.7** for centralized state management with TypeScript-first approach
  - **Persist middleware** for user preferences and code persistence across browser sessions
  - **DevTools integration** for debugging state changes and performance monitoring
  - **Subscription-based selectors** (`subscribeWithSelector`) for fine-grained reactivity and performance optimization
  - **Comprehensive edge editing state** management integrated directly into main store
  - **TypeScript interfaces**: `DragState`, `AppStore`, `UserChangeTracker`, `ToastState`
  - **Performance-optimized selectors**: `useEdgeEditingState()`, `useGraphActions()`, `useToastActions()`
  - **Core actions**: `selectEdge`, `setEditingMode`, `startEdgeDrag`, `updateDragPosition`, `endEdgeDrag`
  - **Graph management**: `updateGraph`, `updateCode`, `setNodes`, `setEdges`
  - **UI state management**: Toast notifications, dialog states, theme preferences

### Edge Editing Components (In Development)
- **EdgeHandle** (`@/components/edge-handle`) ✅ **Implemented**
  - Interactive drag handles for edge endpoint modification
  - Visual feedback during drag operations with color changes and scaling
  - Mouse event handling with global listeners for smooth dragging
  - Accessibility support with ARIA labels and keyboard navigation
  - Integration with centralized app store for state management
  
- **EdgeEditingToolbar** (`@/components/edge-editing-toolbar`) 🚧 **Planned**
  - UI controls for edge editing modes (Select, Add Node, Add Edge)
  - Delete button for selected edges
  
- **NodeCreationDialog** (`@/components/node-creation-dialog`) 🚧 **Planned**
  - Modal dialog for creating new nodes with name validation
  - Duplicate name checking and error handling
  
- **CurvedEdge** (`@/components/curved-edge`) 🚧 **Planned**
  - Enhanced edge component with selection and drag capabilities
  - Smooth curved rendering with collision avoidance

### Theme & Context
- **ThemeProvider** (`@/components/theme-provider`)
  - **next-themes** integration for theme management with system preference detection
  - Dark/light mode support with automatic switching
  - **Tailwind Animate** for smooth transitions between themes
  - CSS variables integration for consistent theming across components
  
- **LanguageContext** (`@/contexts/language-context`)
  - Internationalization support for English and Korean
  - Type-safe translations with comprehensive language definitions
  - Context-based language switching with persistent preferences

## Design System Colors

### Primary Colors
- Primary: `hsl(221.2 83.2% 53.3%)`
- Secondary: `hsl(210 40% 98%)`
- Muted: `hsl(210 40% 96%)`

### Status Colors
- Success: `hsl(142.1 76.2% 36.3%)`
- Warning: `hsl(47.9 95.8% 53.1%)`
- Error: `hsl(0 84.2% 60.2%)`

### Graph Colors
- Node: Blue `#3b82f6`
- Edge: Green `#10b981`
- Background: Grid pattern with dots

## Component Usage Guidelines

### Development Best Practices
1. **Component Reuse**: Always check this documentation before creating new components
2. **TypeScript First**: Use explicit prop interfaces with strict typing and `type` imports
3. **Variants**: Use appropriate component variants for context (primary for actions, secondary for info)
4. **Accessibility**: Include proper ARIA labels, keyboard navigation, and screen reader support
5. **Performance**: Leverage memoization and selective subscriptions for optimal re-renders

### Styling Standards
- **Tailwind CSS 3.4.17**: Use utility-first approach with custom design system
- **CSS Variables**: Leverage theme-aware styling with CSS custom properties
- **Spacing**: Follow Tailwind spacing scale (4, 8, 12, 16, 24, 32) for consistency
- **Typography**: Use semantic heading levels (h1, h2, h3) with proper hierarchy
- **Class Merging**: Use `cn()` utility from `@/lib/utils` for conditional classes

### Import Conventions
```typescript
// Recommended import pattern
import React, { useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import type { GraphNode } from '@/lib/types'
```

### Component Architecture
- **Function Components**: Prefer function components with React hooks
- **Client Directives**: Use "use client" directive for client-side components
- **File Naming**: kebab-case for files (`graph-node.tsx`), PascalCase for components (`GraphNode`)
- **Path Aliases**: Use `@/` for clean absolute imports

## Mermaid-Style Design Patterns

### Layout Structure
```
Header (Fixed)
├── Logo/Title
├── Navigation Tabs
└── Action Buttons (Export, Share, etc.)

Main Content (Flexible)
├── Left Panel (Code Editor)
│   ├── Tab Bar (Code, Docs)
│   ├── Toolbar (Run, Settings)
│   └── Editor Area
└── Right Panel (Visualization)
    ├── Tab Bar (Diagram, Preview)
    ├── Controls (Zoom, Fit)
    └── Canvas Area
```

### Color Scheme
- Background: Light gray `#f8fafc`
- Panels: White with subtle borders
- Active elements: Blue accent `#3b82f6`
- Text: Dark gray `#1e293b`
- Borders: Light gray `#e2e8f0`