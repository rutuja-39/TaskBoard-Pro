"use client"

import { Users, Eye, MousePointer } from "lucide-react"
import type { UserPresence } from "@/lib/types"

type PresencePanelProps = {
  presences: UserPresence[]
  currentUserId: string
  onFollowUser: (userId: string) => void
  followingUserId: string | null
}

export function PresencePanel({
  presences,
  currentUserId,
  onFollowUser,
  followingUserId,
}: PresencePanelProps) {
  const activeUsers = presences.filter(p => p.userId !== currentUserId)

  if (activeUsers.length === 0) {
    return null
  }

  return (
    <div className="absolute top-4 right-4 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">
          Active Users ({activeUsers.length})
        </span>
      </div>

      <div className="space-y-2">
        {activeUsers.map((presence) => (
          <div
            key={presence.userId}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer group"
            onClick={() => onFollowUser(presence.userId)}
          >
            {/* User Color Indicator */}
            <div
              className="w-3 h-3 rounded-full ring-2 ring-white"
              style={{ backgroundColor: presence.userColor }}
            />

            {/* User Name */}
            <span className="text-sm flex-1 truncate">
              {presence.userName}
            </span>

            {/* Follow Button */}
            <button
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background ${
                followingUserId === presence.userId ? "opacity-100 bg-primary text-primary-foreground" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation()
                onFollowUser(presence.userId)
              }}
            >
              {followingUserId === presence.userId ? (
                <Eye className="h-3 w-3" />
              ) : (
                <MousePointer className="h-3 w-3" />
              )}
            </button>
          </div>
        ))}
      </div>

      {followingUserId && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>Following {activeUsers.find(p => p.userId === followingUserId)?.userName}</span>
          </div>
          <button
            className="mt-2 w-full text-xs py-1 px-2 bg-accent hover:bg-accent/80 rounded transition-colors"
            onClick={() => onFollowUser("")}
          >
            Stop Following
          </button>
        </div>
      )}
    </div>
  )
}

