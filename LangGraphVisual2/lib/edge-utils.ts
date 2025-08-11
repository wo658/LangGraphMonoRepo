import type { Edge, Node } from 'reactflow'
import type { GraphEdge } from './types'

const EDGE_COLORS = {
  base: { light: "#6b7280", dark: "#9ca3af" },
  loopFeedback: "#ef4444"
} as const

// 노드의 연결점 정의 (상하좌우 중심점)
export interface ConnectionPoint {
  id: string
  position: 'top' | 'right' | 'bottom' | 'left'
  x: number
  y: number
}

// 노드의 연결점들을 계산
export function getNodeConnectionPoints(node: Node): ConnectionPoint[] {
  const nodeWidth = 120 // 기본 노드 너비
  const nodeHeight = 40 // 기본 노드 높이
  const centerX = node.position.x + nodeWidth / 2
  const centerY = node.position.y + nodeHeight / 2

  return [
    { id: 'top', position: 'top', x: centerX, y: node.position.y },
    { id: 'right', position: 'right', x: node.position.x + nodeWidth, y: centerY },
    { id: 'bottom', position: 'bottom', x: centerX, y: node.position.y + nodeHeight },
    { id: 'left', position: 'left', x: node.position.x, y: centerY }
  ]
}

// 두 점 사이의 거리 계산
export function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

// 최적의 연결점 찾기 (가장 가까운 점들)
export function getOptimalConnectionPoints(sourceNode: Node, targetNode: Node): { sourceHandle: string; targetHandle: string } {
  const sourcePoints = getNodeConnectionPoints(sourceNode)
  const targetPoints = getNodeConnectionPoints(targetNode)
  
  let minDistance = Infinity
  let bestConnection = { sourceHandle: 'right-source', targetHandle: 'left' }
  
  // 모든 연결점 조합에서 가장 가까운 것 찾기
  for (const sourcePoint of sourcePoints) {
    for (const targetPoint of targetPoints) {
      const distance = calculateDistance(sourcePoint, targetPoint)
      if (distance < minDistance) {
        minDistance = distance
        bestConnection = {
          sourceHandle: sourcePoint.id + '-source', // source 핸들 ID
          targetHandle: targetPoint.id // target 핸들 ID
        }
      }
    }
  }
  
  return bestConnection
}

// 선분과 점 사이의 최단 거리 계산
export function distanceFromPointToLine(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  
  if (lenSq === 0) return Math.sqrt(A * A + B * B)
  
  let param = dot / lenSq
  param = Math.max(0, Math.min(1, param))
  
  const xx = lineStart.x + param * C
  const yy = lineStart.y + param * D
  
  const dx = point.x - xx
  const dy = point.y - yy
  
  return Math.sqrt(dx * dx + dy * dy)
}

// 엣지가 노드와 충돌하는지 확인
export function checkEdgeNodeCollision(
  edgeStart: { x: number; y: number },
  edgeEnd: { x: number; y: number },
  node: Node,
  threshold: number = 30
): boolean {
  const nodeWidth = 120
  const nodeHeight = 40
  const nodeCenter = {
    x: node.position.x + nodeWidth / 2,
    y: node.position.y + nodeHeight / 2
  }
  
  const distance = distanceFromPointToLine(nodeCenter, edgeStart, edgeEnd)
  return distance < threshold
}

// 엣지 간 충돌 확인
export function checkEdgeEdgeCollision(
  edge1Start: { x: number; y: number },
  edge1End: { x: number; y: number },
  edge2Start: { x: number; y: number },
  edge2End: { x: number; y: number },
  _threshold: number = 20
): boolean {
  // 두 선분의 교차점 계산
  const denom = (edge1Start.x - edge1End.x) * (edge2Start.y - edge2End.y) - 
                (edge1Start.y - edge1End.y) * (edge2Start.x - edge2End.x)
  
  if (Math.abs(denom) < 0.0001) return false // 평행선
  
  const t = ((edge1Start.x - edge2Start.x) * (edge2Start.y - edge2End.y) - 
            (edge1Start.y - edge2Start.y) * (edge2Start.x - edge2End.x)) / denom
  const u = -((edge1Start.x - edge1End.x) * (edge1Start.y - edge2Start.y) - 
             (edge1Start.y - edge1End.y) * (edge1Start.x - edge2Start.x)) / denom
  
  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

// 곡률을 가진 베지어 곡선 경로 생성
export function generateCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  curvature: number = 0.3
): string {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // 곡률에 따른 제어점 계산
  const controlOffset = distance * curvature
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  
  // 수직 방향으로 제어점 오프셋
  const perpX = -dy / distance * controlOffset
  const perpY = dx / distance * controlOffset
  
  const controlX = midX + perpX
  const controlY = midY + perpY
  
  return `M ${start.x},${start.y} Q ${controlX},${controlY} ${end.x},${end.y}`
}

// 엣지 정보와 곡률 정보를 포함한 인터페이스
export interface EdgeWithCurvature {
  edge: GraphEdge
  distance: number
  curvature: number
  sourcePoint: ConnectionPoint
  targetPoint: ConnectionPoint
}

// 모든 엣지의 충돌 회피 곡률을 계산하는 메인 함수
export function calculateEdgeCurvatures(edges: GraphEdge[], nodes: Node[]): EdgeWithCurvature[] {
  // 1. 노드간 거리를 기준으로 엣지 정렬
  const edgesWithDistance = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    
    if (!sourceNode || !targetNode) {
      return {
        edge,
        distance: Infinity,
        curvature: 0,
        sourcePoint: { id: 'right', position: 'right' as const, x: 0, y: 0 },
        targetPoint: { id: 'left', position: 'left' as const, x: 0, y: 0 }
      }
    }
    
    const connectionPoints = getOptimalConnectionPoints(sourceNode, targetNode)
    const sourcePoints = getNodeConnectionPoints(sourceNode)
    const targetPoints = getNodeConnectionPoints(targetNode)
    
    // sourceHandle에서 '-source' 부분을 제거하여 실제 연결점 ID를 찾음
    const sourcePointId = connectionPoints.sourceHandle.replace('-source', '')
    const sourcePoint = sourcePoints.find(p => p.id === sourcePointId)!
    const targetPoint = targetPoints.find(p => p.id === connectionPoints.targetHandle)!
    
    const distance = calculateDistance(sourcePoint, targetPoint)
    
    return {
      edge,
      distance,
      curvature: 0,
      sourcePoint,
      targetPoint
    }
  }).sort((a, b) => a.distance - b.distance)

  // 2. 짧은 엣지부터 처리하여 곡률 결정
  const processedEdges: EdgeWithCurvature[] = []
  
  for (const currentEdge of edgesWithDistance) {
    let finalCurvature = 0
    let attempts = 0
    const maxAttempts = 5
    
    // 3. 충돌 검사 및 곡률 조정 (최대 5번 시도)
    while (attempts < maxAttempts) {
      const testCurvature = attempts * 0.2 // 0, 0.2, 0.4, 0.6, 0.8
      let hasCollision = false
      
      // 다른 노드와의 충돌 검사
      for (const node of nodes) {
        if (node.id === currentEdge.edge.source || node.id === currentEdge.edge.target) continue
        
        if (checkEdgeNodeCollision(currentEdge.sourcePoint, currentEdge.targetPoint, node)) {
          hasCollision = true
          break
        }
      }
      
      // 이미 처리된 엣지와의 충돌 검사 (attempts < 5일 때만)
      if (!hasCollision && attempts < maxAttempts - 1) {
        for (const processedEdge of processedEdges) {
          if (checkEdgeEdgeCollision(
            currentEdge.sourcePoint,
            currentEdge.targetPoint,
            processedEdge.sourcePoint,
            processedEdge.targetPoint
          )) {
            hasCollision = true
            break
          }
        }
      }
      
      if (!hasCollision) {
        finalCurvature = testCurvature
        break
      }
      
      attempts++
    }
    
    // 3-2. 5번 시도 후에도 충돌하면 최대 곡률 적용
    if (attempts === maxAttempts) {
      finalCurvature = 0.8
    }
    
    processedEdges.push({
      ...currentEdge,
      curvature: finalCurvature
    })
  }
  
  return processedEdges
}

// 곡률 정보를 바탕으로 ReactFlow Edge 생성
export function createStyledEdge(
  edge: GraphEdge,
  isDark: boolean,
  nodes: Node[],
  curvature: number = 0
): Edge {
  const isLoopFeedback = edge.isLoopFeedback || false
  const baseStroke = isDark ? EDGE_COLORS.base.dark : EDGE_COLORS.base.light
  const loopFeedbackStroke = EDGE_COLORS.loopFeedback
  const isConditional = !!(edge.label && edge.label.trim() !== '')
  
  const sourceNode = nodes.find(n => n.id === edge.source)
  const targetNode = nodes.find(n => n.id === edge.target)

  let sourceHandle: string | undefined
  let targetHandle: string | undefined

  if (edge.sourceHandle && edge.targetHandle) {
    // Use predefined handles if available (from Add Edge Mode)
    sourceHandle = edge.sourceHandle
    targetHandle = edge.targetHandle
  } else if (sourceNode && targetNode) {
    // Calculate optimal handles if not provided
    const connectionPoints = getOptimalConnectionPoints(sourceNode, targetNode)
    sourceHandle = connectionPoints.sourceHandle
    targetHandle = connectionPoints.targetHandle
  }

  // 곡률에 따라 엣지 타입 결정 - 커스텀 곡선 엣지 사용
  let edgeType = "curved" // 모든 엣지에 커스텀 곡선 타입 사용
  
  if (isLoopFeedback) {
    edgeType = "curved"
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle,
    animated: edge.animated ?? false,
    label: edge.label,
    type: edgeType,
    style: {
      stroke: isLoopFeedback ? loopFeedbackStroke : baseStroke,
      strokeWidth: isLoopFeedback ? 3 : 2,
      // Use dashed style for conditional edges; keep solid for normal
      strokeDasharray: isLoopFeedback ? "8 4" : (isConditional ? "6 3" : undefined),
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    },
    labelStyle: {
      fill: isLoopFeedback ? loopFeedbackStroke : (isDark ? "#f9fafb" : "#111827"),
      fontWeight: isLoopFeedback ? 600 : 500,
      fontSize: "11px",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      padding: '2px 6px',
      borderRadius: '4px',
      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    },
    labelBgStyle: {
      fill: isDark ? "#1f2937" : "#ffffff",
      fillOpacity: 0.95,
      stroke: isDark ? "#374151" : "#e5e7eb",
      strokeWidth: 1,
    },
    markerEnd: isLoopFeedback ? 'url(#arrow-marker-loop)' : (isDark ? 'url(#arrow-marker-dark)' : 'url(#arrow-marker)'),
    // 곡률 정보를 data에 저장하여 커스텀 렌더링에 사용
    data: {
      curvature,
      originalEdge: edge
    }
  }
}

// 모든 엣지를 처리하여 충돌 회피가 적용된 엣지 배열 생성
export function createStyledEdgesWithCollisionAvoidance(
  edges: GraphEdge[],
  nodes: Node[],
  isDark: boolean
): Edge[] {
  const edgesWithCurvature = calculateEdgeCurvatures(edges, nodes)
  
  return edgesWithCurvature.map((edgeInfo, index) => 
    createStyledEdge(
      edgeInfo.edge,
      isDark,
      nodes,
      edgeInfo.curvature
    )
  )
}