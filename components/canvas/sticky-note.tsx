"use client"

import { useState } from "react"
import { Rect, Text, Group, Circle } from "react-konva"

type StickyNoteProps = {
  id: string
  x: number
  y: number
  text: string
  color: string
  isSelected: boolean
  isDraggable: boolean
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
  onTextChange: (text: string) => void
  onColorChange?: (color: string) => void
  zoom?: number
  stagePos?: { x: number; y: number }
}

const STICKY_COLORS = ["#fef08a", "#bfdbfe", "#fecaca", "#d9f99d", "#e9d5ff", "#fde68a", "#c7d2fe", "#fed7aa"]

export function StickyNote({
  id,
  x,
  y,
  text,
  color,
  isSelected,
  isDraggable,
  onSelect,
  onDragEnd,
  onTextChange,
  onColorChange,
  zoom = 1,
  stagePos = { x: 0, y: 0 },
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleDoubleClick = (e: any) => {
    e.cancelBubble = true
    setIsEditing(true)
    onSelect()

    // Get the actual screen position of the sticky note
    const stage = e.target.getStage()
    const container = stage.container()
    const containerRect = container.getBoundingClientRect()
    
    const screenX = containerRect.left + (x * zoom) + stagePos.x
    const screenY = containerRect.top + (y * zoom) + stagePos.y

    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.top = `${screenY}px`
    textarea.style.left = `${screenX}px`
    textarea.style.width = "190px"
    textarea.style.height = "190px"
    textarea.style.fontSize = "16px"
    textarea.style.padding = "16px"
    textarea.style.border = "3px solid rgba(0, 0, 0, 0.1)"
    textarea.style.borderRadius = "8px"
    textarea.style.backgroundColor = color
    textarea.style.resize = "none"
    textarea.style.zIndex = "1000"
    textarea.style.fontFamily = "Arial, sans-serif"
    textarea.style.lineHeight = "1.4"
    textarea.style.outline = "none"
    textarea.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const handleBlur = () => {
      const newText = textarea.value || "Double-click to edit"
      onTextChange(newText)
      document.body.removeChild(textarea)
      setIsEditing(false)
    }

    textarea.addEventListener("blur", handleBlur)
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        textarea.blur()
      }
    })
  }

  return (
    <Group
      x={x}
      y={y}
      draggable={isDraggable && !isEditing}
      onClick={onSelect}
      onDblClick={handleDoubleClick}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
    >
      {/* Shadow */}
      <Rect
        x={4}
        y={4}
        width={200}
        height={200}
        fill="rgba(0, 0, 0, 0.1)"
        cornerRadius={8}
        blur={8}
      />
      
      {/* Main sticky note */}
      <Rect
        width={200}
        height={200}
        fill={color}
        shadowBlur={isSelected ? 8 : 4}
        shadowOpacity={0.3}
        shadowOffsetY={2}
        cornerRadius={8}
        stroke={isSelected ? "#3b82f6" : "rgba(0, 0, 0, 0.1)"}
        strokeWidth={isSelected ? 3 : 1}
      />
      
      {/* Top stripe for visual effect */}
      <Rect
        width={200}
        height={30}
        fill="rgba(255, 255, 255, 0.2)"
        cornerRadius={[8, 8, 0, 0]}
      />
      
      {/* Color picker button - only show when selected */}
      {isSelected && onColorChange && (
        <Group
          x={165}
          y={8}
          onClick={(e) => {
            e.cancelBubble = true
            setShowColorPicker(!showColorPicker)
          }}
        >
          <Circle
            radius={12}
            fill="white"
            stroke="#ccc"
            strokeWidth={1}
            shadowBlur={2}
            shadowOpacity={0.3}
          />
          <Circle
            radius={8}
            fill={color}
            stroke="#666"
            strokeWidth={1}
          />
        </Group>
      )}

      {/* Color picker palette */}
      {isSelected && showColorPicker && onColorChange && (
        <Group x={-80} y={-50}>
          <Rect
            width={260}
            height={60}
            fill="white"
            cornerRadius={8}
            shadowBlur={8}
            shadowOpacity={0.2}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          {STICKY_COLORS.map((c, index) => (
            <Group
              key={c}
              x={15 + (index * 30)}
              y={15}
              onClick={(e) => {
                e.cancelBubble = true
                onColorChange(c)
                setShowColorPicker(false)
              }}
            >
              <Circle
                radius={12}
                fill={c}
                stroke={color === c ? "#3b82f6" : "#ccc"}
                strokeWidth={color === c ? 3 : 1}
              />
            </Group>
          ))}
        </Group>
      )}
      
      {/* Text */}
      <Text
        text={text}
        width={170}
        height={160}
        x={15}
        y={15}
        fontSize={16}
        fill="rgba(0, 0, 0, 0.85)"
        align="left"
        verticalAlign="top"
        wrap="word"
        lineHeight={1.4}
        fontFamily="Arial, sans-serif"
      />
    </Group>
  )
}
