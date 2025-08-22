// Constants and default values for the LangGraph Playground application

import type { EditorSettings, Language } from './types'

// Default editor settings
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  tabSize: 4,
} as const

// Language settings
export const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'ko'] as const
export const DEFAULT_LANGUAGE: Language = 'en'

// Theme settings
export const SUPPORTED_THEMES = ['light', 'dark', 'system'] as const
export const DEFAULT_THEME = 'system'

// Editor configuration
export const EDITOR_CONFIG = {
  MIN_FONT_SIZE: 10,
  MAX_FONT_SIZE: 24,
  SUPPORTED_TAB_SIZES: [2, 4, 8],
  DEFAULT_LANGUAGE: 'python',
} as const

// Graph visualization settings
export const GRAPH_CONFIG = {
  DEFAULT_NODE_SPACING: 200,
  DEFAULT_LEVEL_SPACING: 100,
  DEFAULT_NODE_WIDTH: 120,
  DEFAULT_NODE_HEIGHT: 40,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 4,
  SNAP_GRID: [15, 15] as [number, number],
  FIT_VIEW_PADDING: 0.2,
  MINIMAP_MASK_COLOR: {
    light: 'rgba(255,255,255,0.8)',
    dark: 'rgba(0,0,0,0.8)',
  },
  BACKGROUND_COLOR: {
    light: '#e5e7eb',
    dark: '#374151',
  },
} as const

// Graph styling constants
export const GRAPH_STYLES = {
  COLORS: {
    SELECTED_EDGE: '#3b82f6',
    SELF_LOOP_EDGE: '#a855f7',
    LOOP_FEEDBACK_EDGE: '#ef4444',
    DARK_THEME: {
      BACKGROUND: '#0a0a0a',
      NODE_STROKE: '#6b7280',
      EDGE_STROKE: '#9ca3af',
      MINIMAP_BG: '#1f2937',
      MINIMAP_BORDER: '#374151',
    },
    LIGHT_THEME: {
      BACKGROUND: '#ffffff',
      NODE_STROKE: '#d1d5db',
      EDGE_STROKE: '#6b7280',
      MINIMAP_BG: '#f9fafb',
      MINIMAP_BORDER: '#d1d5db',
    },
  },
  TRANSITIONS: {
    DEFAULT: 'all 0.2s ease-in-out',
    FAST: 'all 0.1s ease-in-out',
  },
  SHADOWS: {
    SELECTED_EDGE: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))',
    HOVER_EDGE: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))',
  },
} as const

// File handling
export const FILE_CONFIG = {
  EXPORT_FILE_PREFIX: 'langgraph',
  EXPORT_FILE_EXTENSION: '.json',
  ACCEPTED_FILE_TYPES: '.json',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const

// API and execution settings
export const EXECUTION_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  LOADING_SIMULATION_DELAY: 1000, // 1 second for demo
} as const

// Toast notification settings
export const TOAST_CONFIG = {
  DEFAULT_DURATION: 5000, // 5 seconds
  ERROR_DURATION: 8000, // 8 seconds for errors
} as const

// Application metadata
export const APP_CONFIG = {
  NAME: 'LangGraph GUI ( BETA )',
  VERSION: '1.0.0',
  DESCRIPTION: 'A minimal GUI to visualize LangGraph graphs',
} as const

// Translation data - centralized location
export const TRANSLATIONS = {
  en: {
    // Header
    "app.title": "LangGraph GUI ( BETA )",
    "app.description": "A minimal GUI to visualize LangGraph graphs.",
    "menu.templates": "Code Templates",

    // Buttons
    "button.run": "Run",
    "button.running": "Running...",
    "button.import": "Import",
    "button.export": "Export",
    "button.settings": "Settings",
    "button.like": "Like",
    "button.unlike": "Unlike",

    // Editor
    "editor.title": "Code Editor",
    "editor.settings": "Editor Settings",
    "editor.fontSize": "Font Size",
    "editor.tabSize": "Tab Size",
    "editor.wordWrap": "Word Wrap",
    "editor.minimap": "Minimap",
    "editor.loading": "Loading editor...",

    // Graph
    "graph.title": "Graph Visualizer",
    "graph.visualizer": "Graph Visualizer",
    "graph.noData": "No graph to display – run the code to generate one.",
    "graph.stats": "Stats",
    "graph.nodes": "Nodes",
    "graph.edges": "Edges",
    "graph.connected": "Connected",
    "graph.disconnected": "Disconnected",
    "graph.complexity": "Complexity",

    // Settings
    "settings.language": "Language",

    // Templates Page
    "templates.title": "Code Templates",
    "templates.search.placeholder": "Search templates...",
    "templates.sort.latest": "Latest",
    "templates.sort.likes": "Most Liked",
    "templates.tab.all": "All",
    "templates.tab.mine": "Mine",

    // Node Creation Dialog
    "dialog.node.title": "Add New Node",
    "dialog.node.description": "Enter a name for the new node to add to your graph.",
    "dialog.node.label": "Node Name",
    "dialog.node.placeholder": "Enter node name...",
    "dialog.node.create": "Create Node",
    "dialog.node.cancel": "Cancel",
    "dialog.node.error.required": "Node name is required",
    "dialog.node.error.minLength": "Node name must be at least 2 characters",
    "dialog.node.error.maxLength": "Node name must be less than 50 characters",

    // Messages
    "message.success": "Code executed successfully",
    "message.success.desc": "Graph has been generated and visualized",
    "message.error": "Error running code",
    "message.export.success": "Graph exported successfully",
    "message.import.success": "Graph imported successfully",
    "message.import.error": "Failed to import graph",
  },
  ko: {
    // Header
    "app.title": "LangGraph GUI ( BETA )",
    "app.description": "LangGraph 그래프를 시각화하는 최소한의 플레이그라운드입니다.",
    "menu.templates": "코드 템플릿",

    // Buttons
    "button.run": "실행",
    "button.running": "실행 중...",
    "button.import": "가져오기",
    "button.export": "내보내기",
    "button.settings": "설정",
    "button.like": "좋아요",
    "button.unlike": "취소",

    // Editor
    "editor.title": "코드 에디터",
    "editor.settings": "에디터 설정",
    "editor.fontSize": "글꼴 크기",
    "editor.tabSize": "탭 크기",
    "editor.wordWrap": "줄 바꿈",
    "editor.minimap": "미니맵",
    "editor.loading": "에디터 로딩 중...",

    // Graph
    "graph.title": "그래프 시각화",
    "graph.visualizer": "그래프 시각화",
    "graph.noData": "표시할 그래프가 없습니다 – 코드를 실행하여 생성하세요.",
    "graph.stats": "통계",
    "graph.nodes": "노드",
    "graph.edges": "엣지",
    "graph.connected": "연결됨",
    "graph.disconnected": "연결되지 않음",
    "graph.complexity": "복잡도",

    // Settings
    "settings.language": "언어",

    // Templates Page
    "templates.title": "코드 템플릿",
    "templates.search.placeholder": "템플릿 검색...",
    "templates.sort.latest": "최신순",
    "templates.sort.likes": "좋아요순",
    "templates.tab.all": "전체",
    "templates.tab.mine": "내 템플릿",

    // Node Creation Dialog
    "dialog.node.title": "새 노드 추가",
    "dialog.node.description": "그래프에 추가할 새 노드의 이름을 입력하세요.",
    "dialog.node.label": "노드 이름",
    "dialog.node.placeholder": "노드 이름을 입력하세요...",
    "dialog.node.create": "노드 생성",
    "dialog.node.cancel": "취소",
    "dialog.node.error.required": "노드 이름이 필요합니다",
    "dialog.node.error.minLength": "노드 이름은 최소 2자 이상이어야 합니다",
    "dialog.node.error.maxLength": "노드 이름은 50자 미만이어야 합니다",

    // Messages
    "message.success": "코드가 성공적으로 실행되었습니다",
    "message.success.desc": "그래프가 생성되고 시각화되었습니다",
    "message.error": "코드 실행 오류",
    "message.export.success": "그래프가 성공적으로 내보내졌습니다",
    "message.import.success": "그래프가 성공적으로 가져와졌습니다",
    "message.import.error": "그래프 가져오기에 실패했습니다",
  },
} as const