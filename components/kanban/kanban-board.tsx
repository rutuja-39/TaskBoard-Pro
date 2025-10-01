"use client"

import React, { useState, useEffect } from "react"
import { KanbanColumn } from "./kanban-column"
import { CreateTaskDialog } from "./create-task-dialog"
import { TaskDetailsDialog } from "./task-details-dialog"
import type { Task } from "@/lib/types"

type KanbanBoardProps = {
  initialTasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
  projectId?: string
}

export function KanbanBoard({ initialTasks, onTasksChange, projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Sync with parent when initialTasks change
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Load tasks from database on mount and when project changes
  useEffect(() => {
    if (projectId) {
      refreshTasks()
    }
  }, [projectId])

  const refreshTasks = async () => {
    console.log("[Kanban] Refreshing tasks from database...")
    const url = projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks"
    try {
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log("[Kanban] ✅ Fetched", data.tasks.length, "tasks from database")
        setTasks(data.tasks || [])
        onTasksChange?.(data.tasks || [])
      } else {
        console.error("[Kanban] ❌ Failed to fetch tasks, status:", response.status)
      }
    } catch (error) {
      console.error("[Kanban] ❌ Failed to fetch tasks:", error)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDetailsOpen(true)
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (status: Task["status"]) => {
    if (!draggedTask) return

    console.log("[Kanban] Updating task", draggedTask.id, "to status:", status)
    
    // Optimistic update
    const updatedTask = { ...draggedTask, status }
    setTasks((prev) => prev.map((task) => (task.id === draggedTask.id ? updatedTask : task)))

    try {
      const response = await fetch(`/api/tasks/${draggedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        console.error("[Kanban] Failed to update task, reverting...")
        setTasks((prev) => prev.map((task) => (task.id === draggedTask.id ? draggedTask : task)))
      } else {
        console.log("[Kanban] ✅ Task updated successfully in database")
        // Update parent state with new tasks
        const newTasks = tasks.map((task) => (task.id === draggedTask.id ? updatedTask : task))
        onTasksChange?.(newTasks)
      }
    } catch (error) {
      console.error("[Kanban] ❌ Failed to update task:", error)
      setTasks((prev) => prev.map((task) => (task.id === draggedTask.id ? draggedTask : task)))
    }

    setDraggedTask(null)
  }

  const handleDeleteTask = async (taskId: string) => {
    console.log("[Kanban] Deleting task:", taskId)
    
    // Optimistic delete
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        console.error("[Kanban] Failed to delete task, refreshing...")
        await refreshTasks()
      } else {
        console.log("[Kanban] ✅ Task deleted successfully from database")
        const newTasks = tasks.filter((t) => t.id !== taskId)
        onTasksChange?.(newTasks)
      }
    } catch (error) {
      console.error("[Kanban] ❌ Failed to delete task:", error)
      await refreshTasks()
    }
  }

  const todoTasks = tasks.filter((task) => task.status === "todo")
  const inProgressTasks = tasks.filter((task) => task.status === "inprogress")
  const doneTasks = tasks.filter((task) => task.status === "done")

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 px-6 pt-6">
        <h2 className="text-xl font-semibold">Project Board</h2>
        <CreateTaskDialog onTaskCreated={refreshTasks} projectId={projectId} />
      </div>

      <div className="flex-1 px-6 pb-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={todoTasks}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDeleteTask={handleDeleteTask}
            onTaskClick={handleTaskClick}
          />
          <KanbanColumn
            title="In Progress"
            status="inprogress"
            tasks={inProgressTasks}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDeleteTask={handleDeleteTask}
            onTaskClick={handleTaskClick}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tasks={doneTasks}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDeleteTask={handleDeleteTask}
            onTaskClick={handleTaskClick}
          />
        </div>
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onTaskUpdated={refreshTasks}
      />
    </div>
  )
}
