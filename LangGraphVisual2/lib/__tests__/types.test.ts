import type {
  GraphNode,
  GraphEdge,
  LangGraph,
  EditorSettings,
  Language,
  ExportData,
} from '../types'

// Test data factories for better maintainability and DRY principle
const createTestNode = (overrides: Partial<GraphNode> = {}): GraphNode => ({
  id: 'test-node',
  label: 'Test Node',
  ...overrides,
})

const createTestEdge = (overrides: Partial<GraphEdge> = {}): GraphEdge => ({
  id: 'test-edge',
  source: 'node1',
  target: 'node2',
  ...overrides,
})

const createTestGraph = (overrides: Partial<LangGraph> = {}): LangGraph => ({
  nodes: [createTestNode({ id: 'node1', label: 'Node 1' })],
  edges: [createTestEdge()],
  ...overrides,
})

const createTestExportData = (overrides: Partial<ExportData> = {}): ExportData => ({
  graph: createTestGraph(),
  code: 'test code',
  timestamp: '2023-01-01T00:00:00Z',
  version: '1.0.0',
  metadata: {
    nodeCount: 1,
    edgeCount: 1,
  },
  ...overrides,
})

describe('Type Definitions', () => {
  describe('GraphNode', () => {
    it('should create a valid GraphNode with all properties', () => {
      const node = createTestNode({
        type: 'default',
        position: { x: 100, y: 200 },
      })

      expect(node).toMatchObject({
        id: 'test-node',
        label: 'Test Node',
        type: 'default',
        position: { x: 100, y: 200 },
      })
    })

    it('should create a minimal GraphNode with only required properties', () => {
      const node = createTestNode()

      expect(node.id).toBe('test-node')
      expect(node.label).toBe('Test Node')
    })

    it('should allow optional type field', () => {
      const nodeWithType = createTestNode({ type: 'custom' })
      const nodeWithoutType = createTestNode()

      expect(nodeWithType.type).toBe('custom')
      expect(nodeWithoutType.type).toBeUndefined()
    })

    it('should allow optional position field', () => {
      const nodeWithPosition = createTestNode({ position: { x: 50, y: 100 } })
      const nodeWithoutPosition = createTestNode()

      expect(nodeWithPosition.position).toEqual({ x: 50, y: 100 })
      expect(nodeWithoutPosition.position).toBeUndefined()
    })
  })

  describe('GraphEdge', () => {
    it('should create a valid GraphEdge with all properties', () => {
      const edge = createTestEdge({
        label: 'Test Edge',
        animated: true,
        isLoopFeedback: false,
      })

      expect(edge).toMatchObject({
        id: 'test-edge',
        source: 'node1',
        target: 'node2',
        label: 'Test Edge',
        animated: true,
        isLoopFeedback: false,
      })
    })

    it('should create a minimal GraphEdge with only required properties', () => {
      const edge = createTestEdge()

      expect(edge.id).toBe('test-edge')
      expect(edge.source).toBe('node1')
      expect(edge.target).toBe('node2')
    })

    it('should allow optional fields to be undefined', () => {
      const edge = createTestEdge()

      expect(edge.label).toBeUndefined()
      expect(edge.animated).toBeUndefined()
      expect(edge.isLoopFeedback).toBeUndefined()
    })

    it('should handle boolean flags correctly', () => {
      const animatedEdge = createTestEdge({ animated: true })
      const loopEdge = createTestEdge({ isLoopFeedback: true })

      expect(animatedEdge.animated).toBe(true)
      expect(loopEdge.isLoopFeedback).toBe(true)
    })
  })

  describe('LangGraph', () => {
    it('should create a valid LangGraph with nodes and edges', () => {
      const graph = createTestGraph({
        nodes: [
          createTestNode({ id: 'node1', label: 'Node 1' }),
          createTestNode({ id: 'node2', label: 'Node 2' }),
        ],
        edges: [
          createTestEdge({ id: 'edge1', source: 'node1', target: 'node2' }),
        ],
      })

      expect(graph.nodes).toHaveLength(2)
      expect(graph.edges).toHaveLength(1)
    })

    it('should handle empty graph correctly', () => {
      const emptyGraph = createTestGraph({
        nodes: [],
        edges: [],
      })

      expect(emptyGraph.nodes).toHaveLength(0)
      expect(emptyGraph.edges).toHaveLength(0)
    })
  })

  describe('EditorSettings', () => {
    it('should create valid EditorSettings', () => {
      const settings: EditorSettings = {
        fontSize: 14,
        wordWrap: true,
        minimap: false,
        tabSize: 2,
      }

      expect(settings).toMatchObject({
        fontSize: 14,
        wordWrap: true,
        minimap: false,
        tabSize: 2,
      })
    })

    it('should enforce correct types for all properties', () => {
      const settings: EditorSettings = {
        fontSize: 16,
        wordWrap: false,
        minimap: true,
        tabSize: 4,
      }

      expect(typeof settings.fontSize).toBe('number')
      expect(typeof settings.wordWrap).toBe('boolean')
      expect(typeof settings.minimap).toBe('boolean')
      expect(typeof settings.tabSize).toBe('number')
    })
  })

  describe('Language', () => {
    it('should only allow valid language codes', () => {
      const englishLang: Language = 'en'
      const koreanLang: Language = 'ko'

      expect(englishLang).toBe('en')
      expect(koreanLang).toBe('ko')
    })
  })

  describe('ExportData', () => {
    it('should create valid ExportData with all properties', () => {
      const exportData = createTestExportData({
        code: 'export const test = "hello"',
        version: '2.0.0',
      })

      expect(exportData.graph).toBeDefined()
      expect(exportData.code).toBe('export const test = "hello"')
      expect(exportData.version).toBe('2.0.0')
      expect(exportData.metadata.nodeCount).toBe(1)
      expect(exportData.metadata.edgeCount).toBe(1)
    })

    it('should maintain consistency between graph and metadata counts', () => {
      const nodes = [
        createTestNode({ id: 'node1' }),
        createTestNode({ id: 'node2' }),
        createTestNode({ id: 'node3' }),
      ]
      const edges = [
        createTestEdge({ id: 'edge1', source: 'node1', target: 'node2' }),
        createTestEdge({ id: 'edge2', source: 'node2', target: 'node3' }),
      ]
      const graph = createTestGraph({ nodes, edges })
      const exportData = createTestExportData({
        graph,
        metadata: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
        },
      })
      expect(exportData.graph.nodes).toHaveLength(exportData.metadata.nodeCount)
      expect(exportData.graph.edges).toHaveLength(exportData.metadata.edgeCount)
    })

    it('should have valid timestamp format', () => {
      const exportData = createTestExportData()
      
      // Test that timestamp is a valid ISO string
      expect(() => new Date(exportData.timestamp)).not.toThrow()
      const parsedDate = new Date(exportData.timestamp)
      expect(parsedDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should include version information', () => {
      const exportData = createTestExportData()
      
      expect(exportData.version).toBeDefined()
      expect(typeof exportData.version).toBe('string')
      expect(exportData.version.length).toBeGreaterThan(0)
    })
  })
})