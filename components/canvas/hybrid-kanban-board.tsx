"use client"

import { useState } from "react"
import { Group, Rect, Text, Line } from "react-konva"
import type { HybridBoard, HybridColumn, Task } from "@/lib/types"

type HybridKanbanBoardProps = {
  board: HybridBoard
  tasks: Task[]
  isSelected: boolean
  isDraggable: boolean
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
  onTaskMove: (taskId: string, fromColumn: string, toColumn: string) => void
  onTitleChange: (title: string) => void
  onToggleCollapse: () => void
  onAddColumn: () => void
  onRemoveColumn: (columnId: string) => void
  onAddTask: (columnId: string) => void
  onTaskClick?: (task: Task) => void
  zoom: number
}

export function HybridKanbanBoard({
  board,
  tasks,
  isSelected,
  isDraggable,
  onSelect,
  onDragEnd,
  onTaskMove,
  onTitleChange,
  onToggleCollapse,
  onAddColumn,
  onRemoveColumn,
  onAddTask,
  onTaskClick,
  zoom,
}: HybridKanbanBoardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const HEADER_HEIGHT = 50
  const COLLAPSED_HEIGHT = 60
  const COLUMN_WIDTH = board.width / board.columns.length
  const TASK_HEIGHT = 80
  const TASK_MARGIN = 10
  const TASK_PADDING = 12
  const displayHeight = board.collapsed ? COLLAPSED_HEIGHT : board.height

  const handleTitleDoubleClick = (e: any) => {
    e.cancelBubble = true
    setIsEditingTitle(true)
    
    const stage = e.target.getStage()
    const container = stage.container()
    const containerRect = container.getBoundingClientRect()
    
    const screenX = containerRect.left + (board.x + 20) * zoom + stage.x()
    const screenY = containerRect.top + (board.y + 16) * zoom + stage.y()
    
    const input = document.createElement("input")
    input.value = board.title
    input.style.position = "fixed"
    input.style.top = `${screenY}px`
    input.style.left = `${screenX}px`
    input.style.width = `${(board.width - 200) * zoom}px`
    input.style.fontSize = `${18 * zoom}px`
    input.style.fontFamily = "Arial"
    input.style.fontWeight = "bold"
    input.style.padding = "4px 8px"
    input.style.border = "2px solid white"
    input.style.borderRadius = "4px"
    input.style.outline = "none"
    input.style.zIndex = "10000"
    input.style.backgroundColor = board.style.headerColor
    input.style.color = "white"
    
    document.body.appendChild(input)
    input.focus()
    input.select()
    
    const removeInput = () => {
      if (input.value !== board.title && input.value.trim()) {
        onTitleChange(input.value)
      }
      document.body.removeChild(input)
      setIsEditingTitle(false)
    }
    
    input.addEventListener("blur", removeInput)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = board.title
        removeInput()
      }
      if (e.key === "Enter") {
        removeInput()
      }
      e.stopPropagation()
    })
  }

  const getColumnTasks = (columnId: string) => {
    const column = board.columns.find(c => c.id === columnId)
    if (!column) return []
    return column.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[]
  }

  const renderTaskCard = (task: Task, x: number, y: number, columnId: string) => {
    const getPriorityColor = () => {
      switch (task.priority) {
        case "high": return "#ef4444"
        case "medium": return "#f59e0b"
        case "low": return "#10b981"
        default: return "#6b7280"
      }
    }

    return (
      <Group
        key={task.id}
        x={x}
        y={y}
        draggable={isDraggable}
        onClick={(e) => {
          e.cancelBubble = true
          if (onTaskClick) {
            onTaskClick(task)
          }
        }}
        onTap={(e) => {
          e.cancelBubble = true
          if (onTaskClick) {
            onTaskClick(task)
          }
        }}
        onDragEnd={(e) => {
          const newX = e.target.x()
          const draggedOverColumn = Math.floor((newX - TASK_PADDING) / COLUMN_WIDTH)
          if (draggedOverColumn >= 0 && draggedOverColumn < board.columns.length) {
            const targetColumn = board.columns[draggedOverColumn]
            if (targetColumn.id !== columnId) {
              onTaskMove(task.id, columnId, targetColumn.id)
            }
          }
          e.target.x(x)
          e.target.y(y)
        }}
      >
        {/* Task Card Background */}
        <Rect
          width={COLUMN_WIDTH - (TASK_PADDING * 2)}
          height={TASK_HEIGHT}
          fill="white"
          cornerRadius={6}
          shadowBlur={4}
          shadowOpacity={0.2}
          shadowOffsetY={2}
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        {/* Priority Indicator */}
        <Rect
          width={4}
          height={TASK_HEIGHT}
          fill={getPriorityColor()}
          cornerRadius={[6, 0, 0, 6]}
        />

        {/* Task Title */}
        <Text
          x={12}
          y={12}
          text={task.title}
          fontSize={14}
          fontFamily="Arial"
          fill="#1f2937"
          width={COLUMN_WIDTH - (TASK_PADDING * 2) - 20}
          wrap="word"
          ellipsis={true}
        />

        {/* Task Status Badge */}
        <Rect
          x={12}
          y={TASK_HEIGHT - 28}
          width={60}
          height={20}
          fill={getPriorityColor()}
          cornerRadius={4}
          opacity={0.2}
        />
        <Text
          x={12}
          y={TASK_HEIGHT - 24}
          text={task.priority}
          fontSize={10}
          fontFamily="Arial"
          fill={getPriorityColor()}
          width={60}
          align="center"
        />
      </Group>
    )
  }

  const renderColumn = (column: HybridColumn, index: number) => {
    const columnX = index * COLUMN_WIDTH
    const columnTasks = getColumnTasks(column.id)

    return (
      <Group key={column.id}>
        {/* Column Background */}
        <Rect
          x={columnX}
          y={HEADER_HEIGHT}
          width={COLUMN_WIDTH}
          height={board.height - HEADER_HEIGHT}
          fill={column.color}
          opacity={0.1}
        />

        {/* Column Divider */}
        {index > 0 && (
          <Line
            points={[columnX, HEADER_HEIGHT, columnX, board.height]}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        )}

        {/* Column Header */}
        <Rect
          x={columnX + 8}
          y={HEADER_HEIGHT + 12}
          width={COLUMN_WIDTH - 16}
          height={32}
          fill="transparent"
        />
        <Text
          x={columnX + 16}
          y={HEADER_HEIGHT + 20}
          text={column.title}
          fontSize={14}
          fontFamily="Arial"
          fontStyle="bold"
          fill="#374151"
          width={isSelected && board.columns.length > 1 ? COLUMN_WIDTH - 80 : COLUMN_WIDTH - 60}
        />
        
        {/* Delete Column Button - Only show when selected and more than 1 column */}
        {isSelected && board.columns.length > 1 && (
          <Group
            x={columnX + COLUMN_WIDTH - 60}
            y={HEADER_HEIGHT + 18}
            onClick={(e) => {
              e.cancelBubble = true
              onRemoveColumn(column.id)
            }}
          >
            <Rect
              width={20}
              height={20}
              fill="#ef4444"
              cornerRadius={4}
              opacity={0.8}
            />
            <Text
              x={0}
              y={2}
              text="×"
              fontSize={16}
              fill="white"
              width={20}
              align="center"
            />
          </Group>
        )}
        
        <Text
          x={columnX + COLUMN_WIDTH - 40}
          y={HEADER_HEIGHT + 20}
          text={`${columnTasks.length}`}
          fontSize={12}
          fontFamily="Arial"
          fill="#6b7280"
          width={24}
          align="center"
        />

        {/* Tasks */}
        {columnTasks.map((task, taskIndex) => {
          const taskY = HEADER_HEIGHT + 60 + (taskIndex * (TASK_HEIGHT + TASK_MARGIN))
          return renderTaskCard(task, columnX + TASK_PADDING, taskY, column.id)
        })}

        {/* Add Task Button */}
        <Group
          x={columnX + TASK_PADDING}
          y={HEADER_HEIGHT + 60 + (columnTasks.length * (TASK_HEIGHT + TASK_MARGIN))}
          onClick={(e) => {
            e.cancelBubble = true
            onAddTask(column.id)
          }}
        >
          <Rect
            width={COLUMN_WIDTH - (TASK_PADDING * 2)}
            height={40}
            fill="white"
            cornerRadius={6}
            stroke="#e5e7eb"
            strokeWidth={1}
            dash={[5, 3]}
            opacity={0.6}
          />
          <Text
            x={(COLUMN_WIDTH - (TASK_PADDING * 2)) / 2 - 30}
            y={12}
            text="+ Add Task"
            fontSize={13}
            fontFamily="Arial"
            fill="#6b7280"
            width={60}
            align="center"
          />
        </Group>
      </Group>
    )
  }

  return (
    <Group
      x={board.x}
      y={board.y}
      draggable={isDraggable}
      onClick={onSelect}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
    >
      {/* Board Background */}
      <Rect
        width={board.width}
        height={displayHeight}
        fill={board.style.backgroundColor}
        cornerRadius={12}
        shadowBlur={isSelected ? 12 : 8}
        shadowOpacity={0.3}
        shadowOffsetY={4}
        stroke={isSelected ? board.style.borderColor : "#e5e7eb"}
        strokeWidth={isSelected ? 3 : 1}
      />

      {/* Board Header */}
      <Rect
        width={board.width}
        height={HEADER_HEIGHT}
        fill={board.style.headerColor}
        cornerRadius={board.collapsed ? 12 : [12, 12, 0, 0]}
      />

      {/* Board Title */}
      <Text
        x={20}
        y={16}
        text={board.title}
        fontSize={18}
        fontFamily="Arial"
        fontStyle="bold"
        fill="white"
        width={board.width - 200}
        onDblClick={handleTitleDoubleClick}
        listening={true}
      />

      {/* Collapse/Expand Button */}
      {isSelected && (
        <Group
          x={board.width - 160}
          y={12}
          onClick={(e) => {
            e.cancelBubble = true
            onToggleCollapse()
          }}
        >
          <Rect
            width={28}
            height={26}
            fill="rgba(255, 255, 255, 0.2)"
            cornerRadius={4}
          />
          <Text
            x={0}
            y={4}
            text={board.collapsed ? "▼" : "▲"}
            fontSize={14}
            fill="white"
            width={28}
            align="center"
          />
        </Group>
      )}

      {/* Add Column Button */}
      {isSelected && !board.collapsed && (
        <Group
          x={board.width - 120}
          y={12}
          onClick={(e) => {
            e.cancelBubble = true
            onAddColumn()
          }}
        >
          <Rect
            width={28}
            height={26}
            fill="rgba(255, 255, 255, 0.2)"
            cornerRadius={4}
          />
          <Text
            x={0}
            y={3}
            text="+"
            fontSize={20}
            fill="white"
            width={28}
            align="center"
          />
        </Group>
      )}

      {/* Column Count Badge */}
      <Rect
        x={board.width - 80}
        y={15}
        width={60}
        height={20}
        fill="rgba(255, 255, 255, 0.2)"
        cornerRadius={4}
      />
      <Text
        x={board.width - 80}
        y={17}
        text={`${board.columns.length} cols`}
        fontSize={11}
        fill="white"
        width={60}
        align="center"
      />

      {/* Columns - Only show if not collapsed */}
      {!board.collapsed && (
        <>
          {board.columns.map((column, index) => renderColumn(column, index))}
          
          {/* Board Footer Line */}
          <Line
            points={[0, HEADER_HEIGHT, board.width, HEADER_HEIGHT]}
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth={1}
          />
        </>
      )}
    </Group>
  )
}

