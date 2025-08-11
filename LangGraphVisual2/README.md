# LangGraphVisual2

A modern web-based visualization tool for LangGraph workflows built with Next.js 15, React 19, and TypeScript. It provides an intuitive split-pane interface where users can write Python code defining LangGraph state machines and visualize the resulting graph structure in real-time.

## 🚀 Features

### Core Functionality
- **Real-time Python Code Parsing**: Advanced parser that extracts nodes and edges from LangGraph Python code
- **Interactive Graph Visualization**: ReactFlow-powered graph rendering with:
  - Drag-and-drop node positioning
  - Curved edges with automatic collision avoidance
  - Loop feedback edge detection (displayed as red dashed lines)
  - Interactive minimap and controls
  - Theme-aware styling (dark/light mode)
- **Visual Graph Editing**: Interactive toolbar with multiple modes:
  - Select mode for node/edge selection
  - Add Node mode for creating nodes by clicking
  - Add Edge mode for visual node connection
  - Delete functionality with keyboard shortcuts
- **Code Editor Integration**: Monaco Editor with Python syntax highlighting
- **Import/Export**: Save and load workflow configurations as JSON files
- **Multi-language Support**: English and Korean localization

### Advanced Features
- **Smart Edge Routing**: Automatic curvature calculation to avoid node/edge collisions
- **Loop Detection**: Identifies and highlights feedback loops in workflows
- **Floating Code Panel**: Resizable and collapsible code editor panel
- **Graph Statistics**: Real-time complexity analysis and connectivity metrics
- **Responsive Design**: Mobile-friendly interface with resizable panels

## 🛠️ Technology Stack

### Framework & Runtime
- **Next.js 15.2.4** with App Router
- **React 19** with TypeScript
- **TypeScript 5** with strict mode

### UI & Styling
- **Tailwind CSS 3.4.17**
- **shadcn/ui** component library (50+ components)
- **Lucide React** for icons
- **next-themes** for theme management

### State Management
- **Zustand 5.0.7** with separated stores:
  - Graph store for workflow data
  - Editor store for code editor state
  - UI store for interface state
  - i18n store for translations
  - Notification store for toasts

### Key Libraries
- **ReactFlow** - Interactive graph visualization
- **Monaco Editor** - Full-featured code editor
- **React Hook Form + Zod** - Form handling and validation
- **Sonner** - Toast notifications

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd LangGraphVisual2

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## 🚀 Development Commands

```bash
# Development
pnpm dev          # Start development server at http://localhost:3000
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
pnpm type-check   # Run TypeScript type checking

# Testing
pnpm test         # Run Jest tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Generate test coverage reports

# Code Quality
pnpm format       # Format code with Prettier
pnpm format:check # Check code formatting
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── langgraph-visualizer.tsx  # Main graph visualization
│   ├── edge-editing-toolbar.tsx  # Graph editing controls
│   ├── floating-code-panel.tsx   # Code editor panel
│   ├── curved-edge.tsx           # Custom edge component
│   └── ui/                       # shadcn/ui components
├── stores/                # Zustand state management
│   ├── graph-store.ts     # Graph data management
│   ├── editor-store.ts    # Code editor state
│   ├── ui-store.ts        # UI state and modes
│   ├── i18n-store.ts      # Internationalization
│   └── notification-store.ts # Toast notifications
├── lib/                   # Core logic
│   ├── python-parser.ts   # LangGraph code parsing
│   ├── edge-utils.ts      # Edge routing algorithms
│   ├── graph-to-code.ts   # Code generation
│   ├── types.ts           # TypeScript definitions
│   └── constants.ts       # Configuration
└── hooks/                 # Custom React hooks
```

## 🎯 Usage

### Basic Workflow

1. **Write Python Code**: Use the code editor to write LangGraph workflow definitions
2. **Run Code**: Click the "Run" button to parse and visualize the graph
3. **Edit Visually**: Use the toolbar to add nodes/edges or modify the graph
4. **Export**: Save your workflow as JSON for later use

### Keyboard Shortcuts

- `Ctrl+1` - Select mode
- `Ctrl+2` - Add node mode  
- `Ctrl+3` - Add edge mode
- `Delete` - Delete selected element
- `Escape` - Deselect/exit mode

### Graph Visualization

The visualizer automatically detects and highlights:
- **Regular edges**: Gray solid lines with arrows
- **Conditional edges**: Animated edges with condition labels
- **Loop feedback edges**: Red dashed lines for backward connections

## 🔧 Configuration

### Editor Settings
- Font size adjustment (12-24px)
- Word wrap toggle
- Minimap visibility
- Tab size configuration (2, 4, or 8 spaces)

### Theme Configuration
- Automatic system theme detection
- Manual light/dark mode toggle
- Theme persistence across sessions

## 🚧 Current Limitations

- **No Python Runtime**: Uses static parsing instead of actual code execution
- **Limited to LangGraph Syntax**: Only parses specific LangGraph patterns
- **No Backend API**: Missing server-side Python execution environment

## 🤝 Contributing

### Code Style Guidelines

- **TypeScript First**: Use explicit types and interfaces
- **Function Components**: Prefer modern React patterns
- **File Naming**: kebab-case for files, PascalCase for components
- **Import Order**: React → third-party → local → types

### Component Development

- Check existing shadcn/ui components before creating new ones
- Follow the design system colors and spacing
- Include proper ARIA labels for accessibility
- Add keyboard navigation support

## 📄 License

[Add your license information here]

## 🐛 Known Issues

1. Python code execution uses mock data
2. Complex conditional edges may require manual adjustment
3. Large graphs (100+ nodes) may impact performance

## 🔮 Roadmap

- [ ] Real Python code execution backend
- [ ] Advanced graph analysis tools
- [ ] Collaborative editing features
- [ ] Export to multiple formats (PNG, SVG, PDF)
- [ ] Integration with Jupyter notebooks
- [ ] Custom node types and templates

---

For detailed technical documentation, see the [TECHNICAL.md](./TECHNICAL.md) file.