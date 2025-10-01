"use client"

import { useState } from "react"
import { Group, Rect, Circle, Text as KonvaText, Line } from "react-konva"
import type { SpatialComment } from "@/lib/types"

type SpatialCommentProps = {
  comment: SpatialComment
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
  onResolve: () => void
  onTextChange?: (text: string) => void
}

export function SpatialCommentComponent({
  comment,
  isSelected,
  onSelect,
  onDragEnd,
  onResolve,
  onTextChange,
}: SpatialCommentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const width = 250
  const headerHeight = 30
  const contentHeight = Math.min(comment.text.length / 30 * 20 + 40, 120)
  const totalHeight = headerHeight + contentHeight

  const handleDoubleClick = (e: any) => {
    if (!onTextChange || comment.resolved) return
    
    e.cancelBubble = true
    setIsEditing(true)
    onSelect()

    // Get the stage and container
    const stage = e.target.getStage()
    const container = stage.container()
    const containerRect = container.getBoundingClientRect()

    // Calculate screen position
    const screenX = containerRect.left + comment.x * stage.scaleX() + stage.x()
    const screenY = containerRect.top + (comment.y + headerHeight + 12) * stage.scaleY() + stage.y()

    // Create textarea
    const textarea = document.createElement("textarea")
    textarea.value = comment.text
    textarea.style.position = "fixed"
    textarea.style.top = `${screenY}px`
    textarea.style.left = `${screenX}px`
    textarea.style.width = `${(width - 24) * stage.scaleX()}px`
    textarea.style.height = `${(contentHeight - 32) * stage.scaleY()}px`
    textarea.style.fontSize = `${13 * stage.scaleX()}px`
    textarea.style.fontFamily = "Arial"
    textarea.style.padding = "8px"
    textarea.style.border = "2px solid " + comment.userColor
    textarea.style.borderRadius = "4px"
    textarea.style.outline = "none"
    textarea.style.resize = "none"
    textarea.style.zIndex = "10000"
    textarea.style.backgroundColor = "white"

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const removeTextarea = () => {
      if (onTextChange && textarea.value !== comment.text) {
        onTextChange(textarea.value)
      }
      document.body.removeChild(textarea)
      setIsEditing(false)
    }

    textarea.addEventListener("blur", removeTextarea)
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        textarea.value = comment.text // Revert
        removeTextarea()
      }
      if (e.key === "Enter" && e.ctrlKey) {
        removeTextarea()
      }
      e.stopPropagation()
    })
  }

  return (
    <Group
      x={comment.x}
      y={comment.y}
      draggable={!isEditing}
      onClick={onSelect}
      onDblClick={handleDoubleClick}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
    >
      {/* Pin Line */}
      <Line
        points={[width / 2, -20, width / 2, 0]}
        stroke={comment.userColor}
        strokeWidth={2}
        dash={[5, 3]}
      />

      {/* Pin Head */}
      <Circle
        x={width / 2}
        y={-20}
        radius={6}
        fill={comment.userColor}
        stroke="white"
        strokeWidth={2}
      />

      {/* Main Comment Box */}
      <Rect
        width={width}
        height={totalHeight}
        fill="white"
        cornerRadius={8}
        shadowBlur={isSelected ? 12 : 8}
        shadowOpacity={0.3}
        shadowOffsetY={4}
        stroke={isSelected ? comment.userColor : "#e5e7eb"}
        strokeWidth={isSelected ? 3 : 1}
      />

      {/* Header */}
      <Rect
        width={width}
        height={headerHeight}
        fill={comment.userColor}
        opacity={0.1}
        cornerRadius={[8, 8, 0, 0]}
      />

      {/* User Name */}
      <KonvaText
        x={12}
        y={8}
        text={comment.userName}
        fontSize={12}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#374151"
        width={width - 80}
      />

      {/* Reply Count Badge */}
      {comment.replies.length > 0 && (
        <>
          <Circle
            x={width - 50}
            y={15}
            radius={10}
            fill={comment.userColor}
            opacity={0.2}
          />
          <KonvaText
            x={width - 60}
            y={10}
            text={`${comment.replies.length}`}
            fontSize={11}
            fontFamily="Arial"
            fill={comment.userColor}
            width={20}
            align="center"
          />
        </>
      )}

      {/* Resolve Button */}
      {!comment.resolved && isSelected && (
        <Group
          x={width - 28}
          y={6}
          onClick={(e) => {
            e.cancelBubble = true
            onResolve()
          }}
        >
          <Circle
            radius={9}
            fill="#10b981"
            opacity={0.2}
          />
          <KonvaText
            x={-6}
            y={-6}
            text="✓"
            fontSize={12}
            fill="#10b981"
          />
        </Group>
      )}

      {/* Resolved Badge */}
      {comment.resolved && (
        <Group x={width - 35} y={8}>
          <Rect
            width={30}
            height={16}
            fill="#10b981"
            opacity={0.2}
            cornerRadius={3}
          />
          <KonvaText
            x={2}
            y={2}
            text="✓ Done"
            fontSize={9}
            fill="#10b981"
            width={26}
            align="center"
          />
        </Group>
      )}

      {/* Comment Text */}
      <KonvaText
        x={12}
        y={headerHeight + 12}
        text={comment.text}
        fontSize={13}
        fontFamily="Arial"
        fill="#1f2937"
        width={width - 24}
        wrap="word"
      />

      {/* Timestamp */}
      <KonvaText
        x={12}
        y={totalHeight - 20}
        text={new Date(comment.createdAt).toLocaleString()}
        fontSize={10}
        fontFamily="Arial"
        fill="#9ca3af"
        width={width - 24}
      />
    </Group>
  )
}

