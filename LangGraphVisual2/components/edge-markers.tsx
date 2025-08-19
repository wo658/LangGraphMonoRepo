"use client"

import { GRAPH_STYLES } from '@/lib/constants'

export function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
      <defs>
        {/* Default arrow marker for light theme */}
        <marker
          id="arrow-marker"
          viewBox="0 0 15 15"
          refX="15"
          refY="7.5"
          markerWidth="15"
          markerHeight="15"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 15 7.5 L 0 15 z"
            fill={GRAPH_STYLES.COLORS.LIGHT_THEME.EDGE_STROKE}
            stroke="none"
          />
        </marker>
        
        {/* Selected arrow marker */}
        <marker
          id="arrow-marker-selected"
          viewBox="0 0 15 15"
          refX="15"
          refY="7.5"
          markerWidth="15"
          markerHeight="15"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 15 7.5 L 0 15 z"
            fill={GRAPH_STYLES.COLORS.SELECTED_EDGE}
            stroke="none"
          />
        </marker>
        
        {/* Dark theme arrow marker */}
        <marker
          id="arrow-marker-dark"
          viewBox="0 0 15 15"
          refX="15"
          refY="7.5"
          markerWidth="15"
          markerHeight="15"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 15 7.5 L 0 15 z"
            fill={GRAPH_STYLES.COLORS.DARK_THEME.EDGE_STROKE}
            stroke="none"
          />
        </marker>
        
        {/* Loop feedback edge marker */}
        <marker
          id="arrow-marker-loop"
          viewBox="0 0 15 15"
          refX="15"
          refY="7.5"
          markerWidth="15"
          markerHeight="15"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 15 7.5 L 0 15 z"
            fill={GRAPH_STYLES.COLORS.LOOP_FEEDBACK_EDGE}
            stroke="none"
          />
        </marker>

        {/* Self-loop edge marker */}
        <marker
          id="arrow-marker-selfloop"
          viewBox="0 0 15 15"
          refX="15"
          refY="7.5"
          markerWidth="15"
          markerHeight="15"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 15 7.5 L 0 15 z"
            fill={GRAPH_STYLES.COLORS.SELF_LOOP_EDGE}
            stroke="none"
          />
        </marker>
      </defs>
    </svg>
  )
}