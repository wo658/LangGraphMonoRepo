"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { aiGenerate } from '@/lib/api'
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
  const router = useRouter()
  const language = useLanguage()
  const { setLanguage } = useEditorActions()
  const [mounted, setMounted] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [aiCode, setAiCode] = useState<string>('')
  const [aiError, setAiError] = useState<string | null>(null)
  const editorRef = useRef<any>(null)
  const lastDetectedLanguage = useRef<string>('')

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAIOpen = useCallback(() => {
    setAiOpen(true)
    setAiInstruction('')
    setAiMessage(null)
    setAiCode('')
    setAiError(null)
  }, [])

  const handleAIGenerate = useCallback(async () => {
    if (!aiInstruction.trim()) {
      setAiError('Instruction is required')
      return
    }
    setAiLoading(true)
    setAiError(null)
    setAiMessage(null)
    try {
      const inputCode = aiCode && aiCode.trim().length > 0 ? aiCode : value
      const data = await aiGenerate({ language, instruction: aiInstruction, code: inputCode, stream: false })
      setAiMessage(data.message || '')
      setAiCode((data.code ?? '').length > 0 ? data.code : (aiCode || ''))
    } catch (e: any) {
      setAiError(e?.message || 'Network error')
    } finally {
      setAiLoading(false)
    }
  }, [aiInstruction, language, value, aiCode])

  // Save as Template: skip validation, store draft, and navigate
  const handleSaveAsTemplate = useCallback(() => {
    try {
      const draft = {
        code: value,
        language: language,
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('newTemplateInitial', JSON.stringify(draft))
      }
    } catch {}
    router.push('/templates')
  }, [language, value, router])

  // 언어 변경 핸들러 메모이제이션
  const handleLanguageChange = useCallback((value: 'python' | 'typescript') => {
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
  const configureMonacoForLanguage = useCallback((monaco: any, lang: 'python' | 'typescript') => {
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

    if (lang === 'typescript') {
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
      } catch (error) {
        // 이미 존재하는 경우 무시
      }

      // TypeScript 설정 적용
      if (lang === 'typescript') {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          onlyVisible: true,
          diagnosticCodesToIgnore: commonIgnoredErrors
        })
      }
    }
  }, [])

  // Load example code (removed)

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
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        {/* 첫 번째 줄 - 제목과 언어 선택 */}
        <div className="flex items-center justify-between mb-2">
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
                  {/* JavaScript option removed */}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            title="Minimize editor"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
        
        {/* 두 번째 줄 - 액션 버튼들 */}
        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAIOpen}
              className="h-7 px-2 text-xs"
              title="AI Generate (open dialog)"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAsTemplate}
              className="h-7 px-2 text-xs"
              title="Save current code as a template"
            >
              Save as Template
            </Button>
          </div>
          
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

      {/* AI Generate Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>AI Generate</DialogTitle>
            <DialogDescription>
              Describe how the current code should be modified. The selected language is <b>{language}</b>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ai-instruction">Instruction</Label>
              <textarea
                id="ai-instruction"
                className="w-full min-h-[120px] p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="e.g., Refactor to use LangGraph StateGraph with conditional edges and add proper typing."
              />
              {aiError && (
                <p className="text-sm text-red-600 dark:text-red-400">{aiError}</p>
              )}
            </div>

            {(aiMessage || aiCode) && (
              <div className="space-y-2">
                {aiMessage && (
                  <>
                    <Label>Message</Label>
                    <pre className="whitespace-pre-wrap text-xs p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-h-[200px] overflow-auto">{aiMessage}</pre>
                  </>
                )}
                {aiCode && (
                  <>
                    <Label>Code</Label>
                    <pre className="whitespace-pre text-xs p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-h-[300px] overflow-auto">{aiCode}</pre>
                  </>
                )}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!aiCode}
                    onClick={() => { onChange(aiCode); setAiOpen(false) }}
                  >
                    Apply to editor
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setAiOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={handleAIGenerate} disabled={aiLoading}>
                {aiLoading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}