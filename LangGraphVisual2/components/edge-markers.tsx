"use client"

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
            fill="#6b7280"
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
            fill="#3b82f6"
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
            fill="#9ca3af"
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
            fill="#ef4444"
            stroke="none"
          />
        </marker>
      </defs>
    </svg>
  )
}