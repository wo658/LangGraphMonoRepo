import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Common utility functions extracted from duplicated logic
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function calculateComplexity(nodeCount: number, edgeCount: number): number {
  return nodeCount > 0 ? Number((edgeCount / nodeCount).toFixed(2)) : 0
}

export function getFlowPosition(
  event: MouseEvent | { clientX: number; clientY: number; currentTarget: Element }, 
  project: (position: { x: number; y: number }) => { x: number; y: number }
): { x: number; y: number } {
  const reactFlowWrapper = event.currentTarget as HTMLElement
  const rect = reactFlowWrapper.getBoundingClientRect()
  
  const screenPosition = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
  
  return project(screenPosition)
}
