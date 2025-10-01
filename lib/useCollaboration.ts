"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import type { UserPresence, SpatialComment } from "./types"

type CollaborationHookProps = {
  projectId: string | undefined
  userId: string
  userName: string
  userColor: string
  onPresenceUpdate: (presences: UserPresence[]) => void
  onCommentCreated: (comment: SpatialComment) => void
  onCommentUpdated: (comment: SpatialComment) => void
}

export function useCollaboration({
  projectId,
  userId,
  userName,
  userColor,
  onPresenceUpdate,
  onCommentCreated,
  onCommentUpdated,
}: CollaborationHookProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const cursorUpdateTimeout = useRef<NodeJS.Timeout | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!projectId || !userId) {
      console.log("[Collab] No projectId or userId, skipping socket connection", { projectId, userId })
      return
    }

    console.log("[Collab] Initializing socket connection for project:", projectId, "user:", userName)
    
    // Connect to Socket.io server
    const socketInstance = io({
      path: "/api/socket",
      addTrailingSlash: false,
    })

    socketInstance.on("connect", () => {
      console.log("[Collab] ✅ Connected to WebSocket, socket ID:", socketInstance.id)
      setIsConnected(true)
      
      // Join project room
      console.log("[Collab] Joining project room:", projectId, "as user:", userName)
      socketInstance.emit("join-project", { projectId, userId, userName, userColor })
    })

    socketInstance.on("disconnect", () => {
      console.log("[Collab] ❌ Disconnected from WebSocket")
      setIsConnected(false)
    })
    
    socketInstance.on("connect_error", (error) => {
      console.error("[Collab] ❌ Connection error:", error)
    })

    // Listen for presence updates
    socketInstance.on("presence-update", (presences: UserPresence[]) => {
      console.log("[Collab] 👥 Presence update received:", presences.length, "users")
      onPresenceUpdate(presences)
    })

    // Listen for new comments
    socketInstance.on("comment-created", (comment: SpatialComment) => {
      console.log("[Collab] 💬 New comment received:", comment.id)
      onCommentCreated(comment)
    })

    // Listen for comment updates
    socketInstance.on("comment-updated", (comment: SpatialComment) => {
      console.log("[Collab] 💬 Comment updated:", comment.id)
      onCommentUpdated(comment)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.emit("leave-project", { projectId, userId })
      socketInstance.disconnect()
    }
  }, [projectId, userId, userName, userColor])

  // Broadcast cursor movement
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!socket || !projectId) {
        // Uncomment for debugging: console.log("[Collab] Cannot broadcast cursor: socket or projectId missing")
        return
      }

      // Throttle cursor updates
      if (cursorUpdateTimeout.current) {
        clearTimeout(cursorUpdateTimeout.current)
      }

      cursorUpdateTimeout.current = setTimeout(() => {
        socket.emit("cursor-move", {
          projectId,
          userId,
          cursor: { x, y },
        })
      }, 50) // Update max every 50ms
    },
    [socket, projectId, userId]
  )

  // Broadcast viewport changes
  const broadcastViewport = useCallback(
    (x: number, y: number, zoom: number) => {
      if (!socket || !projectId) return

      socket.emit("viewport-change", {
        projectId,
        userId,
        viewport: { x, y, zoom },
      })
    },
    [socket, projectId, userId]
  )

  // Broadcast object selection
  const broadcastSelection = useCallback(
    (objectId: string | null) => {
      if (!socket || !projectId) return

      socket.emit("object-select", {
        projectId,
        userId,
        selectedObject: objectId,
      })
    },
    [socket, projectId, userId]
  )

  // Broadcast comment creation
  const broadcastComment = useCallback(
    (comment: SpatialComment) => {
      if (!socket || !projectId) return

      socket.emit("create-comment", {
        projectId,
        comment,
      })
    },
    [socket, projectId]
  )

  // Broadcast comment update
  const broadcastCommentUpdate = useCallback(
    (comment: SpatialComment) => {
      if (!socket || !projectId) return

      socket.emit("update-comment", {
        projectId,
        comment,
      })
    },
    [socket, projectId]
  )

  return {
    isConnected,
    broadcastCursor,
    broadcastViewport,
    broadcastSelection,
    broadcastComment,
    broadcastCommentUpdate,
  }
}

