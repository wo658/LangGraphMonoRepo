import {
  getNodeConnectionPoints,
  calculateDistance,
  getOptimalConnectionPoints,
  distanceFromPointToLine,
  checkEdgeNodeCollision,
  checkEdgeEdgeCollision,
  generateCurvedPath,
  calculateEdgeCurvatures,
  createStyledEdge,
  createStyledEdgesWithCollisionAvoidance
} from '../edge-utils'
import type { Node } from 'reactflow'
import type { GraphEdge } from '../types'

describe('edge-utils', () => {
  const mockNode: Node = {
    id: 'test-node',
    position: { x: 100, y: 100 },
    data: {},
    type: 'default'
  }

  const mockNode2: Node = {
    id: 'test-node-2',
    position: { x: 300, y: 200 },
    data: {},
    type: 'default'
  }

  describe('getNodeConnectionPoints', () => {
    it('should return 4 connection points for a node', () => {
      const points = getNodeConnectionPoints(mockNode)
      
      expect(points).toHaveLength(4)
      expect(points.map(p => p.position)).toEqual(['top', 'right', 'bottom', 'left'])
    })

    it('should calculate correct positions for connection points', () => {
      const points = getNodeConnectionPoints(mockNode)
      
      // Node center should be at (160, 120) for 120x40 node at (100, 100)
      expect(points[0]).toEqual({ id: 'top', position: 'top', x: 160, y: 100 })
      expect(points[1]).toEqual({ id: 'right', position: 'right', x: 220, y: 120 })
      expect(points[2]).toEqual({ id: 'bottom', position: 'bottom', x: 160, y: 140 })
      expect(points[3]).toEqual({ id: 'left', position: 'left', x: 100, y: 120 })
    })
  })

  describe('calculateDistance', () => {
    it('should calculate correct distance between two points', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 3, y: 4 }
      
      expect(calculateDistance(p1, p2)).toBe(5)
    })

    it('should return 0 for same points', () => {
      const p1 = { x: 10, y: 20 }
      const p2 = { x: 10, y: 20 }
      
      expect(calculateDistance(p1, p2)).toBe(0)
    })
  })

  describe('getOptimalConnectionPoints', () => {
    it('should return connection points for two nodes', () => {
      const result = getOptimalConnectionPoints(mockNode, mockNode2)
      
      expect(result).toHaveProperty('sourceHandle')
      expect(result).toHaveProperty('targetHandle')
      expect(result.sourceHandle).toContain('-source')
    })

    it('should find the closest connection points', () => {
      const closeNode: Node = {
        id: 'close-node',
        position: { x: 250, y: 100 }, // Right next to mockNode
        data: {},
        type: 'default'
      }
      
      const result = getOptimalConnectionPoints(mockNode, closeNode)
      
      // Should connect right to left since nodes are horizontally aligned
      expect(result.sourceHandle).toBe('right-source')
      expect(result.targetHandle).toBe('left')
    })
  })

  describe('distanceFromPointToLine', () => {
    it('should calculate distance from point to line segment', () => {
      const point = { x: 0, y: 1 }
      const lineStart = { x: -1, y: 0 }
      const lineEnd = { x: 1, y: 0 }
      
      expect(distanceFromPointToLine(point, lineStart, lineEnd)).toBe(1)
    })

    it('should handle point on line', () => {
      const point = { x: 0, y: 0 }
      const lineStart = { x: -1, y: 0 }
      const lineEnd = { x: 1, y: 0 }
      
      expect(distanceFromPointToLine(point, lineStart, lineEnd)).toBe(0)
    })
  })

  describe('checkEdgeNodeCollision', () => {
    it('should detect collision when edge passes close to node', () => {
      const edgeStart = { x: 50, y: 120 }
      const edgeEnd = { x: 250, y: 120 }
      
      const collision = checkEdgeNodeCollision(edgeStart, edgeEnd, mockNode, 30)
      
      expect(collision).toBe(true)
    })

    it('should not detect collision when edge is far from node', () => {
      const edgeStart = { x: 50, y: 50 }
      const edgeEnd = { x: 250, y: 50 }
      
      const collision = checkEdgeNodeCollision(edgeStart, edgeEnd, mockNode, 30)
      
      expect(collision).toBe(false)
    })
  })

  describe('checkEdgeEdgeCollision', () => {
    it('should detect intersection of two crossing edges', () => {
      const edge1Start = { x: 0, y: 0 }
      const edge1End = { x: 10, y: 10 }
      const edge2Start = { x: 0, y: 10 }
      const edge2End = { x: 10, y: 0 }
      
      const collision = checkEdgeEdgeCollision(edge1Start, edge1End, edge2Start, edge2End)
      
      expect(collision).toBe(true)
    })

    it('should not detect collision for parallel edges', () => {
      const edge1Start = { x: 0, y: 0 }
      const edge1End = { x: 10, y: 0 }
      const edge2Start = { x: 0, y: 5 }
      const edge2End = { x: 10, y: 5 }
      
      const collision = checkEdgeEdgeCollision(edge1Start, edge1End, edge2Start, edge2End)
      
      expect(collision).toBe(false)
    })
  })

  describe('generateCurvedPath', () => {
    it('should generate SVG path for curved line', () => {
      const start = { x: 0, y: 0 }
      const end = { x: 100, y: 0 }
      
      const path = generateCurvedPath(start, end, 0.3)
      
      expect(path).toMatch(/^M 0,0 Q .+ 100,0$/)
    })

    it('should handle zero curvature', () => {
      const start = { x: 0, y: 0 }
      const end = { x: 100, y: 0 }
      
      const path = generateCurvedPath(start, end, 0)
      
      expect(path).toBe('M 0,0 Q 50,0 100,0')
    })
  })

  describe('calculateEdgeCurvatures', () => {
    const mockEdges: GraphEdge[] = [
      { id: 'e1', source: 'test-node', target: 'test-node-2', animated: false }
    ]

    const mockNodes: Node[] = [mockNode, mockNode2]

    it('should calculate curvatures for edges', () => {
      const result = calculateEdgeCurvatures(mockEdges, mockNodes)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('edge')
      expect(result[0]).toHaveProperty('curvature')
      expect(result[0]).toHaveProperty('distance')
      expect(result[0].curvature).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty edges array', () => {
      const result = calculateEdgeCurvatures([], mockNodes)
      
      expect(result).toHaveLength(0)
    })

    it('should handle missing nodes', () => {
      const edgesWithMissingNodes: GraphEdge[] = [
        { id: 'e1', source: 'missing-node', target: 'test-node-2', animated: false }
      ]
      
      const result = calculateEdgeCurvatures(edgesWithMissingNodes, mockNodes)
      
      expect(result).toHaveLength(1)
      expect(result[0].distance).toBe(Infinity)
    })
  })

  describe('createStyledEdge', () => {
    const mockGraphEdge: GraphEdge = {
      id: 'e1',
      source: 'test-node',
      target: 'test-node-2',
      animated: false
    }

    it('should create styled edge with basic properties', () => {
      const result = createStyledEdge(mockGraphEdge, false, [mockNode, mockNode2], 0)
      
      expect(result.id).toBe('e1')
      expect(result.source).toBe('test-node')
      expect(result.target).toBe('test-node-2')
      expect(result.type).toBe('curved')
    })

    it('should apply dark theme styles', () => {
      const result = createStyledEdge(mockGraphEdge, true, [mockNode, mockNode2], 0)
      
      expect(result.style?.stroke).toBe('#9ca3af')
    })

    it('should apply light theme styles', () => {
      const result = createStyledEdge(mockGraphEdge, false, [mockNode, mockNode2], 0)
      
      expect(result.style?.stroke).toBe('#6b7280')
    })

    it('should handle loop feedback edges', () => {
      const loopEdge: GraphEdge = {
        ...mockGraphEdge,
        isLoopFeedback: true
      }
      
      const result = createStyledEdge(loopEdge, false, [mockNode, mockNode2], 0)
      
      expect(result.style?.stroke).toBe('#ef4444')
      expect(result.style?.strokeWidth).toBe(3)
      expect(result.style?.strokeDasharray).toBe('8 4')
    })
  })

  describe('createStyledEdgesWithCollisionAvoidance', () => {
    const mockGraphEdges: GraphEdge[] = [
      { id: 'e1', source: 'test-node', target: 'test-node-2', animated: false },
      { id: 'e2', source: 'test-node-2', target: 'test-node', animated: false }
    ]

    it('should create styled edges with collision avoidance', () => {
      const result = createStyledEdgesWithCollisionAvoidance(mockGraphEdges, [mockNode, mockNode2], false)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('data')
      expect(result[0].data).toHaveProperty('curvature')
    })

    it('should handle empty edges array', () => {
      const result = createStyledEdgesWithCollisionAvoidance([], [mockNode, mockNode2], false)
      
      expect(result).toHaveLength(0)
    })

    it('should handle empty nodes array', () => {
      const result = createStyledEdgesWithCollisionAvoidance(mockGraphEdges, [], false)
      
      expect(result).toHaveLength(2)
      // Should still create edges but with default values
    })
  })
})