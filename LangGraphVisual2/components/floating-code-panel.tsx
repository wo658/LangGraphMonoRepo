"use client"

import React from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/components/code-editor'

interface FloatingCodePanelProps {
  isMinimized: boolean
  onToggleMinimized: (minimized: boolean) => void
  code: string
  onCodeChange: (code: string) => void
  onRunCode: () => void
  isRunning: boolean
  runButtonText: string
}

export function FloatingCodePanel({
  isMinimized,
  onToggleMinimized,
  code,
  onCodeChange,
  onRunCode,
  isRunning,
  runButtonText
}: FloatingCodePanelProps) {
  return (
    <div className={`absolute top-8 left-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-10 transition-all duration-300 ${
      isMinimized 
        ? 'w-12 h-12' 
        : 'w-[480px] h-[calc(100vh-160px)]'
    }`}>
      {isMinimized ? (
        <div className="flex items-center justify-center h-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleMinimized(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            aria-label="Expand code panel"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <CodeEditor
          value={code}
          onChange={onCodeChange}
          onRun={onRunCode}
          isRunning={isRunning}
          runButtonText={runButtonText}
          onMinimize={() => onToggleMinimized(true)}
          className="h-full"
        />
      )}
    </div>
  )
}