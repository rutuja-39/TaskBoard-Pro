"use client"

import type { Task } from "./kanban-board"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Trash2, User } from "lucide-react"

type TaskCardProps = {
  task: Task
  onDragStart: (task: Task) => void
  onDelete: (taskId: string) => void
  onTaskClick: (task: Task) => void
}

export function TaskCard({ task, onDragStart, onDelete, onTaskClick }: TaskCardProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={() => onTaskClick(task)}
      className="cursor-pointer hover:shadow-lg transition-shadow bg-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`} />
            <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {task.priority}
          </Badge>

          {task.assignee && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
