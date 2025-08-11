"use client"

import React, { useRef } from "react"
import { Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ExportData } from "@/lib/types"
import { FILE_CONFIG, APP_CONFIG } from "@/lib/constants"
import { useGraph } from '@/stores/graph-store'
import { useCode } from '@/stores/editor-store'
import { useAddToast } from '@/stores/notification-store'
import { useI18n } from '@/stores/i18n-store'

interface ImportExportButtonsProps {
  onImport: (data: { graph: any; code: string }) => void
}

export function ImportExportButtons({ onImport }: ImportExportButtonsProps) {
  const graph = useGraph()
  const code = useCode()
  const addToast = useAddToast()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      // 1. Graph 존재 여부 확인
      if (!graph) {
        addToast({
          title: t("message.error"),
          description: "No graph to export. Please run the code first.",
          variant: "destructive",
        })
        return
      }

      // 2. 데이터 검증 및 정리
      // console.log("Exporting graph:", graph)
      // console.log("Exporting code length:", code.length)

      const exportData: ExportData = {
        graph: {
          nodes: graph.nodes || [],
          edges: graph.edges || [],
        },
        code: code || "",
        timestamp: new Date().toISOString(),
        version: APP_CONFIG.VERSION,
        metadata: {
          nodeCount: graph.nodes?.length || 0,
          edgeCount: graph.edges?.length || 0,
        },
      }

      // 3. JSON 직렬화 테스트
      let jsonString: string
      try {
        jsonString = JSON.stringify(exportData, null, 2)
      } catch {
        // console.error("JSON serialization error:", error)
        addToast({
          title: "Export Error",
          description: "Failed to serialize graph data",
          variant: "destructive",
        })
        return
      }

      // 4. Blob 생성
      const blob = new Blob([jsonString], {
        type: "application/json",
      })

      // 5. 파일명 생성
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `${FILE_CONFIG.EXPORT_FILE_PREFIX}-${timestamp}${FILE_CONFIG.EXPORT_FILE_EXTENSION}`

      // 6. 다운로드 실행 (더 안전한 방법)
      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        // IE/Edge 지원
        (window.navigator as any).msSaveOrOpenBlob(blob, filename)
      } else {
        // 모던 브라우저
        const url = URL.createObjectURL(blob)

        try {
          const a = document.createElement("a")
          a.style.display = "none"
          a.href = url
          a.download = filename

          // DOM에 추가하고 클릭
          document.body.appendChild(a)
          a.click()

          // 정리
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 100)
        } catch {
          // console.error("Download error:", downloadError)
          URL.revokeObjectURL(url)

          // 대안: 새 창에서 열기
          const newWindow = window.open()
          if (newWindow) {
            newWindow.document.write(`<pre>${jsonString}</pre>`)
            newWindow.document.title = filename
          }

          addToast({
            title: "Download Alternative",
            description: "File opened in new window. Please save manually.",
          })
          return
        }
      }

      addToast({
        title: t("message.export.success"),
        description: `Graph exported as ${filename}`,
      })
    } catch (error) {
      // console.error("Export error:", error)
      addToast({
        title: "Export Failed",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // 데이터 검증
        if (!data.graph || !data.code) {
          throw new Error("Invalid file format: missing graph or code")
        }

        if (!data.graph.nodes || !data.graph.edges) {
          throw new Error("Invalid graph format: missing nodes or edges")
        }

        // console.log("Importing data:", data)
        onImport(data)

        addToast({
          title: t("message.import.success"),
          description: `Imported ${data.graph.nodes.length} nodes and ${data.graph.edges.length} edges`,
        })
      } catch (error) {
        // console.error("Import error:", error)
        addToast({
          title: t("message.import.error"),
          description: `Error: ${error instanceof Error ? error.message : "Invalid file format"}`,
          variant: "destructive",
        })
      }
    }

    reader.onerror = () => {
      addToast({
        title: t("message.import.error"),
        description: "Failed to read file",
        variant: "destructive",
      })
    }

    reader.readAsText(file)

    // Reset input
    event.target.value = ""
  }

  return (
    <>
      <Button onClick={handleImport} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        {t("button.import")}
      </Button>
      <Button onClick={handleExport} variant="outline" size="sm" disabled={!graph}>
        <Upload className="w-4 h-4 mr-2" />
        {t("button.export")}
      </Button>
      <input ref={fileInputRef} type="file" accept={FILE_CONFIG.ACCEPTED_FILE_TYPES} onChange={handleFileChange} className="hidden" />
    </>
  )
}
