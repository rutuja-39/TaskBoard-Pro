"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2 } from "lucide-react"
import type { Project } from "@/lib/types"
import { TeamMembersTab } from "./team-members-tab"

type ProjectSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onUpdateProject: (name: string, description: string) => Promise<void>
  onDeleteProject: () => Promise<void>
  onRefreshProject: () => Promise<void>
}

export function ProjectSettingsDialog({
  open,
  onOpenChange,
  project,
  onUpdateProject,
  onDeleteProject,
  onRefreshProject,
}: ProjectSettingsDialogProps) {
  const [name, setName] = useState(project?.name || "")
  const [description, setDescription] = useState(project?.description || "")
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onUpdateProject(name, description)
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to update project:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    setLoading(true)
    try {
      await onDeleteProject()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to delete project:", error)
    } finally {
      setLoading(false)
      setDeleteConfirm(false)
    }
  }

  if (!project) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        setDeleteConfirm(false)
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>Manage your project settings and team members.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant={deleteConfirm ? "destructive" : "outline"}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteConfirm ? "Confirm Delete" : "Delete Project"}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !name.trim()}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="team">
            <TeamMembersTab project={project} onRefresh={onRefreshProject} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
