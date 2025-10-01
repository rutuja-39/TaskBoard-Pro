"use client"

import { useState, useRef, useEffect } from "react"
import { Stage, Layer, Rect, Circle, Line, Arrow, RegularPolygon, Group, Text as KonvaText } from "react-konva"
import { CanvasToolbar } from "./canvas-toolbar"
import { StickyNote } from "./sticky-note"
import { TextBox } from "./text-box"
import { HybridKanbanBoard } from "./hybrid-kanban-board"
import { CanvasLinkComponent } from "./canvas-link"
import { UserCursor } from "./user-cursor"
import { SpatialCommentComponent } from "./spatial-comment"
import { PresencePanel } from "./presence-panel"
import { CreateTaskDialog } from "@/components/kanban/create-task-dialog"
import { TaskDetailsDialog } from "@/components/kanban/task-details-dialog"
import { useCollaboration } from "@/lib/useCollaboration"
import type { CanvasTool, HybridBoard, HybridColumn, Task, CanvasLink, UserPresence, SpatialComment } from "@/lib/types"

type CanvasWorkspaceProps = {
  width: number
  height: number
  projectId?: string
}

type StickyNoteObject = {
  id: string
  x: number
  y: number
  text: string
  color: string
  saved?: boolean
}

type ShapeObject = {
  id: string
  type: "rectangle" | "circle" | "triangle" | "diamond" | "arrow"
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke?: string
  rotation?: number
  saved?: boolean
}

type DrawingObject = {
  id: string
  points: number[]
  stroke: string
  strokeWidth: number
  saved?: boolean
}

type TextObject = {
  id: string
  x: number
  y: number
  text: string
  fontSize: number
  fill: string
  saved?: boolean
}

type FrameObject = {
  id: string
  x: number
  y: number
  width: number
  height: number
  title: string
  saved?: boolean
}

export function CanvasWorkspace({ width, height, projectId }: CanvasWorkspaceProps) {
  const [activeTool, setActiveTool] = useState<CanvasTool>("select")
  const [zoom, setZoom] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stickyNotes, setStickyNotes] = useState<StickyNoteObject[]>([])
  const [shapes, setShapes] = useState<ShapeObject[]>([])
  const [drawings, setDrawings] = useState<DrawingObject[]>([])
  const [textBoxes, setTextBoxes] = useState<TextObject[]>([])
  const [frames, setFrames] = useState<FrameObject[]>([])
  const [hybridBoards, setHybridBoards] = useState<HybridBoard[]>([])
  const [boardTasks, setBoardTasks] = useState<Task[]>([])
  const [canvasLinks, setCanvasLinks] = useState<CanvasLink[]>([])
  const [linkStart, setLinkStart] = useState<{ id: string; type: string } | null>(null)
  const [spatialComments, setSpatialComments] = useState<SpatialComment[]>([])
  const [userPresences, setUserPresences] = useState<UserPresence[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; color: string }>({
    id: "",
    name: "Loading...",
    color: "#3b82f6",
  })
  const [followingUserId, setFollowingUserId] = useState<string | null>(null)
  
  // Task dialog state
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [selectedTaskForDialog, setSelectedTaskForDialog] = useState<Task | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [activeColumnForNewTask, setActiveColumnForNewTask] = useState<{ boardId: string; columnId: string } | null>(null)
  
  // User colors for collaboration
  const getUserColor = (userId: string) => {
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }
  const [currentDrawing, setCurrentDrawing] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentColor, setCurrentColor] = useState("#93c5fd")
  const [showGrid, setShowGrid] = useState(true)
  const stageRef = useRef<any>(null)

  const stickyColors = ["#fef08a", "#bfdbfe", "#fecaca", "#d9f99d", "#e9d5ff", "#fde68a", "#c7d2fe", "#fed7aa"]

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("[Canvas] 🔍 Fetching current user...")
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          const user = {
            id: data.user.id,
            name: data.user.name || data.user.email,
            color: getUserColor(data.user.id),
          }
          console.log("[Canvas] ✅ Current user fetched:", user)
          setCurrentUser(user)
        } else {
          console.error("[Canvas] ❌ Failed to fetch user, status:", response.status)
        }
      } catch (error) {
        console.error("[Canvas] ❌ Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    loadCanvasObjects()
  }, [projectId])

  // Initialize real-time collaboration
  const {
    isConnected,
    broadcastCursor,
    broadcastViewport,
    broadcastSelection,
    broadcastComment,
    broadcastCommentUpdate,
  } = useCollaboration({
    projectId,
    userId: currentUser.id,
    userName: currentUser.name,
    userColor: currentUser.color,
    onPresenceUpdate: (presences) => {
      console.log("[Canvas] 👥 Received presence update:", presences)
      // Filter out current user from presences
      const otherUsers = presences.filter(p => p.userId !== currentUser.id)
      console.log("[Canvas] 👥 Setting", otherUsers.length, "other users")
      setUserPresences(otherUsers)
    },
    onCommentCreated: (comment) => {
      console.log("[Canvas] 💬 Received new comment:", comment)
      setSpatialComments((prev) => [...prev, comment])
    },
    onCommentUpdated: (comment) => {
      console.log("[Canvas] 💬 Received comment update:", comment)
      setSpatialComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      )
    },
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case "v":
          setActiveTool("select")
          setLinkStart(null)
          break
        case "h":
          setActiveTool("pan")
          setLinkStart(null)
          break
        case "b":
          setActiveTool("board")
          setLinkStart(null)
          break
        case "s":
          setActiveTool("sticky")
          setLinkStart(null)
          break
        case "p":
          setActiveTool("pen")
          setLinkStart(null)
          break
        case "r":
          setActiveTool("shape")
          setLinkStart(null)
          break
        case "t":
          setActiveTool("text")
          setLinkStart(null)
          break
        case "l":
          setActiveTool("link")
          break
        case "c":
          setActiveTool("comment")
          setLinkStart(null)
          break
        case "g":
          setShowGrid(!showGrid)
          break
        case "delete":
        case "backspace":
          if (selectedId) {
            // Delete selected object
            setStickyNotes(stickyNotes.filter(n => n.id !== selectedId))
            setShapes(shapes.filter(s => s.id !== selectedId))
            setTextBoxes(textBoxes.filter(t => t.id !== selectedId))
            setDrawings(drawings.filter(d => d.id !== selectedId))
            setHybridBoards(hybridBoards.filter(b => b.id !== selectedId))
            setSelectedId(null)
          }
          break
        case "0":
          handleZoomReset()
          break
        case "+":
        case "=":
          handleZoomIn()
          break
        case "-":
          handleZoomOut()
          break
        case " ":
          if (!isPanning) {
            setActiveTool("pan")
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " && activeTool === "pan") {
        setActiveTool("select")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [activeTool, selectedId, stickyNotes, shapes, textBoxes, drawings, showGrid, isPanning])

  const loadCanvasObjects = async () => {
    try {
      const url = projectId ? `/api/canvas?projectId=${projectId}` : "/api/canvas"
      const response = await fetch(url)
      const data = await response.json()

      if (data.objects) {
        const loadedStickies: StickyNoteObject[] = []
        const loadedShapes: ShapeObject[] = []
        const loadedDrawings: DrawingObject[] = []
        const loadedTexts: TextObject[] = []
        const loadedBoards: HybridBoard[] = []
        const loadedLinks: CanvasLink[] = []
        const loadedComments: SpatialComment[] = []

        data.objects.forEach((obj: any) => {
          if (obj.type === "sticky") {
            loadedStickies.push({
              id: obj.id,
              x: obj.position.x,
              y: obj.position.y,
              text: obj.content.text,
              color: obj.content.color,
              saved: true,
            })
          } else if (obj.type === "shape") {
            loadedShapes.push({
              id: obj.id,
              type: obj.content.shapeType,
              x: obj.position.x,
              y: obj.position.y,
              width: obj.size?.width || 100,
              height: obj.size?.height || 100,
              fill: obj.style.fill || "#93c5fd",
              rotation: obj.rotation || 0,
              saved: true,
            })
          } else if (obj.type === "drawing") {
            loadedDrawings.push({
              id: obj.id,
              points: obj.content.points.flatMap((p: any) => [p.x, p.y]),
              stroke: obj.style.stroke || "#000",
              strokeWidth: obj.style.strokeWidth || 2,
              saved: true,
            })
          } else if (obj.type === "text") {
            loadedTexts.push({
              id: obj.id,
              x: obj.position.x,
              y: obj.position.y,
              text: obj.content.text,
              fontSize: obj.style.fontSize || 24,
              fill: obj.style.fill || "#000000",
              saved: true,
            })
          } else if (obj.type === "kanban_board") {
            loadedBoards.push({
              id: obj.id,
              projectId: obj.projectId || "",
              x: obj.position.x,
              y: obj.position.y,
              width: obj.size?.width || 900,
              height: obj.size?.height || 600,
              title: obj.content.title || "Board",
              columns: obj.content.columns || [],
              collapsed: obj.content.collapsed || false,
              style: obj.style || {
                backgroundColor: "#ffffff",
                borderColor: "#3b82f6",
                headerColor: "#3b82f6",
              },
              saved: true,
            })
          } else if (obj.type === "link") {
            loadedLinks.push({
              id: obj.id,
              fromId: obj.content.fromId,
              fromType: obj.content.fromType,
              toId: obj.content.toId,
              toType: obj.content.toType,
              linkType: obj.content.linkType || "reference",
              style: obj.style || {
                color: "#3b82f6",
                lineType: "solid",
                arrow: true,
              },
              saved: true,
            })
          } else if (obj.type === "spatial_comment") {
            loadedComments.push({
              id: obj.id,
              userId: obj.content.userId || "unknown",
              userName: obj.content.userName || "Unknown User",
              userColor: obj.content.userColor || "#3b82f6",
              text: obj.content.text || "",
              x: obj.position.x,
              y: obj.position.y,
              resolved: obj.content.resolved || false,
              replies: obj.content.replies || [],
              createdAt: new Date(obj.createdAt),
              updatedAt: new Date(obj.updatedAt),
              saved: true,
            })
          }
        })

        setStickyNotes(loadedStickies)
        setShapes(loadedShapes)
        setDrawings(loadedDrawings)
        setTextBoxes(loadedTexts)
        setHybridBoards(loadedBoards)
        setCanvasLinks(loadedLinks)
        setSpatialComments(loadedComments)
        
        // Load tasks for hybrid boards
        if (projectId && loadedBoards.length > 0) {
          loadHybridBoardTasks()
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load canvas objects:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadHybridBoardTasks = async () => {
    if (!projectId) return
    
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        // Filter to only tasks that belong to hybrid boards (have boardId)
        const hybridTasks = (data.tasks || []).filter((task: Task) => task.boardId)
        console.log("[Canvas] Loaded", hybridTasks.length, "tasks for hybrid boards")
        setBoardTasks(hybridTasks)
      }
    } catch (error) {
      console.error("[Canvas] Failed to load hybrid board tasks:", error)
    }
  }

  const saveObject = async (type: string, obj: any) => {
    try {
      const payload: any = {
        type,
        position: { x: obj.x, y: obj.y },
        projectId,
      }

      if (type === "sticky") {
        payload.content = { text: obj.text, color: obj.color }
      } else if (type === "shape") {
        payload.content = { shapeType: obj.type }
        payload.size = { width: obj.width, height: obj.height }
        payload.style = { fill: obj.fill, stroke: obj.stroke || "#666" }
        payload.rotation = obj.rotation || 0
      } else if (type === "drawing") {
        const points = []
        for (let i = 0; i < obj.points.length; i += 2) {
          points.push({ x: obj.points[i], y: obj.points[i + 1] })
        }
        payload.content = { points }
        payload.style = { stroke: obj.stroke, strokeWidth: obj.strokeWidth }
        payload.position = { x: 0, y: 0 }
      } else if (type === "text") {
        payload.content = { text: obj.text }
        payload.style = { fontSize: obj.fontSize, fill: obj.fill || "#000000" }
      }

      const response = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        return data.object.id
      }
    } catch (error) {
      console.error("[v0] Failed to save canvas object:", error)
    }
    return null
  }

  const updateObject = async (id: string, updates: any) => {
    try {
      await fetch(`/api/canvas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error("[v0] Failed to update canvas object:", error)
    }
  }

  const saveHybridBoard = async (board: HybridBoard) => {
    try {
      const payload = {
        type: "kanban_board",
        position: { x: board.x, y: board.y },
        size: { width: board.width, height: board.height },
        style: board.style,
        content: {
          title: board.title,
          columns: board.columns,
          collapsed: board.collapsed,
        },
        projectId,
      }

      const response = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        return data.object.id
      }
    } catch (error) {
      console.error("[v0] Failed to save hybrid board:", error)
    }
    return null
  }

  const updateHybridBoard = async (board: HybridBoard) => {
    try {
      await fetch(`/api/canvas/${board.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: { x: board.x, y: board.y },
          size: { width: board.width, height: board.height },
          content: {
            title: board.title,
            columns: board.columns,
            collapsed: board.collapsed,
          },
          style: board.style,
        }),
      })
    } catch (error) {
      console.error("[v0] Failed to update hybrid board:", error)
    }
  }

  const saveComment = async (comment: SpatialComment) => {
    try {
      const payload = {
        type: "spatial_comment",
        position: { x: comment.x, y: comment.y },
        content: {
          text: comment.text,
          userId: comment.userId,
          userName: comment.userName,
          userColor: comment.userColor,
          resolved: comment.resolved,
          replies: comment.replies,
        },
        projectId,
      }

      const response = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        return data.object.id
      }
    } catch (error) {
      console.error("[v0] Failed to save comment:", error)
    }
    return null
  }

  const updateComment = async (comment: SpatialComment) => {
    try {
      await fetch(`/api/canvas/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: { x: comment.x, y: comment.y },
          content: {
            text: comment.text,
            resolved: comment.resolved,
            replies: comment.replies,
          },
        }),
      })
    } catch (error) {
      console.error("[v0] Failed to update comment:", error)
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.1))
  }

  const handleZoomReset = () => {
    setZoom(1)
    setStagePos({ x: 0, y: 0 })
  }

  const handleWheel = (e: any) => {
    e.evt.preventDefault()

    const scaleBy = 1.05
    const stage = e.target.getStage()
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    const clampedScale = Math.max(0.1, Math.min(3, newScale))

    setZoom(clampedScale)

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }
    setStagePos(newPos)
    
    // Broadcast viewport change
    broadcastViewport(newPos.x, newPos.y, clampedScale)
  }

  const getRelativePointerPosition = (stage: any) => {
    const pointer = stage.getPointerPosition()
    return {
      x: (pointer.x - stagePos.x) / zoom,
      y: (pointer.y - stagePos.y) / zoom,
    }
  }

  const handleStageClick = async (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null)

      const stage = e.target.getStage()
      const pos = getRelativePointerPosition(stage)

      if (activeTool === "board") {
        const tempId = `board-${Date.now()}`
        const newBoard: HybridBoard = {
          id: tempId,
          projectId: projectId || "",
          x: pos.x,
          y: pos.y,
          width: 900,
          height: 600,
          title: "New Board",
          columns: [
            { id: "col-1", title: "To Do", color: "#f3f4f6", taskIds: [] },
            { id: "col-2", title: "In Progress", color: "#fef3c7", taskIds: [] },
            { id: "col-3", title: "Done", color: "#d1fae5", taskIds: [] },
          ],
          collapsed: false,
          style: {
            backgroundColor: "#ffffff",
            borderColor: "#3b82f6",
            headerColor: "#3b82f6",
          },
          saved: false,
        }
        setHybridBoards([...hybridBoards, newBoard])

        const savedId = await saveHybridBoard(newBoard)
        if (savedId) {
          setHybridBoards((prev) => prev.map((b) => (b.id === tempId ? { ...b, id: savedId, saved: true } : b)))
        }

        setActiveTool("select")
      } else if (activeTool === "comment") {
        const tempId = `comment-${Date.now()}`
        const newComment: SpatialComment = {
          id: tempId,
          userId: currentUser.id,
          userName: currentUser.name,
          userColor: currentUser.color,
          text: "New comment - double click to edit",
          x: pos.x,
          y: pos.y,
          resolved: false,
          replies: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          saved: false,
        }
        setSpatialComments([...spatialComments, newComment])

        // Save to database
        const savedId = await saveComment(newComment)
        if (savedId) {
          const savedComment = { ...newComment, id: savedId, saved: true }
          setSpatialComments((prev) => prev.map((c) => (c.id === tempId ? savedComment : c)))
          // Broadcast new comment to other users
          broadcastComment(savedComment)
        }

        setActiveTool("select")
      } else if (activeTool === "sticky") {
        const randomColor = stickyColors[Math.floor(Math.random() * stickyColors.length)]
        const tempId = `sticky-${Date.now()}`
        const newSticky: StickyNoteObject = {
          id: tempId,
          x: pos.x,
          y: pos.y,
          text: "Double-click to edit",
          color: randomColor,
          saved: false,
        }
        setStickyNotes([...stickyNotes, newSticky])

        const savedId = await saveObject("sticky", newSticky)
        if (savedId) {
          setStickyNotes((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: savedId, saved: true } : s)))
        }

        setActiveTool("select")
      } else if (activeTool === "shape") {
        const tempId = `shape-${Date.now()}`
        const newShape: ShapeObject = {
          id: tempId,
          type: "rectangle",
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 100,
          fill: currentColor,
          stroke: "#666",
          saved: false,
        }
        setShapes([...shapes, newShape])

        const savedId = await saveObject("shape", newShape)
        if (savedId) {
          setShapes((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: savedId, saved: true } : s)))
        }

        setActiveTool("select")
      } else if (activeTool === "text") {
        const tempId = `text-${Date.now()}`
        const newText: TextObject = {
          id: tempId,
          x: pos.x,
          y: pos.y,
          text: "Click to edit text",
          fontSize: 24,
          fill: "#000000",
          saved: false,
        }
        setTextBoxes([...textBoxes, newText])

        const savedId = await saveObject("text", newText)
        if (savedId) {
          setTextBoxes((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: savedId, saved: true } : t)))
        }

        setActiveTool("select")
      }
    }
  }

  const handleMouseDown = (e: any) => {
    if (activeTool === "pan" || e.evt.button === 1 || e.evt.metaKey || e.evt.ctrlKey) {
      setIsPanning(true)
    } else if (activeTool === "pen") {
      setIsDrawing(true)
      const stage = e.target.getStage()
      const pos = getRelativePointerPosition(stage)
      setCurrentDrawing([pos.x, pos.y])
    }
  }

  const handleMouseUp = async () => {
    setIsPanning(false)

    if (isDrawing && currentDrawing.length > 0) {
      const tempId = `drawing-${Date.now()}`
      const newDrawing: DrawingObject = {
        id: tempId,
        points: currentDrawing,
        stroke: currentColor,
        strokeWidth: 3,
        saved: false,
      }
      setDrawings([...drawings, newDrawing])

      const savedId = await saveObject("drawing", newDrawing)
      if (savedId) {
        setDrawings((prev) => prev.map((d) => (d.id === tempId ? { ...d, id: savedId, saved: true } : d)))
      }

      setCurrentDrawing([])
      setIsDrawing(false)
    }
  }

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage()

    if (isPanning) {
      const newPos = {
        x: stagePos.x + e.evt.movementX,
        y: stagePos.y + e.evt.movementY,
      }
      setStagePos(newPos)
      // Broadcast viewport change
      broadcastViewport(newPos.x, newPos.y, zoom)
    } else if (isDrawing) {
      const pos = getRelativePointerPosition(stage)
      setCurrentDrawing([...currentDrawing, pos.x, pos.y])
    } else {
      // Broadcast cursor position in canvas coordinates
      const pos = getRelativePointerPosition(stage)
      broadcastCursor(pos.x, pos.y)
    }
  }

  const getObjectPosition = (id: string, type: string): { x: number; y: number } | null => {
    if (type === "sticky") {
      const obj = stickyNotes.find(n => n.id === id)
      return obj ? { x: obj.x + 100, y: obj.y + 75 } : null // Center of sticky note
    } else if (type === "shape") {
      const obj = shapes.find(s => s.id === id)
      return obj ? { x: obj.x + (obj.width / 2), y: obj.y + (obj.height / 2) } : null
    } else if (type === "text") {
      const obj = textBoxes.find(t => t.id === id)
      return obj ? { x: obj.x + 50, y: obj.y + 20 } : null
    } else if (type === "board") {
      const obj = hybridBoards.find(b => b.id === id)
      return obj ? { x: obj.x + (obj.width / 2), y: obj.y + 25 } : null
    }
    return null
  }

  const createLink = async (fromId: string, fromType: string, toId: string, toType: string) => {
    const tempId = `link-${Date.now()}`
    const newLink: CanvasLink = {
      id: tempId,
      fromId,
      fromType: fromType as any,
      toId,
      toType: toType as any,
      linkType: "reference",
      style: {
        color: currentColor,
        lineType: "solid",
        arrow: true,
      },
      saved: false,
    }
    
    setCanvasLinks([...canvasLinks, newLink])
    
    // Save to database
    try {
      const response = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "link",
          position: { x: 0, y: 0 },
          content: {
            fromId,
            fromType,
            toId,
            toType,
            linkType: "reference",
          },
          style: newLink.style,
          projectId,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCanvasLinks(prev => prev.map(l => l.id === tempId ? { ...l, id: data.object.id, saved: true } : l))
      }
    } catch (error) {
      console.error("[v0] Failed to save link:", error)
    }
  }

  const handleObjectClick = (id: string, type: string) => {
    if (activeTool === "link") {
      if (!linkStart) {
        // First click: set link start
        setLinkStart({ id, type })
        setSelectedId(id)
        broadcastSelection(id)
      } else if (linkStart.id === id) {
        // Clicked same object: cancel
        setLinkStart(null)
        setSelectedId(null)
        broadcastSelection(null)
      } else {
        // Second click: create link
        createLink(linkStart.id, linkStart.type, id, type)
        setLinkStart(null)
        setSelectedId(null)
        broadcastSelection(null)
      }
    } else {
      // Normal select mode
      setSelectedId(id)
      broadcastSelection(id)
      // Highlight connected links
      const connectedLinks = canvasLinks.filter(l => l.fromId === id || l.toId === id)
      if (connectedLinks.length > 0) {
        setHighlightedLinkId(connectedLinks[0].id)
      } else {
        setHighlightedLinkId(null)
      }
    }
  }

  const getCursor = () => {
    if (isPanning) return "grabbing"
    if (activeTool === "pan") return "grab"
    if (activeTool === "pen") return "crosshair"
    if (activeTool === "text") return "text"
    if (activeTool === "board") return "crosshair"
    if (activeTool === "link") return "crosshair"
    if (activeTool === "comment") return "crosshair"
    return "default"
  }

  const renderGrid = () => {
    if (!showGrid) return null

    const gridSize = 40
    const gridLines = []
    
    // Calculate visible area in canvas coordinates
    const startX = Math.floor((-stagePos.x / zoom) / gridSize) * gridSize
    const endX = Math.ceil((width - stagePos.x) / zoom / gridSize) * gridSize
    const startY = Math.floor((-stagePos.y / zoom) / gridSize) * gridSize
    const endY = Math.ceil((height - stagePos.y) / zoom / gridSize) * gridSize

    // Adjust stroke width based on zoom to keep lines visible
    const strokeWidth = 1 / zoom

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY - gridSize, x, endY + gridSize]}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          listening={false}
        />
      )
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[startX - gridSize, y, endX + gridSize, y]}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          listening={false}
        />
      )
    }

    return gridLines
  }

  const renderShape = (shape: ShapeObject) => {
    const commonProps = {
      key: shape.id,
      x: shape.x,
      y: shape.y,
      fill: shape.fill,
      stroke: selectedId === shape.id ? "#000" : (shape.stroke || "#666"),
      strokeWidth: selectedId === shape.id ? 3 : 2,
      draggable: activeTool === "select",
      rotation: shape.rotation || 0,
      onClick: () => handleObjectClick(shape.id, "shape"),
      onDragEnd: (e: any) => {
        const newX = e.target.x()
        const newY = e.target.y()
        setShapes(shapes.map((s) => (s.id === shape.id ? { ...s, x: newX, y: newY } : s)))
        if (shape.saved) {
          updateObject(shape.id, { position: { x: newX, y: newY } })
        }
      },
    }

    switch (shape.type) {
      case "rectangle":
        return <Rect {...commonProps} width={shape.width} height={shape.height} />
      case "circle":
        return <Circle {...commonProps} radius={shape.width / 2} />
      case "triangle":
        return (
          <RegularPolygon
            {...commonProps}
            sides={3}
            radius={shape.width / 2}
          />
        )
      case "diamond":
        return (
          <RegularPolygon
            {...commonProps}
            sides={4}
            radius={shape.width / 2}
            rotation={45}
          />
        )
      case "arrow":
        return (
          <Arrow
            {...commonProps}
            points={[0, 0, shape.width, 0]}
            pointerLength={20}
            pointerWidth={20}
          />
        )
      default:
        return <Rect {...commonProps} width={shape.width} height={shape.height} />
    }
  }

  const renderMiniMap = () => {
    const miniMapWidth = 200
    const miniMapHeight = 150
    const scale = 0.05

    return (
      <div className="absolute bottom-4 right-4 z-50 bg-card border-2 border-border rounded-lg shadow-xl overflow-hidden">
        <div className="bg-muted px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold">Canvas Overview</p>
        </div>
        <div className="p-2 bg-background/95">
          <div
            className="relative bg-muted/50 rounded overflow-hidden"
            style={{ width: miniMapWidth, height: miniMapHeight }}
          >
            {/* Canvas representation */}
            <div
              className="absolute bg-primary/20 border-2 border-primary rounded"
              style={{
                left: (-stagePos.x * scale) + miniMapWidth / 2,
                top: (-stagePos.y * scale) + miniMapHeight / 2,
                width: width * scale / zoom,
                height: height * scale / zoom,
              }}
            />
            {/* Objects on mini-map */}
            {stickyNotes.map((note) => (
              <div
                key={note.id}
                className="absolute rounded"
                style={{
                  left: (note.x * scale) + (-stagePos.x * scale) + miniMapWidth / 2,
                  top: (note.y * scale) + (-stagePos.y * scale) + miniMapHeight / 2,
                  width: 150 * scale,
                  height: 150 * scale,
                  backgroundColor: note.color,
                  opacity: 0.7,
                }}
              />
            ))}
            {shapes.map((shape) => (
              <div
                key={shape.id}
                className="absolute rounded"
                style={{
                  left: (shape.x * scale) + (-stagePos.x * scale) + miniMapWidth / 2,
                  top: (shape.y * scale) + (-stagePos.y * scale) + miniMapHeight / 2,
                  width: shape.width * scale,
                  height: shape.height * scale,
                  backgroundColor: shape.fill,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>Objects: {stickyNotes.length + shapes.length + drawings.length + textBoxes.length}</p>
            <p>Zoom: {Math.round(zoom * 100)}%</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <div className="text-lg">Loading canvas...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-background">
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      {renderMiniMap()}

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: getCursor() }}
      >
        <Layer>
          {/* Infinite background */}
          <Rect x={-10000} y={-10000} width={20000} height={20000} fill="#ffffff" listening={false} />

          {/* Grid */}
          {showGrid && renderGrid()}

          {/* Canvas Links - Render behind everything */}
          {canvasLinks.map((link) => {
            const fromPos = getObjectPosition(link.fromId, link.fromType)
            const toPos = getObjectPosition(link.toId, link.toType)
            
            if (!fromPos || !toPos) return null
            
            return (
              <CanvasLinkComponent
                key={link.id}
                link={link}
                fromPos={fromPos}
                toPos={toPos}
                isHighlighted={highlightedLinkId === link.id}
                onClick={() => {
                  setHighlightedLinkId(highlightedLinkId === link.id ? null : link.id)
                }}
              />
            )
          })}

          {/* Sticky Notes */}
          {stickyNotes.map((sticky) => (
            <StickyNote
              key={sticky.id}
              id={sticky.id}
              x={sticky.x}
              y={sticky.y}
              text={sticky.text}
              color={sticky.color}
              isSelected={selectedId === sticky.id}
              isDraggable={activeTool === "select"}
              zoom={zoom}
              stagePos={stagePos}
              onSelect={() => handleObjectClick(sticky.id, "sticky")}
              onDragEnd={(x, y) => {
                setStickyNotes(stickyNotes.map((note) => (note.id === sticky.id ? { ...note, x, y } : note)))
                if (sticky.saved) {
                  updateObject(sticky.id, { position: { x, y } })
                }
              }}
              onTextChange={(text) => {
                setStickyNotes(stickyNotes.map((note) => (note.id === sticky.id ? { ...note, text } : note)))
                if (sticky.saved) {
                  updateObject(sticky.id, { content: { text, color: sticky.color } })
                }
              }}
              onColorChange={(color) => {
                setStickyNotes(stickyNotes.map((note) => (note.id === sticky.id ? { ...note, color } : note)))
                if (sticky.saved) {
                  updateObject(sticky.id, { content: { text: sticky.text, color } })
                }
              }}
            />
          ))}

          {/* Shapes */}
          {shapes.map((shape) => renderShape(shape))}

          {/* Drawings */}
          {drawings.map((drawing) => (
            <Line
              key={drawing.id}
              points={drawing.points}
              stroke={drawing.stroke}
              strokeWidth={drawing.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}

          {/* Current drawing in progress */}
          {isDrawing && currentDrawing.length > 0 && (
            <Line
              points={currentDrawing}
              stroke={currentColor}
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Text Boxes */}
          {textBoxes.map((textBox) => (
            <TextBox
              key={textBox.id}
              id={textBox.id}
              x={textBox.x}
              y={textBox.y}
              text={textBox.text}
              fontSize={textBox.fontSize}
              fill={textBox.fill}
              isSelected={selectedId === textBox.id}
              isDraggable={activeTool === "select"}
              onSelect={() => handleObjectClick(textBox.id, "text")}
              onDragEnd={(x, y) => {
                setTextBoxes(textBoxes.map((tb) => (tb.id === textBox.id ? { ...tb, x, y } : tb)))
                if (textBox.saved) {
                  updateObject(textBox.id, { position: { x, y } })
                }
              }}
              onTextChange={(text) => {
                setTextBoxes(textBoxes.map((tb) => (tb.id === textBox.id ? { ...tb, text } : tb)))
                if (textBox.saved) {
                  updateObject(textBox.id, { content: { text } })
                }
              }}
            />
          ))}

          {/* Hybrid Kanban Boards */}
          {hybridBoards.map((board) => (
            <HybridKanbanBoard
              key={board.id}
              board={board}
              tasks={boardTasks}
              isSelected={selectedId === board.id}
              isDraggable={activeTool === "select"}
              onSelect={() => handleObjectClick(board.id, "board")}
              onDragEnd={(x, y) => {
                setHybridBoards(hybridBoards.map((b) => (b.id === board.id ? { ...b, x, y } : b)))
                if (board.saved) {
                  updateHybridBoard({ ...board, x, y })
                }
              }}
              onTaskMove={(taskId, fromColumn, toColumn) => {
                const updatedBoard = { ...board }
                const fromCol = updatedBoard.columns.find(c => c.id === fromColumn)
                const toCol = updatedBoard.columns.find(c => c.id === toColumn)
                
                if (fromCol && toCol) {
                  fromCol.taskIds = fromCol.taskIds.filter(id => id !== taskId)
                  if (!toCol.taskIds.includes(taskId)) {
                    toCol.taskIds.push(taskId)
                  }
                  setHybridBoards(hybridBoards.map((b) => (b.id === board.id ? updatedBoard : b)))
                  if (board.saved) {
                    updateHybridBoard(updatedBoard)
                  }
                }
              }}
              onTitleChange={(title) => {
                setHybridBoards(hybridBoards.map((b) => (b.id === board.id ? { ...b, title } : b)))
                if (board.saved) {
                  updateHybridBoard({ ...board, title })
                }
              }}
              onToggleCollapse={() => {
                const updatedBoard = { ...board, collapsed: !board.collapsed }
                setHybridBoards(hybridBoards.map((b) => (b.id === board.id ? updatedBoard : b)))
                if (board.saved) {
                  updateHybridBoard(updatedBoard)
                }
              }}
              onAddColumn={() => {
                const newColumn: HybridColumn = {
                  id: `col-${Date.now()}`,
                  title: "New Column",
                  color: "#f3f4f6",
                  taskIds: [],
                }
                const updatedBoard = {
                  ...board,
                  columns: [...board.columns, newColumn],
                }
                setHybridBoards(hybridBoards.map((b) => (b.id === board.id ? updatedBoard : b)))
                if (board.saved) {
                  updateHybridBoard(updatedBoard)
                }
              }}
              onRemoveColumn={(columnId) => {
                if (board.columns.length <= 1) return
                const updatedBoard = {
                  ...board,
                  columns: board.columns.filter((col) => col.id !== columnId),
                }
                setHybridBoards(hybridBoards.map((b) => (b.id === board.id ? updatedBoard : b)))
                if (board.saved) {
                  updateHybridBoard(updatedBoard)
                }
              }}
              onAddTask={(columnId) => {
                // Open the CreateTaskDialog instead of using prompts
                setActiveColumnForNewTask({ boardId: board.id, columnId })
                setCreateTaskDialogOpen(true)
              }}
              onTaskClick={(task) => {
                // Open TaskDetailsDialog when a task card is clicked
                setSelectedTaskForDialog(task)
                setTaskDialogOpen(true)
              }}
              zoom={zoom}
            />
          ))}

          {/* Spatial Comments */}
          {spatialComments.map((comment) => (
            <SpatialCommentComponent
              key={comment.id}
              comment={comment}
              isSelected={selectedId === comment.id}
              onSelect={() => setSelectedId(comment.id)}
              onDragEnd={(x, y) => {
                const updatedComment = { ...comment, x, y }
                setSpatialComments(spatialComments.map((c) => (c.id === comment.id ? updatedComment : c)))
                if (comment.saved) {
                  updateComment(updatedComment)
                  broadcastCommentUpdate(updatedComment)
                }
              }}
              onResolve={() => {
                const updatedComment = { ...comment, resolved: true }
                setSpatialComments(spatialComments.map((c) => (c.id === comment.id ? updatedComment : c)))
                if (comment.saved) {
                  updateComment(updatedComment)
                  broadcastCommentUpdate(updatedComment)
                }
              }}
              onTextChange={(text) => {
                const updatedComment = { ...comment, text, updatedAt: new Date() }
                setSpatialComments(spatialComments.map((c) => (c.id === comment.id ? updatedComment : c)))
                if (comment.saved) {
                  updateComment(updatedComment)
                  broadcastCommentUpdate(updatedComment)
                }
              }}
            />
          ))}

          {/* User Cursors */}
          {userPresences.map((presence) => (
            <UserCursor key={presence.userId} presence={presence} />
          ))}
        </Layer>
      </Stage>

      {/* Presence Panel */}
      {/* Connection Status Indicator */}
      {projectId && (
        <div className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-3 py-2 text-xs flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      )}

      <PresencePanel
        presences={userPresences}
        currentUserId={currentUser.id}
        followingUserId={followingUserId}
        onFollowUser={(userId) => {
          if (followingUserId === userId) {
            setFollowingUserId(null)
          } else {
            setFollowingUserId(userId)
            const targetPresence = userPresences.find(p => p.userId === userId)
            if (targetPresence) {
              setStagePos({
                x: -targetPresence.viewport.x,
                y: -targetPresence.viewport.y,
              })
              setZoom(targetPresence.viewport.zoom)
            }
          }
        }}
      />

      {/* Task Creation Dialog */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        onTaskCreated={async () => {
          // Refresh ONLY hybrid board tasks
          if (activeColumnForNewTask && projectId) {
            try {
              const response = await fetch(`/api/tasks?projectId=${projectId}`)
              if (response.ok) {
                const data = await response.json()
                // Filter to only hybrid board tasks (those with boardId)
                const hybridTasks = (data.tasks || []).filter((t: Task) => t.boardId)
                console.log("[Canvas] ✅ Task created! Refreshed", hybridTasks.length, "hybrid board tasks")
                setBoardTasks(hybridTasks)
                
                // Update the hybrid board's column with the new task
                const board = hybridBoards.find(b => b.id === activeColumnForNewTask.boardId)
                if (board) {
                  const updatedBoard = { ...board }
                  const column = updatedBoard.columns.find(c => c.id === activeColumnForNewTask.columnId)
                  
                  // Find tasks that belong to this column
                  const columnTasks = hybridTasks.filter((t: Task) => 
                    t.boardId === board.id && t.columnId === activeColumnForNewTask.columnId
                  )
                  
                  if (column) {
                    column.taskIds = columnTasks.map((t: Task) => t.id)
                    setHybridBoards(hybridBoards.map(b => b.id === board.id ? updatedBoard : b))
                    if (board.saved) {
                      updateHybridBoard(updatedBoard)
                    }
                  }
                }
              }
            } catch (error) {
              console.error("[Canvas] Failed to refresh tasks:", error)
            }
          }
          setActiveColumnForNewTask(null)
          setCreateTaskDialogOpen(false)
        }}
        projectId={projectId}
        initialStatus={
          activeColumnForNewTask 
            ? hybridBoards.find(b => b.id === activeColumnForNewTask.boardId)
                ?.columns.find(c => c.id === activeColumnForNewTask.columnId)?.title || "todo"
            : "todo"
        }
        initialBoardId={activeColumnForNewTask?.boardId}
        initialColumnId={activeColumnForNewTask?.columnId}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTaskForDialog}
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onTaskUpdated={async () => {
          // Refresh ONLY hybrid board tasks
          if (projectId) {
            try {
              const response = await fetch(`/api/tasks?projectId=${projectId}`)
              if (response.ok) {
                const data = await response.json()
                // Filter to only hybrid board tasks
                const hybridTasks = (data.tasks || []).filter((t: Task) => t.boardId)
                console.log("[Canvas] ✅ Task updated! Refreshed", hybridTasks.length, "hybrid board tasks")
                setBoardTasks(hybridTasks)
              }
            } catch (error) {
              console.error("[Canvas] Failed to refresh tasks:", error)
            }
          }
        }}
      />

    </div>
  )
}
