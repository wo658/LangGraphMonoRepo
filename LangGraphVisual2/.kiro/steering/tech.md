# Technology Stack

## Framework & Runtime
- **Next.js 15.2.4** with App Router and React 19 support
- **React 19** with concurrent features and TypeScript integration
- **Node.js** runtime with modern ES modules support
- **TypeScript 5** with strict mode and comprehensive type checking

## UI & Styling
- **Tailwind CSS 3.4.17** with custom design system and CSS variables
- **shadcn/ui** component library (50+ components based on Radix UI primitives)
  - Complete component set: Button, Card, Dialog, Dropdown, Toast, etc.
  - Accessible components with ARIA support
  - Customizable with CSS variables and Tailwind variants
- **Lucide React 0.454.0** for consistent iconography
- **next-themes** for theme management with system preference detection
- **Tailwind Animate** for smooth transitions and animations

## State Management
- **Zustand 5.0.7** for centralized state management
  - Persist middleware for user preferences
  - DevTools integration for debugging
  - Subscription-based selectors for performance
  - TypeScript-first with comprehensive type safety

## Key Libraries

### Code Editing & Visualization
- **Monaco Editor** (latest) - Full-featured code editor with Python syntax highlighting
- **@monaco-editor/react** - React wrapper with TypeScript support
- **ReactFlow** (latest) - Interactive graph visualization with:
  - Custom node and edge components
  - Drag-and-drop functionality
  - Minimap and controls
  - Theme-aware styling

### Form Handling & Validation
- **React Hook Form 7.54.1** with TypeScript integration
- **@hookform/resolvers 3.9.1** for validation schema integration
- **Zod 3.24.1** for runtime type validation and schema definition

### UI Enhancement
- **Sonner 1.7.1** for toast notifications (integrated with Zustand)
- **React Resizable Panels 2.1.7** for flexible layout management
- **Class Variance Authority 0.7.1** for component variant management
- **Tailwind Merge 2.5.5** for intelligent class merging
- **clsx 2.1.1** for conditional class names

### Utility Libraries
- **date-fns 4.1.0** for date manipulation and formatting
- **Recharts 2.15.0** for data visualization and statistics
- **Embla Carousel React 8.5.1** for carousel components

## Development Tools

### Code Quality & Testing
- **TypeScript 5** with strict mode enabled
- **ESLint 9.31.0** with Next.js and TypeScript configurations
- **@typescript-eslint** parser and plugin for advanced TypeScript linting
- **Prettier 3.6.2** for consistent code formatting
- **Jest 30.0.5** with React Testing Library for comprehensive testing
- **@testing-library/react 16.3.0** for component testing
- **@testing-library/jest-dom 6.6.4** for DOM testing utilities

### Build & Development
- **PostCSS 8.5** with Autoprefixer for CSS processing
- **pnpm** for fast, efficient package management
- **Sharp** for optimized image processing
- **Autoprefixer 10.4.20** for CSS vendor prefixing

### IDE & Development Experience
- **Kiro IDE** integration with:
  - Automated documentation updates
  - Feature specifications and development guidelines
  - Workspace-specific configurations
- **VS Code** configuration with TypeScript and formatting settings

## Common Commands

```bash
# Development
pnpm dev          # Start development server at http://localhost:3000
pnpm build        # Build for production with optimizations
pnpm start        # Start production server
pnpm lint         # Run ESLint with TypeScript rules
pnpm lint:fix     # Run ESLint with auto-fix
pnpm type-check   # Run TypeScript type checking

# Code Quality
pnpm format       # Format code with Prettier
pnpm format:check # Check code formatting without changes

# Testing
pnpm test         # Run Jest tests with React Testing Library
pnpm test:watch   # Run tests in watch mode for development
pnpm test:coverage # Generate test coverage reports (target: 70%)

# Package Management
pnpm install      # Install all dependencies
pnpm add <pkg>    # Add new dependency
pnpm add -D <pkg> # Add development dependency
pnpm update       # Update dependencies to latest versions
```

## Build Configuration

### Next.js Configuration
- **App Router** with React 19 support
- **Image Optimization** disabled for static export compatibility
- **TypeScript** and ESLint errors ignored during builds for CI/CD flexibility
- **Static Generation** support with dynamic imports
- **Bundle Analysis** available for performance optimization

### TypeScript Configuration
- **Strict Mode** enabled for maximum type safety
- **Path Aliases** configured (`@/*` for clean imports)
- **Module Resolution** optimized for Next.js and React
- **Build Info** caching for faster incremental builds

### Tailwind Configuration
- **Custom Design System** with CSS variables
- **Dark/Light Mode** support with automatic theme switching
- **Component Variants** for consistent styling
- **Responsive Design** utilities for mobile-first development

### Testing Configuration
- **Jest Environment** configured for React components
- **Module Mocking** for Monaco Editor, ReactFlow, and Next.js
- **Coverage Thresholds** set to 70% for all metrics
- **Test Utilities** for DOM manipulation and user interactions

## Performance Optimizations
- **Code Splitting** with dynamic imports
- **Bundle Optimization** with Next.js built-in optimizations
- **Image Optimization** with Sharp (disabled for static export)
- **CSS Optimization** with PostCSS and Tailwind purging
- **State Management** with selective Zustand subscriptions
- **Memoization** strategies for expensive computations