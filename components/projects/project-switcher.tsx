"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Plus, Settings } from "lucide-react"
import type { Project } from "@/lib/types"

type ProjectSwitcherProps = {
  projects: Project[]
  currentProject: Project | null
  onProjectChange: (project: Project) => void
  onCreateProject: () => void
  onProjectSettings: () => void
}

export function ProjectSwitcher({
  projects,
  currentProject,
  onProjectChange,
  onCreateProject,
  onProjectSettings,
}: ProjectSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-64 justify-between bg-transparent">
          <span className="truncate">{currentProject?.name || "Select Project"}</span>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Your Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((project) => (
          <DropdownMenuItem key={project.id} onClick={() => onProjectChange(project)}>
            <div className="flex flex-col gap-1">
              <span className="font-medium">{project.name}</span>
              {project.description && <span className="text-xs text-muted-foreground">{project.description}</span>}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </DropdownMenuItem>
        {currentProject && (
          <DropdownMenuItem onClick={onProjectSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Project Settings
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
