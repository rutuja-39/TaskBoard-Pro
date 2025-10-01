"use client"

import { useState } from "react"
import { Text, Group, Rect } from "react-konva"

type TextBoxProps = {
  id: string
  x: number
  y: number
  text: string
  fontSize: number
  fill?: string
  isSelected: boolean
  isDraggable: boolean
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
  onTextChange: (text: string) => void
}

export function TextBox({
  id,
  x,
  y,
  text,
  fontSize,
  fill = "#000000",
  isSelected,
  isDraggable,
  onSelect,
  onDragEnd,
  onTextChange,
}: TextBoxProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleDoubleClick = () => {
    setIsEditing(true)
    onSelect()

    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "absolute"
    textarea.style.top = `${y}px`
    textarea.style.left = `${x}px`
    textarea.style.fontSize = `${fontSize}px`
    textarea.style.padding = "8px"
    textarea.style.border = "2px solid #3b82f6"
    textarea.style.borderRadius = "4px"
    textarea.style.backgroundColor = "white"
    textarea.style.resize = "none"
    textarea.style.zIndex = "1000"
    textarea.style.minWidth = "200px"
    textarea.style.minHeight = "60px"
    textarea.style.fontFamily = "Arial, sans-serif"
    textarea.style.color = fill
    textarea.style.outline = "none"

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const handleBlur = () => {
      const newText = textarea.value || "Click to edit text"
      onTextChange(newText)
      document.body.removeChild(textarea)
      setIsEditing(false)
    }

    textarea.addEventListener("blur", handleBlur)
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        textarea.blur()
      }
      // Allow Enter for new lines
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        textarea.blur()
      }
    })
  }

  const textWidth = text.length * fontSize * 0.6
  const textHeight = fontSize * 1.5

  return (
    <Group
      x={x}
      y={y}
      draggable={isDraggable && !isEditing}
      onClick={onSelect}
      onDblClick={handleDoubleClick}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
    >
      {isSelected && (
        <Rect
          x={-6}
          y={-6}
          width={textWidth + 12}
          height={textHeight + 12}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[6, 3]}
          fill="rgba(59, 130, 246, 0.05)"
          cornerRadius={4}
        />
      )}
      <Text 
        text={text} 
        fontSize={fontSize} 
        fill={fill}
        fontFamily="Arial, sans-serif"
        wrap="none"
        padding={4}
      />
    </Group>
  )
}
