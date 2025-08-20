"use client"

import { useCallback, useEffect } from "react"
import type { LangGraph } from "@/lib/types"
import { LangGraphVisualizer } from "@/components/langgraph-visualizer"
import { AppHeader } from "@/components/app-header"
import { FloatingCodePanel } from "@/components/floating-code-panel"
import { EdgeEditingToolbar } from "@/components/edge-editing-toolbar"
import { Code } from 'lucide-react'
import { ImportExportButtons } from "@/components/import-export-buttons"

import { useGraph, useGraphActions } from '@/stores/graph-store'
import { useCode, useLanguage, useIsRunning, useIsGeneratingCode, useEditorActions } from '@/stores/editor-store'
import { useSelectedEdgeId, useSelectedNodeId, useIsCodePanelMinimized, useIsControlPanelMinimized, usePanelActions, useEditingActions } from '@/stores/ui-store'
import { useAddToast } from '@/stores/notification-store'
import { useI18n } from '@/stores/i18n-store'
import { EXECUTION_CONFIG } from "@/lib/constants"
 

export default function IndexPage() {
  const { t } = useI18n()

  // Store selectors
  const graph = useGraph()
  const { updateGraph, removeEdge, removeNode } = useGraphActions()
  
  const code = useCode()
  const language = useLanguage()
  const isRunning = useIsRunning()
  const isGeneratingCode = useIsGeneratingCode()
  const { updateCode, setIsRunning, setIsGeneratingCode, setLanguage } = useEditorActions()
  
  const selectedEdgeId = useSelectedEdgeId()
  const selectedNodeId = useSelectedNodeId()
  const isCodePanelMinimized = useIsCodePanelMinimized()
  const isControlPanelMinimized = useIsControlPanelMinimized()
  const { setCodePanelMinimized, setControlPanelMinimized } = usePanelActions()
  const { selectEdge, selectNode } = useEditingActions()
  
  const addToast = useAddToast()

  const handleToggleCodePanel = useCallback((minimized: boolean) => {
    setCodePanelMinimized(minimized)
  }, [setCodePanelMinimized])

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) {
      addToast({
        title: t("message.error"),
        description: "Please enter some code before running",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)
    try {
      // 로딩 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, EXECUTION_CONFIG.LOADING_SIMULATION_DELAY))

      // Use explicitly selected language from store
      let parseResult
      let parsedGraph

      if (language === 'typescript') {
        // Use TypeScript parser
        const { parseTypeScriptCode, convertToLangGraph } = await import("@/lib/typescript-parser")
        parseResult = parseTypeScriptCode(code)
        parsedGraph = convertToLangGraph(parseResult)
      } else {
        // Use Python parser (AST-first async)
        const { parseLangGraphCodeAsync, convertToLangGraph } = await import("@/lib/python-parser")
        parseResult = await parseLangGraphCodeAsync(code)
        parsedGraph = convertToLangGraph(parseResult)
      }

      if (!parseResult.success) {
        throw new Error(parseResult.error || `Failed to parse LangGraph code (detected: ${language})`)
      }

      if (!parsedGraph || parsedGraph.nodes.length === 0) {
        throw new Error(`No valid LangGraph workflow found in the ${language} code`)
      }

      updateGraph(parsedGraph)

      addToast({
        title: t("message.success"),
        description: `Successfully parsed ${language.toUpperCase()} code: ${parsedGraph.nodes.length} nodes, ${parsedGraph.edges.length} edges`,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      addToast({
        title: t("message.error"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }, [code, language, setIsRunning, updateGraph, addToast, t])

  const handleImport = useCallback((data: { graph: LangGraph; code: string }) => {
    updateGraph(data.graph)
    updateCode(data.code)
  }, [updateGraph, updateCode])

  const handleGenerateCode = useCallback(async () => {
    if (!graph) {
      addToast({
        title: "No Graph",
        description: "Please create a graph first by running your code",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingCode(true)
    try {
      const { generateCode, getLanguageDisplayName } = await import("@/lib/graph-to-code")
      const generatedCode = generateCode(graph, language)
      updateCode(generatedCode)

      addToast({
        title: "Code Generated",
        description: `${getLanguageDisplayName(language)} code has been generated from the current graph`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      addToast({
        title: "Generation Failed",
        description: `Failed to generate ${language} code: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }, [graph, language, setIsGeneratingCode, updateCode, addToast])

  // Handle import from templates page via sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem('importFromTemplate')
      if (!raw) return
      const data = JSON.parse(raw) as { code?: string; language?: 'python' | 'typescript' | 'javascript'; autorun?: boolean }
      const codeToSet = typeof data.code === 'string' ? data.code : ''
      const langRaw = (data.language === 'javascript' ? 'typescript' : data.language) as 'python' | 'typescript' | undefined
      if (langRaw) setLanguage(langRaw)
      if (codeToSet) updateCode(codeToSet)
      // Optionally autorun after state updates
      if (data.autorun) {
        setTimeout(() => {
          void handleRunCode()
        }, 0)
      }
    } catch {
      // ignore
    } finally {
      try { sessionStorage.removeItem('importFromTemplate') } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Delete handlers
  const handleDeleteEdge = useCallback(() => {
    if (selectedEdgeId) {
      removeEdge(selectedEdgeId)
      selectEdge(null)
      addToast({
        title: "Edge Deleted",
        description: "The selected edge has been removed from the graph",
      })
    }
  }, [selectedEdgeId, removeEdge, selectEdge, addToast])

  const handleDeleteNode = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId)
      selectNode(null)
      addToast({
        title: "Node Deleted", 
        description: "The selected node and its connected edges have been removed from the graph",
      })
    }
  }, [selectedNodeId, removeNode, selectNode, addToast])

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <AppHeader />

      {/* ReactFlow Background - Full Screen with padding */}
      <div className="flex-1 relative p-4">
        <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <LangGraphVisualizer />
        </div>

        {/* Floating Code Editor Panel - Left Side */}
        <FloatingCodePanel
          isMinimized={isCodePanelMinimized}
          onToggleMinimized={handleToggleCodePanel}
          code={code}
          onCodeChange={updateCode}
          onRunCode={handleRunCode}
          isRunning={isRunning}
          runButtonText={isRunning ? t("button.running") : t("button.run")}
        />

        {/* Floating Tools Panel - Right Side */}
        <div className={`absolute top-8 right-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-10 transition-all duration-300 ${isControlPanelMinimized
          ? 'w-12 h-12'
          : 'w-auto min-w-64'
          }`}>
          {isControlPanelMinimized ? (
            <div className="flex items-center justify-center h-full">
              <button
                onClick={() => setControlPanelMinimized(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tools</h3>
                <button
                  onClick={() => setControlPanelMinimized(true)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Import / Export */}
                <div>
                  <ImportExportButtons onImport={handleImport} />
                </div>
                {/* Edge Editing Toolbar */}
                <div className="mb-2">
                  <EdgeEditingToolbar 
                    className="border-0 shadow-none p-0 bg-transparent"
                    onDeleteEdge={handleDeleteEdge}
                    onDeleteNode={handleDeleteNode}
                  />
                </div>

                {/* Code Generator */}
                <button
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode || !graph}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  {isGeneratingCode ? "Generating..." : `Generate ${language.charAt(0).toUpperCase() + language.slice(1)} Code`}
                </button>

                {graph && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Graph Stats
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Nodes</span>
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {graph.nodes.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Edges</span>
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {graph.edges.length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!graph && (
                  <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
                    Run your code to see graph statistics
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
