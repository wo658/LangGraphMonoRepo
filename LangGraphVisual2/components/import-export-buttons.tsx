"use client"

import React, { useRef } from "react"
import { Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FILE_CONFIG } from "@/lib/constants"
import { useGraph } from '@/stores/graph-store'
import { useCode, useLanguage } from '@/stores/editor-store'
import { useAddToast } from '@/stores/notification-store'
import { useI18n } from '@/stores/i18n-store'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface ImportExportButtonsProps {
  onImport: (data: { graph: any; code: string }) => void
}

export function ImportExportButtons({ onImport }: ImportExportButtonsProps) {
  const graph = useGraph()
  const code = useCode()
  const language = useLanguage()
  const addToast = useAddToast()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 코드 파일로 내보내기 (확장자 자동 선택)
  const handleExportCode = async () => {
    try {
      const extMap: Record<'python' | 'typescript', string> = {
        python: 'py',
        typescript: 'ts',
      }
      const ext = extMap[language] ?? 'txt'
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .split("Z")[0]
      const filename = `${FILE_CONFIG.EXPORT_FILE_PREFIX}-${timestamp}.${ext}`

      const blob = new Blob([code ?? ""], { type: "text/plain;charset=utf-8" })

      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        ;(window.navigator as any).msSaveOrOpenBlob(blob, filename)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 100)
      }

      addToast({
        title: t("message.export.success"),
        description: `Code exported as ${filename}`,
      })
    } catch (error) {
      addToast({
        title: "Export Failed",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // 이미지 내보내기 라이브러리를 동적 로드
  // 우선순위: html-to-image (ESM) -> html-to-image (UMD) -> dom-to-image-more (ESM) -> dom-to-image-more (UMD) -> html2canvas (UMD)
  const ensureImageExporter = async (): Promise<{ toPng: (el: HTMLElement, opts?: any) => Promise<string> }> => {
    const w = window as any

    // 이미 로드된 경우
    if (w.htmlToImage && typeof w.htmlToImage.toPng === 'function') {
      return { toPng: w.htmlToImage.toPng.bind(w.htmlToImage) }
    }
    if (w.domtoimage && typeof w.domtoimage.toPng === 'function') {
      return { toPng: w.domtoimage.toPng.bind(w.domtoimage) }
    }

    const loadScript = (src: string, attr: string) =>
      new Promise<void>((resolve, reject) => {
        const selector = `script[${attr}="true"][src="${src}"]`
        const existing = document.querySelector(selector) as HTMLScriptElement | null
        if (existing) {
          // 이미 추가됨: 로드 완료 대기
          existing.addEventListener('load', () => resolve())
          existing.addEventListener('error', () => reject(new Error('Failed to load image exporter')))
          return
        }
        const script = document.createElement('script')
        script.src = src
        script.async = true
        script.defer = true
        script.setAttribute(attr, 'true')
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load image exporter'))
        document.body.appendChild(script)
      })

    // 0차: ESM - html-to-image
    try {
      const mod = await (Function('return import("https://esm.sh/html-to-image@1.11.11?bundle")')() as Promise<any>)
      if (mod && typeof mod.toPng === 'function') {
        return { toPng: mod.toPng }
      }
    } catch {}

    // 1차: UMD - html-to-image
    try {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js', 'data-html-to-image')
      } catch {
        await loadScript('https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.min.js', 'data-html-to-image')
      }
      if (w.htmlToImage && typeof w.htmlToImage.toPng === 'function') {
        return { toPng: w.htmlToImage.toPng.bind(w.htmlToImage) }
      }
    } catch {
      // ignore and try fallback
    }

    // 2차: ESM - dom-to-image-more
    try {
      const mod = await (Function('return import("https://esm.sh/dom-to-image-more@3.3.7?bundle")')() as Promise<any>)
      if (mod && typeof mod.toPng === 'function') {
        return { toPng: mod.toPng }
      }
    } catch {}

    // 3차: UMD - dom-to-image-more
    try {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/dom-to-image-more@3.3.7/dist/dom-to-image-more.min.js', 'data-dom-to-image')
      } catch {
        await loadScript('https://unpkg.com/dom-to-image-more@3.3.7/dist/dom-to-image-more.min.js', 'data-dom-to-image')
      }
      if (w.domtoimage && typeof w.domtoimage.toPng === 'function') {
        return { toPng: w.domtoimage.toPng.bind(w.domtoimage) }
      }
    } catch {
      // ignore
    }

    // 4차: UMD - html2canvas (최후의 수단)
    try {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', 'data-html2canvas')
      } catch {
        await loadScript('https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js', 'data-html2canvas')
      }
      if (w.html2canvas && typeof w.html2canvas === 'function') {
        return {
          toPng: async (el: HTMLElement) => {
            const canvas = await w.html2canvas(el, { scale: 2, useCORS: true })
            return canvas.toDataURL('image/png')
          }
        }
      }
    } catch {}

    throw new Error('No compatible image exporter available')
  }

  // 그래프 시각화를 PNG로 내보내기
  const handleExportPNG = async () => {
    try {
      if (!graph) {
        addToast({
          title: t("message.error"),
          description: "No graph to export. Please run the code first.",
          variant: "destructive",
        })
        return
      }

      // React Flow 내부 뷰포트 우선 캡처 (오버레이 제외)
      let container = document.querySelector('.react-flow__viewport') as HTMLElement | null
      if (!container) {
        container = document.querySelector('.react-flow') as HTMLElement | null
      }
      if (!container) {
        addToast({
          title: "Export Failed",
          description: "Graph container not found",
          variant: "destructive",
        })
        return
      }

      const exporter = await ensureImageExporter()
      const dataUrl = await exporter.toPng(container, { pixelRatio: 2 })

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .split("Z")[0]
      const filename = `${FILE_CONFIG.EXPORT_FILE_PREFIX}-${timestamp}.png`

      const a = document.createElement('a')
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      addToast({
        title: t("message.export.success"),
        description: `PNG exported as ${filename}`,
      })
    } catch (error) {
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            {t("button.export")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportCode}>Code</DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPNG}>PNG</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input ref={fileInputRef} type="file" accept={FILE_CONFIG.ACCEPTED_FILE_TYPES} onChange={handleFileChange} className="hidden" />
    </>
  )
}
