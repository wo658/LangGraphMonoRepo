"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import ReactFlow, { Background, BackgroundVariant, ReactFlowProvider, type Edge, type Node } from "reactflow"
import "reactflow/dist/style.css"
import type { LangGraph } from "@/lib/types"

export type GraphPreviewProps = {
  code: string
  language: "python" | "typescript" | "javascript"
  height?: number | string
  className?: string
  compact?: boolean
}

function TinyFlow({ graph, height = 160, compact = false }: { graph: LangGraph | null; height?: number | string; compact?: boolean }) {

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [] as Node[], edges: [] as Edge[] }

    const nodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      position: n.position ?? { x: 0, y: 0 },
      data: {
        label: compact ? (
          <div className="text-[10px] leading-tight px-1 py-0.5">{n.label}</div>
        ) : (
          n.label
        ),
      },
      type: undefined,
      draggable: false,
      selectable: false,
      connectable: false,
    }))

    const edges: Edge[] = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: !!e.animated,
      selectable: false,
    }))

    return { nodes, edges }
  }, [graph])

  return (
    <div className="w-full" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.05}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
        className="bg-white dark:bg-slate-900"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}

export function GraphPreview({ code, language, height = 160, className, compact }: GraphPreviewProps) {
  const [graph, setGraph] = useState<LangGraph | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const parse = async () => {
      setLoading(true)
      setError(null)
      try {
        const lang = language === "javascript" ? "typescript" : language
        if (lang === "typescript") {
          const { parseTypeScriptCode, convertToLangGraph } = await import("@/lib/typescript-parser")
          const res = parseTypeScriptCode(code)
          if (!res.success) throw new Error(res.error || "Failed to parse TypeScript code")
          const g = convertToLangGraph(res)
          if (mounted) setGraph(g)
        } else {
          const { parseLangGraphCodeAsync, convertToLangGraph } = await import("@/lib/python-parser")
          const res = await parseLangGraphCodeAsync(code)
          if (!res.success) throw new Error(res.error || "Failed to parse Python code")
          const g = convertToLangGraph(res)
          if (mounted) setGraph(g)
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        if (mounted) {
          setError(msg)
          setGraph(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    parse()
    return () => {
      mounted = false
    }
  }, [code, language])

  return (
    <div className={className}>
      <ReactFlowProvider>
        {graph && !loading ? (
          <TinyFlow graph={graph} height={height} compact={!!compact} />
        ) : (
          <div
            className="w-full border rounded bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300 p-2"
            style={{ height }}
          >
            {loading ? "Parsing graph..." : error ? `Preview unavailable: ${error}` : "No preview"}
          </div>
        )}
      </ReactFlowProvider>
    </div>
  )
}
