"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2, Crown, Shield, User, Eye } from "lucide-react"
import type { Project, UserRole } from "@/lib/types"

type TeamMembersTabProps = {
  project: Project
  onRefresh: () => Promise<void>
}

export function TeamMembersTab({ project, onRefresh }: TeamMembersTabProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("member")
  const [loading, setLoading] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to invite member")
        return
      }

      setEmail("")
      setRole("member")
      await onRefresh()
    } catch (error) {
      console.error("[v0] Failed to invite member:", error)
      alert("Failed to invite member")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/members?userId=${userId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to remove member")
        return
      }

      await onRefresh()
    } catch (error) {
      console.error("[v0] Failed to remove member:", error)
      alert("Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />
      case "admin":
        return <Shield className="h-3 w-3" />
      case "member":
        return <User className="h-3 w-3" />
      case "viewer":
        return <Eye className="h-3 w-3" />
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6 py-4">
      {/* Invite Form */}
      <form onSubmit={handleInvite} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Invite Team Member</Label>
          <div className="flex gap-2">
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading || !email.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Invite team members by email. They'll be added immediately if they have an account.
          </p>
        </div>
      </form>

      {/* Members List */}
      <div className="space-y-2">
        <Label>Team Members ({project.members.length})</Label>
        <div className="border rounded-lg divide-y">
          {project.members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.name}</span>
                  <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                    {getRoleIcon(member.role)}
                    {member.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              {member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Role Permissions:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            <strong>Owner:</strong> Full control, can delete project
          </li>
          <li>
            <strong>Admin:</strong> Manage members, edit project settings
          </li>
          <li>
            <strong>Member:</strong> Create and edit tasks, use canvas
          </li>
          <li>
            <strong>Viewer:</strong> View-only access
          </li>
        </ul>
      </div>
    </div>
  )
}
