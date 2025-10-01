"use client"

import { Button } from "@/components/ui/button"
import { LogOut, LayoutGrid, Presentation, Layers } from "lucide-react"
import { ProjectSwitcher } from "@/components/projects/project-switcher"
import type { ViewMode, Project } from "@/lib/types"

type WorkspaceHeaderProps = {
  userName: string
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onLogout: () => void
  projects: Project[]
  currentProject: Project | null
  onProjectChange: (project: Project) => void
  onCreateProject: () => void
  onProjectSettings: () => void
}

export function WorkspaceHeader({
  userName,
  viewMode,
  onViewModeChange,
  onLogout,
  projects,
  currentProject,
  onProjectChange,
  onCreateProject,
  onProjectSettings,
}: WorkspaceHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">TaskBoard Pro</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {userName}</p>
          </div>
          <ProjectSwitcher
            projects={projects}
            currentProject={currentProject}
            onProjectChange={onProjectChange}
            onCreateProject={onCreateProject}
            onProjectSettings={onProjectSettings}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("kanban")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "canvas" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("canvas")}
            >
              <Presentation className="h-4 w-4 mr-2" />
              Canvas
            </Button>
            <Button
              variant={viewMode === "hybrid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("hybrid")}
            >
              <Layers className="h-4 w-4 mr-2" />
              Hybrid
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
