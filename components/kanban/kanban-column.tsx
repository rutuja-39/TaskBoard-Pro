"use client"

import type React from "react"

import type { Task } from "./kanban-board"
import { TaskCard } from "./task-card"

type KanbanColumnProps = {
  title: string
  status: Task["status"]
  tasks: Task[]
  onDragStart: (task: Task) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (status: Task["status"]) => void
  onDeleteTask: (taskId: string) => void
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  onDeleteTask,
  onTaskClick,
}: KanbanColumnProps) {
  const getColumnColor = () => {
    switch (status) {
      case "todo":
        return "bg-gray-100 dark:bg-gray-800"
      case "inprogress":
        return "bg-yellow-50 dark:bg-yellow-950/20"
      case "done":
        return "bg-green-50 dark:bg-green-950/20"
    }
  }

  const getHeaderColor = () => {
    switch (status) {
      case "todo":
        return "text-gray-700 dark:text-gray-300"
      case "inprogress":
        return "text-yellow-700 dark:text-yellow-300"
      case "done":
        return "text-green-700 dark:text-green-300"
    }
  }

  return (
    <div
      className={`rounded-lg p-4 ${getColumnColor()} min-h-[500px]`}
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-lg ${getHeaderColor()}`}>{title}</h3>
        <span className="text-sm text-muted-foreground bg-background rounded-full px-2 py-1">{tasks.length}</span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDelete={onDeleteTask}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      {tasks.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Drop tasks here</div>}
    </div>
  )
}
