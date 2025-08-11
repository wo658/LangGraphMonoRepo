import { GraphValidatorImpl, graphValidator } from '../graph-validator'
import type { GraphNode, GraphEdge, LangGraph } from '../types'

describe('GraphValidator', () => {
  let validator: GraphValidatorImpl

  beforeEach(() => {
    validator = new GraphValidatorImpl()
  })

  describe('validateNode', () => {
    it('should validate a correct node', () => {
      const validNode: GraphNode = {
        id: 'node1',
        label: 'Test Node',
        type: 'default',
        position: { x: 100, y: 200 }
      }

      const result = validator.validateNode(validNode)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject node with empty id', () => {
      const invalidNode: GraphNode = {
        id: '',
        label: 'Test Node',
        type: 'default'
      }

      const result = validator.validateNode(invalidNode)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('id')
      expect(result.errors[0].code).toBe('REQUIRED_FIELD')
    })

    it('should reject node with whitespace-only id', () => {
      const invalidNode: GraphNode = {
        id: '   ',
        label: 'Test Node',
        type: 'default'
      }

      const result = validator.validateNode(invalidNode)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('id')
    })

    it('should reject node with empty label', () => {
      const invalidNode: GraphNode = {
        id: 'node1',
        label: '',
        type: 'default'
      }

      const result = validator.validateNode(invalidNode)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('label')
      expect(result.errors[0].code).toBe('REQUIRED_FIELD')
    })

    it('should reject node with invalid position', () => {
      const invalidNode: GraphNode = {
        id: 'node1',
        label: 'Test Node',
        type: 'default',
        position: { x: 'invalid' as any, y: 100 }
      }

      const result = validator.validateNode(invalidNode)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('position')
      expect(result.errors[0].code).toBe('INVALID_TYPE')
    })

    it('should accept node without position', () => {
      const validNode: GraphNode = {
        id: 'node1',
        label: 'Test Node',
        type: 'default'
      }

      const result = validator.validateNode(validNode)

      expect(result.isValid).toBe(true)
    })

    it('should collect multiple validation errors', () => {
      const invalidNode: GraphNode = {
        id: '',
        label: '',
        type: 'default'
      }

      const result = validator.validateNode(invalidNode)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors.map(e => e.field)).toContain('id')
      expect(result.errors.map(e => e.field)).toContain('label')
    })
  })

  describe('validateEdge', () => {
    it('should validate a correct edge', () => {
      const validEdge: GraphEdge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        animated: false
      }

      const result = validator.validateEdge(validEdge)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject edge with empty id', () => {
      const invalidEdge: GraphEdge = {
        id: '',
        source: 'node1',
        target: 'node2',
        animated: false
      }

      const result = validator.validateEdge(invalidEdge)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('id')
      expect(result.errors[0].code).toBe('REQUIRED_FIELD')
    })

    it('should reject edge with empty source', () => {
      const invalidEdge: GraphEdge = {
        id: 'edge1',
        source: '',
        target: 'node2',
        animated: false
      }

      const result = validator.validateEdge(invalidEdge)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('source')
    })

    it('should reject edge with empty target', () => {
      const invalidEdge: GraphEdge = {
        id: 'edge1',
        source: 'node1',
        target: '',
        animated: false
      }

      const result = validator.validateEdge(invalidEdge)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('target')
    })

    it('should collect multiple validation errors', () => {
      const invalidEdge: GraphEdge = {
        id: '',
        source: '',
        target: '',
        animated: false
      }

      const result = validator.validateEdge(invalidEdge)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })
  })

  describe('validateGraph', () => {
    const validGraph: LangGraph = {
      nodes: [
        { id: 'node1', label: 'Node 1', type: 'default' },
        { id: 'node2', label: 'Node 2', type: 'default' }
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', animated: false }
      ]
    }

    it('should validate a correct graph', () => {
      const result = validator.validateGraph(validGraph)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate empty graph', () => {
      const emptyGraph: LangGraph = {
        nodes: [],
        edges: []
      }

      const result = validator.validateGraph(emptyGraph)

      expect(result.isValid).toBe(true)
    })

    it('should reject graph with invalid nodes', () => {
      const invalidGraph: LangGraph = {
        nodes: [
          { id: '', label: 'Node 1', type: 'default' },
          { id: 'node2', label: '', type: 'default' }
        ],
        edges: []
      }

      const result = validator.validateGraph(invalidGraph)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].field).toBe('nodes[0].id')
      expect(result.errors[1].field).toBe('nodes[1].label')
    })

    it('should reject graph with invalid edges', () => {
      const invalidGraph: LangGraph = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'default' }
        ],
        edges: [
          { id: '', source: 'node1', target: 'node2', animated: false }
        ]
      }

      const result = validator.validateGraph(invalidGraph)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.field === 'edges[0].id')).toBe(true)
    })

    it('should reject edge with non-existent source node', () => {
      const invalidGraph: LangGraph = {
        nodes: [
          { id: 'node2', label: 'Node 2', type: 'default' }
        ],
        edges: [
          { id: 'edge1', source: 'nonexistent', target: 'node2', animated: false }
        ]
      }

      const result = validator.validateGraph(invalidGraph)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => 
        e.field === 'edges[0].source' && e.code === 'INVALID_REFERENCE'
      )).toBe(true)
    })

    it('should reject edge with non-existent target node', () => {
      const invalidGraph: LangGraph = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'default' }
        ],
        edges: [
          { id: 'edge1', source: 'node1', target: 'nonexistent', animated: false }
        ]
      }

      const result = validator.validateGraph(invalidGraph)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => 
        e.field === 'edges[0].target' && e.code === 'INVALID_REFERENCE'
      )).toBe(true)
    })

    it('should reject graph with duplicate node IDs', () => {
      const invalidGraph: LangGraph = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'default' },
          { id: 'node1', label: 'Node 1 Duplicate', type: 'default' }
        ],
        edges: []
      }

      const result = validator.validateGraph(invalidGraph)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => 
        e.field === 'nodes' && e.code === 'DUPLICATE_ID'
      )).toBe(true)
    })

    it('should reject graph with duplicate edge IDs', () => {
      const invalidGraph: LangGraph = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'default' },
          { id: 'node2', label: 'Node 2', type: 'default' }
        ],
        edges: [
          { id: 'edge1', source: 'node1', target: 'node2', animated: false },
          { id: 'edge1', source: 'node2', target: 'node1', animated: false }
        ]
      }

      const result = validator.validateGraph(invalidGraph)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => 
        e.field === 'edges' && e.code === 'DUPLICATE_ID'
      )).toBe(true)
    })

    it('should collect all validation errors', () => {
      const invalidGraph: LangGraph = {
        nodes: [
          { id: '', label: '', type: 'default' },
          { id: 'node1', label: 'Node 1', type: 'default' }
        ],
        edges: [
          { id: '', source: '', target: 'nonexistent', animated: false }
        ]
      }

      const result = validator.validateGraph(invalidGraph)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(4) // Multiple errors expected
    })
  })

  describe('graphValidator singleton', () => {
    it('should export a working validator instance', () => {
      const validNode: GraphNode = {
        id: 'node1',
        label: 'Test Node',
        type: 'default'
      }

      const result = graphValidator.validateNode(validNode)

      expect(result.isValid).toBe(true)
    })
  })
})