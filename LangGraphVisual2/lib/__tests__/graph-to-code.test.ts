// Unit tests for graph-to-code functionality
import { generatePythonCode } from '../graph-to-code'
import type { LangGraph } from '../types'

describe('PythonCodeGenerator', () => {
  const mockGraph: LangGraph = {
    nodes: [
      { id: 'node1', label: 'Node 1', type: 'default' },
      { id: 'node2', label: 'Node 2', type: 'default' }
    ],
    edges: [
      { id: 'e1', source: 'node1', target: 'node2' }
    ]
  }

  describe('generatePythonCode', () => {
    it('should generate valid Python code for simple graph', () => {
      const result = generatePythonCode(mockGraph)
      
      expect(result).toContain('from langgraph.graph import StateGraph')
      expect(result).toContain('def node1(state: State):')
      expect(result).toContain('def node2(state: State):')
      expect(result).toContain('workflow.add_node("node1", node1)')
      expect(result).toContain('workflow.add_edge("node1", "node2")')
    })

    it('should return empty string for null graph', () => {
      const result = generatePythonCode(null as any)
      expect(result).toBe('')
    })

    it('should handle special START/END nodes correctly', () => {
      const graphWithSpecialNodes: LangGraph = {
        nodes: [
          { id: '__start__', label: 'START', type: 'input' },
          { id: 'node1', label: 'Node 1', type: 'default' },
          { id: '__end__', label: 'END', type: 'output' }
        ],
        edges: [
          { id: 'e1', source: '__start__', target: 'node1' },
          { id: 'e2', source: 'node1', target: '__end__' }
        ]
      }

      const result = generatePythonCode(graphWithSpecialNodes)
      expect(result).toContain('workflow.add_edge(START, "node1")')
      expect(result).toContain('workflow.add_edge("node1", END)')
      expect(result).not.toContain('def __start__(')
      expect(result).not.toContain('def __end__(')
    })

    it('should handle conditional edges', () => {
      const graphWithConditional: LangGraph = {
        nodes: [{ id: 'node1', label: 'Node 1', type: 'default' }],
        edges: [{ 
          id: 'e1', 
          source: 'node1', 
          target: 'node2', 
          label: 'condition_func',
          animated: true 
        }]
      }

      const result = generatePythonCode(graphWithConditional)
      expect(result).toContain('TODO: Add conditional edge logic')
      expect(result).toContain('condition: condition_func')
    })
  })

  describe('CodeGenerationUtils', () => {
    // These would test the utility functions once they're exported
  })
})