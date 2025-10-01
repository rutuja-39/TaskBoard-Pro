// Task types
export type TaskStatus = "todo" | "inprogress" | "done"
export type TaskPriority = "low" | "medium" | "high"

export type Task = {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: string
  dueDate?: string
  createdAt: string
  // Canvas mode properties
  position?: { x: number; y: number }
  // Hybrid Kanban mode properties
  boardId?: string
  columnId?: string
}

// Canvas object types
export type CanvasObjectType = "sticky" | "shape" | "drawing" | "text" | "connector"
export type ShapeType = "rectangle" | "circle" | "triangle" | "arrow" | "line"

export type CanvasObject = {
  id: string
  projectId: string
  type: CanvasObjectType
  position: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  style: {
    fill?: string
    stroke?: string
    strokeWidth?: number
    fontSize?: number
    fontFamily?: string
  }
  content: any // varies by type
  createdBy: string
  createdAt: string
}

export type StickyNote = CanvasObject & {
  type: "sticky"
  content: {
    text: string
    color: string
  }
}

export type Shape = CanvasObject & {
  type: "shape"
  content: {
    shapeType: ShapeType
  }
}

export type DrawingPath = CanvasObject & {
  type: "drawing"
  content: {
    points: { x: number; y: number }[]
  }
}

export type TextBox = CanvasObject & {
  type: "text"
  content: {
    text: string
  }
}

// Project and team collaboration types
export type UserRole = "owner" | "admin" | "member" | "viewer"

export type Project = {
  id: string
  name: string
  description?: string
  ownerId: string
  members: ProjectMember[]
  createdAt: string
  updatedAt: string
}

export type ProjectMember = {
  userId: string
  email: string
  name: string
  role: UserRole
  joinedAt: string
}

export type Invitation = {
  id: string
  projectId: string
  email: string
  role: UserRole
  invitedBy: string
  createdAt: string
  status: "pending" | "accepted" | "declined"
}

// View mode
export type ViewMode = "kanban" | "canvas" | "hybrid"

// Canvas tool
export type CanvasTool = "select" | "sticky" | "pen" | "shape" | "text" | "pan" | "board" | "link" | "comment"

// Hybrid Kanban Board Types
export type HybridBoard = {
  id: string
  projectId: string
  x: number
  y: number
  width: number
  height: number
  title: string
  columns: HybridColumn[]
  collapsed: boolean
  style: {
    backgroundColor: string
    borderColor: string
    headerColor: string
  }
  saved?: boolean
}

export type HybridColumn = {
  id: string
  title: string
  color: string
  taskIds: string[]
}

export type HybridTask = Task & {
  boardId?: string
  columnId?: string
}

// Canvas Linking
export type CanvasLink = {
  id: string
  fromType: "task" | "sticky" | "shape" | "text" | "board"
  fromId: string
  toType: "task" | "sticky" | "shape" | "text" | "board"
  toId: string
  linkType: "reference" | "dependency" | "attachment"
  style: {
    color: string
    lineType: "solid" | "dashed" | "dotted"
    arrow: boolean
  }
  saved?: boolean
}

// Collaboration Features
export type UserPresence = {
  userId: string
  userName: string
  userColor: string
  cursor: { x: number; y: number }
  viewport: {
    x: number
    y: number
    zoom: number
  }
  selectedObject?: string
  lastActive: Date
}

export type SpatialComment = {
  id: string
  userId: string
  userName: string
  userColor: string
  text: string
  x: number
  y: number
  resolved: boolean
  replies: SpatialCommentReply[]
  createdAt: Date
  updatedAt: Date
  saved?: boolean
}

export type SpatialCommentReply = {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: Date
}
