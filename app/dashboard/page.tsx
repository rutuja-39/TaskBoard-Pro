"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { CanvasWorkspace } from "@/components/canvas/canvas-workspace"
import { WorkspaceHeader } from "@/components/dashboard/workspace-header"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog"
import type { ViewMode, Task, Project } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const [tasks, setTasks] = useState<Task[]>([])
  const [userName, setUserName] = useState("User")
  const [loading, setLoading] = useState(true)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user info
        const userRes = await fetch("/api/auth/me")
        if (!userRes.ok) {
          router.push("/")
          return
        }
        const userData = await userRes.json()
        setUserName(userData.user.name)

        const projectsRes = await fetch("/api/projects")
        const projectsData = await projectsRes.json()
        const userProjects = projectsData.projects.map((p: any) => ({
          ...p,
          id: p._id?.toString() || p.id,
        }))
        setProjects(userProjects)

        if (userProjects.length > 0) {
          setCurrentProject(userProjects[0])
        } else {
          // Create a default project
          const createRes = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "My First Project", description: "Get started with TaskBoard Pro" }),
          })
          const createData = await createRes.json()
          const newProject = { ...createData.project, id: createData.project._id?.toString() || createData.project.id }
          setProjects([newProject])
          setCurrentProject(newProject)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch data:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    if (currentProject) {
      fetchTasks()
    }
  }, [currentProject])

  const fetchTasks = async () => {
    if (!currentProject) return

    try {
      const tasksRes = await fetch(`/api/tasks?projectId=${currentProject.id}`)
      const tasksData = await tasksRes.json()
      // Filter out tasks that belong to hybrid boards (those with boardId)
      // Main Kanban should only show "traditional" tasks without boardId
      const traditionalTasks = (tasksData.tasks || []).filter((task: Task) => !task.boardId)
      console.log("[Dashboard] Fetched", traditionalTasks.length, "traditional Kanban tasks,", 
                  (tasksData.tasks?.length || 0) - traditionalTasks.length, "hybrid board tasks excluded")
      setTasks(traditionalTasks)
    } catch (error) {
      console.error("[v0] Failed to fetch tasks:", error)
    }
  }

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 73, // Subtract header height
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  const handleProjectChange = (project: Project) => {
    setCurrentProject(project)
  }

  const handleCreateProject = async (name: string, description: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      const newProject = { ...data.project, id: data.project._id?.toString() || data.project.id }
      setProjects([...projects, newProject])
      setCurrentProject(newProject)
    } catch (error) {
      console.error("[v0] Failed to create project:", error)
    }
  }

  const handleUpdateProject = async (name: string, description: string) => {
    if (!currentProject) return

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })

      const updatedProject = { ...currentProject, name, description }
      setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)))
      setCurrentProject(updatedProject)
    } catch (error) {
      console.error("[v0] Failed to update project:", error)
    }
  }

  const handleDeleteProject = async () => {
    if (!currentProject) return

    try {
      await fetch(`/api/projects/${currentProject.id}`, { method: "DELETE" })

      const remainingProjects = projects.filter((p) => p.id !== currentProject.id)
      setProjects(remainingProjects)
      setCurrentProject(remainingProjects[0] || null)
    } catch (error) {
      console.error("[v0] Failed to delete project:", error)
    }
  }

  const handleRefreshProject = async () => {
    if (!currentProject) return

    try {
      const res = await fetch(`/api/projects/${currentProject.id}`)
      const data = await res.json()
      const refreshedProject = { ...data.project, id: data.project._id?.toString() || data.project.id }
      setProjects(projects.map((p) => (p.id === currentProject.id ? refreshedProject : p)))
      setCurrentProject(refreshedProject)
    } catch (error) {
      console.error("[v0] Failed to refresh project:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WorkspaceHeader
        userName={userName}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onLogout={handleLogout}
        projects={projects}
        currentProject={currentProject}
        onProjectChange={handleProjectChange}
        onCreateProject={() => setCreateDialogOpen(true)}
        onProjectSettings={() => setSettingsDialogOpen(true)}
      />

      <div className="flex-1 overflow-hidden">
        {currentProject ? (
          <>
            {viewMode === "kanban" && (
              <KanbanBoard initialTasks={tasks} onTasksChange={setTasks} projectId={currentProject.id} />
            )}
            {viewMode === "canvas" && (
              <CanvasWorkspace width={dimensions.width} height={dimensions.height} projectId={currentProject.id} />
            )}
            {viewMode === "hybrid" && (
              <div className="h-full p-4 text-center text-muted-foreground">
                Hybrid mode coming soon - Kanban board on infinite canvas
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-4">No projects yet</p>
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateProject={handleCreateProject}
      />

      <ProjectSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        project={currentProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onRefreshProject={handleRefreshProject}
      />
    </div>
  )
}
