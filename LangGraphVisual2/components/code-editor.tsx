"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Minimize2, Settings, Code2 } from 'lucide-react'
import { pythonSnippets } from '@/utils/python-snippets'
import { typescriptSnippets } from '@/utils/typescript-snippets'
import { useLanguage, useEditorActions } from '@/stores/editor-store'

// Monaco Editor를 동적으로 로드하여 SSR 문제 방지
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading editor...</div>
      </div>
    ),
  }
)

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  isRunning: boolean
  runButtonText: string
  onMinimize: () => void
  className?: string
}

// 언어 감지 함수
const detectLanguage = (code: string): 'python' | 'typescript' | 'javascript' => {
  // Python 특징적인 패턴들
  const pythonPatterns = [
    /def\s+\w+\s*\(/,
    /import\s+\w+/,
    /from\s+\w+\s+import/,
    /class\s+\w+\s*\(/,
    /:\s*$/m,
    /__\w+__/,
    /self\./,
    /print\s*\(/,
    /langgraph/i,
    /StateGraph/
  ]

  // TypeScript 특징적인 패턴들
  const typescriptPatterns = [
    /:\s*(string|number|boolean|object|any|unknown|void|never)/,
    /interface\s+\w+/,
    /type\s+\w+\s*=/,
    /enum\s+\w+/,
    /<\w+>/,
    /as\s+\w+/,
    /import.*from.*['"].*\.ts['"]/
  ]

  // JavaScript 특징적인 패턴들
  const javascriptPatterns = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /=>\s*{/,
    /console\.log/,
    /document\./,
    /window\./,
    /require\s*\(/
  ]

  // 패턴 점수 계산
  const pythonScore = pythonPatterns.reduce((score, pattern) => {
    return score + (pattern.test(code) ? 1 : 0)
  }, 0)

  const typescriptScore = typescriptPatterns.reduce((score, pattern) => {
    return score + (pattern.test(code) ? 1 : 0)
  }, 0)

  const javascriptScore = javascriptPatterns.reduce((score, pattern) => {
    return score + (pattern.test(code) ? 1 : 0)
  }, 0)

  // 가장 높은 점수의 언어 반환
  if (pythonScore >= typescriptScore && pythonScore >= javascriptScore) {
    return 'python'
  } else if (typescriptScore > javascriptScore) {
    return 'typescript'
  } else {
    return 'javascript'
  }
}

export function CodeEditor({
  value,
  onChange,
  onRun,
  isRunning,
  runButtonText,
  onMinimize,
  className = ""
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme()
  const language = useLanguage()
  const { setLanguage } = useEditorActions()
  const [mounted, setMounted] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const editorRef = useRef<any>(null)
  const examplesRef = useRef<HTMLDivElement>(null)
  const lastDetectedLanguage = useRef<string>('')

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    setMounted(true)
  }, [])

  // 언어 변경 핸들러 메모이제이션
  const handleLanguageChange = useCallback((value: 'python' | 'typescript' | 'javascript') => {
    setLanguage(value)
    // 언어 변경 시 Monaco 설정 재적용
    if (editorRef.current) {
      const monaco = (window as any).monaco
      if (monaco) {
        configureMonacoForLanguage(monaco, value)
      }
    }
  }, [])

  // Monaco 언어별 설정 함수
  const configureMonacoForLanguage = useCallback((monaco: any, lang: 'python' | 'typescript' | 'javascript') => {
    // 전역 에러 코드 무시 설정 (모든 언어에 적용)
    const commonIgnoredErrors = [
      2792, // Cannot find module
      2307, // Cannot find module or its corresponding type declarations  
      1192, // Module has no default export
      7016, // Could not find a declaration file for module
      8010, // Type annotations can only be used in TypeScript files
      8006, // 'interface' declarations can only be used in TypeScript files
      8009, // 'enum' declarations can only be used in TypeScript files
      8011, // 'namespace' declarations can only be used in TypeScript files
      1005, // ';' expected
      1002, // Unterminated string literal
      1003, // Identifier expected
      1109, // Expression expected
    ]

    if (lang === 'typescript' || lang === 'javascript') {
      // TypeScript 컴파일러 옵션 설정
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        lib: ['ES2020', 'DOM'],
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        allowJs: true,
        strict: false,
        skipLibCheck: true,
        typeRoots: ['node_modules/@types']
      })

      // JavaScript 컴파일러 옵션 설정
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        lib: ['ES2020', 'DOM'],
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: false,
        noEmit: true
      })

      // LangGraph 모듈 타입 정의
      const langGraphTypes = `
declare module "langgraph" {
  export interface StateGraphInterface<T = any> {
    addNode(name: string, func: (state: T) => Promise<T> | T): void
    addEdge(from: string, to: string): void
    addConditionalEdges(
      source: string, 
      condition: (state: T) => string,
      mapping: Record<string, string>
    ): void
    setEntryPoint(name: string): void
    compile(): any
  }
  
  export class StateGraph<T = any> implements StateGraphInterface<T> {
    constructor(initialState?: T)
    addNode(name: string, func: (state: T) => Promise<T> | T): void
    addEdge(from: string, to: string): void
    addConditionalEdges(
      source: string, 
      condition: (state: T) => string,
      mapping: Record<string, string>
    ): void
    setEntryPoint(name: string): void
    compile(): any
  }
  
  export const START: string
  export const END: string
}

declare module "langgraph/graph" {
  export * from "langgraph"
}

// Global types for common patterns
declare global {
  interface Window {
    StateGraph: any
  }
}
`

      // 기존 라이브러리 제거 후 새로 추가 (중복 방지)
      const uri = monaco.Uri.parse('ts:filename/langgraph.d.ts')
      try {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(langGraphTypes, uri.toString())
        monaco.languages.typescript.javascriptDefaults.addExtraLib(langGraphTypes, uri.toString())
      } catch (error) {
        // 이미 존재하는 경우 무시
      }

      // TypeScript와 JavaScript 각각 다른 설정 적용
      if (lang === 'typescript') {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          onlyVisible: true,
          diagnosticCodesToIgnore: commonIgnoredErrors
        })
      } else if (lang === 'javascript') {
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true, // JavaScript는 시맨틱 검증 완전 비활성화
          noSyntaxValidation: false,
          onlyVisible: true
        })

        // JavaScript에서 TypeScript 전용 에러들 무시 (TypeScript 기본 설정에도 적용)
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          onlyVisible: true,
          diagnosticCodesToIgnore: commonIgnoredErrors
        })
      }
    }
  }, [])

  // Close examples dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(event.target as Node)) {
        setShowExamples(false)
      }
    }

    if (showExamples) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExamples])

  // Load example code
  const handleLoadExample = useCallback((exampleKey: string) => {
    let exampleCode = ''
    
    if (language === 'python') {
      if (exampleKey === 'basic') {
        exampleCode = pythonSnippets.langgraph_basic
      } else if (exampleKey === 'conditional') {
        exampleCode = pythonSnippets.conditional_edge
      } else if (exampleKey === 'state') {
        exampleCode = pythonSnippets.state_definition
      }
    } else {
      // TypeScript/JavaScript examples
      if (exampleKey in typescriptSnippets) {
        exampleCode = typescriptSnippets[exampleKey as keyof typeof typescriptSnippets]
      }
    }
    
    if (exampleCode) {
      onChange(exampleCode)
      setShowExamples(false)
    }
  }, [language, onChange])

  // 언어 자동 감지 비활성화 - 무한 루프 방지
  // useEffect(() => {
  //   if (value.trim()) {
  //     const detectedLanguage = detectLanguage(value)
  //     if (detectedLanguage !== lastDetectedLanguage.current) {
  //       lastDetectedLanguage.current = detectedLanguage
  //       setLanguage(detectedLanguage)
  //     }
  //   }
  // }, [value])

  // Monaco Editor 설정
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    wordWrap: 'on' as const,
    tabSize: language === 'python' ? 4 : 2,
    insertSpaces: true,
    scrollBeyondLastLine: false,
    folding: true,
    glyphMargin: false,
    contextmenu: true,
    selectOnLineNumbers: true,
    matchBrackets: 'always' as const,
    automaticLayout: true,
    fixedOverflowWidgets: true,
    scrollbar: {
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showFunctions: true,
      showVariables: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    parameterHints: {
      enabled: true,
    },
    hover: {
      enabled: true,
    },
    bracketPairColorization: {
      enabled: true,
    },
    guides: {
      indentation: true,
      bracketPairs: true,
    },
  }

  // 에디터 마운트 핸들러
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // 키보드 단축키 설정
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun()
    })

    // Monaco를 전역에 저장 (언어 변경 시 사용)
    ;(window as any).monaco = monaco

    // 현재 언어에 맞는 Monaco 설정 적용
    configureMonacoForLanguage(monaco, language)

    // Python용 추가 설정
    if (language === 'python') {
      // Python 스니펫 추가
      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => {
          return {
            suggestions: [
              {
                label: 'def',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'def ${1:function_name}(${2:parameters}):\n    ${3:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Function definition'
              },
              {
                label: 'class',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'class ${1:ClassName}:\n    def __init__(self${2:, parameters}):\n        ${3:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Class definition'
              },
              {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'if ${1:condition}:\n    ${2:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement'
              },
              {
                label: 'for',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop'
              },
              {
                label: 'try',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Try-except block'
              }
            ]
          }
        }
      })
    }
  }

  // 언어별 Monaco 언어 매핑
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'python':
        return 'python'
      case 'typescript':
        return 'typescript'
      case 'javascript':
        return 'javascript'
      default:
        return 'python'
    }
  }

  if (!mounted) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-muted-foreground">Loading editor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold">Code Editor</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Language:</span>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-24 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 relative">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setShowExamples(!showExamples)}
            className="h-7 w-7 p-0"
            title="Load example code"
          >
            <Code2 className="w-3 h-3" />
          </Button>
          <Button
            onClick={onRun}
            disabled={isRunning}
            size="sm"
            className="h-7 px-3 text-xs"
            title="Run code (Ctrl/Cmd + Enter)"
          >
            <Play className="w-3 h-3 mr-1" />
            {runButtonText}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="h-7 w-7 p-0"
            title="Minimize editor"
          >
            <Minimize2 className="w-3 h-3" />
          </Button>

          {/* Examples Dropdown */}
          {showExamples && (
            <div
              ref={examplesRef}
              className="absolute top-8 right-0 w-64 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50"
            >
              <h3 className="text-sm font-semibold mb-3">Code Examples</h3>
              
              {language === 'python' ? (
                <div className="space-y-1">
                  <button
                    onClick={() => handleLoadExample('basic')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Basic LangGraph Workflow
                  </button>
                  <button
                    onClick={() => handleLoadExample('conditional')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Conditional Edges
                  </button>
                  <button
                    onClick={() => handleLoadExample('state')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    State Definition
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => handleLoadExample('basic')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Basic Workflow
                  </button>
                  <button
                    onClick={() => handleLoadExample('conditional')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Conditional Routing
                  </button>
                  <button
                    onClick={() => handleLoadExample('javascript')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    JavaScript Example
                  </button>
                  <button
                    onClick={() => handleLoadExample('complexWorkflow')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Complex Workflow
                  </button>
                  <button
                    onClick={() => handleLoadExample('withLoops')}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    With Feedback Loops
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          width="100%"
          language={getMonacoLanguage(language)}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
          value={value}
          onChange={(v) => onChange(v || '')}
          options={editorOptions}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading Monaco Editor...</div>
            </div>
          }
        />
      </div>
    </div>
  )
}