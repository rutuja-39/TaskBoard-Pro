"use client"

import { Arrow, Line } from "react-konva"
import type { CanvasLink } from "@/lib/types"

type CanvasLinkProps = {
  link: CanvasLink
  fromPos: { x: number; y: number }
  toPos: { x: number; y: number }
  isHighlighted: boolean
  onClick: () => void
}

export function CanvasLinkComponent({
  link,
  fromPos,
  toPos,
  isHighlighted,
  onClick,
}: CanvasLinkProps) {
  const getStrokeDash = () => {
    switch (link.style.lineType) {
      case "dashed":
        return [10, 5]
      case "dotted":
        return [2, 4]
      default:
        return undefined
    }
  }

  const getColor = () => {
    if (isHighlighted) return "#3b82f6" // Blue when highlighted
    return link.style.color
  }

  const getStrokeWidth = () => {
    return isHighlighted ? 3 : 2
  }

  // Calculate control points for bezier curve
  const dx = toPos.x - fromPos.x
  const dy = toPos.y - fromPos.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Control point offset (makes the curve smoother)
  const controlOffset = Math.min(distance * 0.3, 100)
  
  // Calculate bezier curve points
  const points = [
    fromPos.x,
    fromPos.y,
    fromPos.x + controlOffset,
    fromPos.y,
    toPos.x - controlOffset,
    toPos.y,
    toPos.x,
    toPos.y,
  ]

  if (link.style.arrow) {
    return (
      <Arrow
        points={points}
        stroke={getColor()}
        strokeWidth={getStrokeWidth()}
        fill={getColor()}
        pointerLength={12}
        pointerWidth={12}
        tension={0.4}
        dash={getStrokeDash()}
        listening={true}
        onClick={onClick}
        onTap={onClick}
        shadowBlur={isHighlighted ? 8 : 0}
        shadowColor={getColor()}
        opacity={0.8}
      />
    )
  }

  return (
    <Line
      points={points}
      stroke={getColor()}
      strokeWidth={getStrokeWidth()}
      tension={0.4}
      dash={getStrokeDash()}
      listening={true}
      onClick={onClick}
      onTap={onClick}
      shadowBlur={isHighlighted ? 8 : 0}
      shadowColor={getColor()}
      opacity={0.8}
    />
  )
}

