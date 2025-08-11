import { pythonSnippets, pythonKeywords, langgraphKeywords } from '../python-snippets'

describe('python-snippets', () => {
  describe('pythonSnippets', () => {
    it('should contain basic LangGraph snippet', () => {
      expect(pythonSnippets.langgraph_basic).toBeDefined()
      expect(pythonSnippets.langgraph_basic).toContain('StateGraph')
      expect(pythonSnippets.langgraph_basic).toContain('add_node')
      expect(pythonSnippets.langgraph_basic).toContain('set_entry_point')
      expect(pythonSnippets.langgraph_basic).toContain('compile')
    })

    it('should contain conditional edge snippet', () => {
      expect(pythonSnippets.conditional_edge).toBeDefined()
      expect(pythonSnippets.conditional_edge).toContain('add_conditional_edges')
      expect(pythonSnippets.conditional_edge).toContain('should_continue')
      expect(pythonSnippets.conditional_edge).toContain('END')
    })

    it('should contain state definition snippet', () => {
      expect(pythonSnippets.state_definition).toBeDefined()
      expect(pythonSnippets.state_definition).toContain('TypedDict')
      expect(pythonSnippets.state_definition).toContain('AgentState')
      expect(pythonSnippets.state_definition).toContain('messages')
    })

    it('should have valid Python syntax in snippets', () => {
      // Basic syntax checks
      expect(pythonSnippets.langgraph_basic).toMatch(/class \w+\(TypedDict\):/)
      expect(pythonSnippets.langgraph_basic).toMatch(/def \w+\(/)
      expect(pythonSnippets.langgraph_basic).toMatch(/workflow = StateGraph\(/)
      
      expect(pythonSnippets.conditional_edge).toMatch(/def \w+\(/)
      expect(pythonSnippets.conditional_edge).toMatch(/if \w+:/)
      expect(pythonSnippets.conditional_edge).toMatch(/return/)
    })

    it('should contain proper indentation', () => {
      const lines = pythonSnippets.langgraph_basic.split('\n')
      const classBodyLines = lines.filter(line => 
        line.includes('messages:') || line.includes('current_step:')
      )
      
      // Class body should be indented
      classBodyLines.forEach(line => {
        expect(line).toMatch(/^\s+/)
      })
    })
  })

  describe('pythonKeywords', () => {
    it('should contain essential Python keywords', () => {
      const essentialKeywords = [
        'def', 'class', 'if', 'else', 'for', 'while',
        'import', 'from', 'return', 'True', 'False', 'None'
      ]
      
      essentialKeywords.forEach(keyword => {
        expect(pythonKeywords).toContain(keyword)
      })
    })

    it('should contain logical operators', () => {
      expect(pythonKeywords).toContain('and')
      expect(pythonKeywords).toContain('or')
      expect(pythonKeywords).toContain('not')
      expect(pythonKeywords).toContain('in')
      expect(pythonKeywords).toContain('is')
    })

    it('should contain control flow keywords', () => {
      expect(pythonKeywords).toContain('break')
      expect(pythonKeywords).toContain('continue')
      expect(pythonKeywords).toContain('pass')
      expect(pythonKeywords).toContain('try')
      expect(pythonKeywords).toContain('except')
      expect(pythonKeywords).toContain('finally')
    })

    it('should not contain duplicates', () => {
      const uniqueKeywords = [...new Set(pythonKeywords)]
      expect(uniqueKeywords).toHaveLength(pythonKeywords.length)
    })

    it('should be sorted or at least consistent', () => {
      pythonKeywords.forEach(keyword => {
        expect(typeof keyword).toBe('string')
        expect(keyword.length).toBeGreaterThan(0)
      })
    })
  })

  describe('langgraphKeywords', () => {
    it('should contain core LangGraph classes', () => {
      expect(langgraphKeywords).toContain('StateGraph')
      expect(langgraphKeywords).toContain('END')
      expect(langgraphKeywords).toContain('TypedDict')
    })

    it('should contain workflow methods', () => {
      expect(langgraphKeywords).toContain('add_node')
      expect(langgraphKeywords).toContain('add_edge')
      expect(langgraphKeywords).toContain('add_conditional_edges')
      expect(langgraphKeywords).toContain('set_entry_point')
      expect(langgraphKeywords).toContain('compile')
    })

    it('should not contain duplicates', () => {
      const uniqueKeywords = [...new Set(langgraphKeywords)]
      expect(uniqueKeywords).toHaveLength(langgraphKeywords.length)
    })

    it('should be valid identifiers', () => {
      langgraphKeywords.forEach(keyword => {
        expect(typeof keyword).toBe('string')
        expect(keyword).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
      })
    })

    it('should not overlap with Python keywords', () => {
      const overlap = langgraphKeywords.filter(keyword => 
        pythonKeywords.includes(keyword)
      )
      expect(overlap).toHaveLength(0)
    })
  })

  describe('snippet integration', () => {
    it('should use keywords from keyword arrays in snippets', () => {
      const allKeywords = [...pythonKeywords, ...langgraphKeywords]
      
      // Check if snippets use the defined keywords
      const basicSnippet = pythonSnippets.langgraph_basic
      expect(allKeywords.some(keyword => basicSnippet.includes(keyword))).toBe(true)
      
      const conditionalSnippet = pythonSnippets.conditional_edge
      expect(allKeywords.some(keyword => conditionalSnippet.includes(keyword))).toBe(true)
    })

    it('should have consistent naming conventions', () => {
      // Check that class names are PascalCase
      expect(pythonSnippets.state_definition).toMatch(/class [A-Z][a-zA-Z]*/)
      
      // Check that function names are snake_case
      expect(pythonSnippets.langgraph_basic).toMatch(/def [a-z][a-z_]*/)
      expect(pythonSnippets.conditional_edge).toMatch(/def [a-z][a-z_]*/)
    })

    it('should have proper imports in basic snippet', () => {
      expect(pythonSnippets.langgraph_basic).toContain('from langgraph import')
      expect(pythonSnippets.langgraph_basic).toContain('from typing import')
    })
  })

  describe('code quality', () => {
    it('should have proper Python syntax structure', () => {
      // Check for proper class definition
      expect(pythonSnippets.state_definition).toMatch(/class \w+\(TypedDict\):\s*\n/)
      
      // Check for proper function definition
      expect(pythonSnippets.langgraph_basic).toMatch(/def \w+\([^)]*\):\s*\n/)
      
      // Check for proper conditional structure
      expect(pythonSnippets.conditional_edge).toMatch(/if \w+:\s*\n/)
    })

    it('should use consistent indentation (4 spaces)', () => {
      const snippets = Object.values(pythonSnippets)
      
      snippets.forEach(snippet => {
        const lines = snippet.split('\n')
        const indentedLines = lines.filter(line => line.match(/^\s+\S/))
        
        indentedLines.forEach(line => {
          const leadingSpaces = line.match(/^(\s*)/)?.[1] || ''
          // Should be multiple of 4 spaces (Python convention)
          expect(leadingSpaces.length % 4).toBe(0)
        })
      })
    })

    it('should not have trailing whitespace', () => {
      Object.values(pythonSnippets).forEach(snippet => {
        const lines = snippet.split('\n')
        lines.forEach(line => {
          expect(line).not.toMatch(/\s+$/)
        })
      })
    })
  })
})