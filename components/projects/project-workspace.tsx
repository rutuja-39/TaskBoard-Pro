"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { CanvasWorkspace } from "@/components/canvas/canvas-workspace"
import { LayoutGrid, Palette } from "lucide-react"
import type { Task } from "@/lib/types"

type Project = {
  id: string
  name: string
  description: string
  color: string
  createdAt: string
}

type ProjectWorkspaceProps = {
  project: Project
  initialTasks: Task[]
}

export function ProjectWorkspace({ project, initialTasks }: ProjectWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  return (
    <div className="h-screen flex flex-col">
      {/* Project Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger value="canvas" className="gap-2">
              <Palette className="h-4 w-4" />
              Canvas
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="flex-1 m-0">
          <KanbanBoard initialTasks={tasks} onTasksChange={setTasks} projectId={project.id} />
        </TabsContent>

        <TabsContent value="canvas" className="flex-1 m-0">
          <CanvasWorkspace width={window.innerWidth} height={window.innerHeight - 180} projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
