const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Store user presences per project
const projectPresences = new Map()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("[Socket.io] Client connected:", socket.id)

    // Join project room
    socket.on("join-project", ({ projectId, userId, userName, userColor }) => {
      console.log(`[Socket.io] User ${userName} joined project ${projectId}`)
      
      socket.join(projectId)
      socket.data = { projectId, userId, userName, userColor }

      // Initialize project presences if not exists
      if (!projectPresences.has(projectId)) {
        projectPresences.set(projectId, new Map())
      }

      const presences = projectPresences.get(projectId)
      presences.set(userId, {
        userId,
        userName,
        userColor,
        cursor: { x: 0, y: 0 },
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedObject: null,
        lastActive: new Date(),
      })

      // Broadcast updated presences to all users in project
      io.to(projectId).emit("presence-update", Array.from(presences.values()))
    })

    // Handle cursor movement
    socket.on("cursor-move", ({ projectId, userId, cursor }) => {
      const presences = projectPresences.get(projectId)
      if (presences && presences.has(userId)) {
        const presence = presences.get(userId)
        presence.cursor = cursor
        presence.lastActive = new Date()
        
        // Broadcast to others in the room (exclude sender)
        socket.to(projectId).emit("presence-update", Array.from(presences.values()))
      }
    })

    // Handle viewport changes
    socket.on("viewport-change", ({ projectId, userId, viewport }) => {
      const presences = projectPresences.get(projectId)
      if (presences && presences.has(userId)) {
        const presence = presences.get(userId)
        presence.viewport = viewport
        presence.lastActive = new Date()
        
        socket.to(projectId).emit("presence-update", Array.from(presences.values()))
      }
    })

    // Handle object selection
    socket.on("object-select", ({ projectId, userId, selectedObject }) => {
      const presences = projectPresences.get(projectId)
      if (presences && presences.has(userId)) {
        const presence = presences.get(userId)
        presence.selectedObject = selectedObject
        presence.lastActive = new Date()
        
        socket.to(projectId).emit("presence-update", Array.from(presences.values()))
      }
    })

    // Handle comment creation
    socket.on("create-comment", ({ projectId, comment }) => {
      // Broadcast new comment to all users in project
      io.to(projectId).emit("comment-created", comment)
    })

    // Handle comment updates
    socket.on("update-comment", ({ projectId, comment }) => {
      // Broadcast comment update to all users in project
      io.to(projectId).emit("comment-updated", comment)
    })

    // Handle leave project
    socket.on("leave-project", ({ projectId, userId }) => {
      console.log(`[Socket.io] User ${userId} left project ${projectId}`)
      
      const presences = projectPresences.get(projectId)
      if (presences) {
        presences.delete(userId)
        io.to(projectId).emit("presence-update", Array.from(presences.values()))
      }
      
      socket.leave(projectId)
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("[Socket.io] Client disconnected:", socket.id)
      
      const { projectId, userId } = socket.data || {}
      if (projectId && userId) {
        const presences = projectPresences.get(projectId)
        if (presences) {
          presences.delete(userId)
          io.to(projectId).emit("presence-update", Array.from(presences.values()))
        }
      }
    })
  })

  httpServer
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server ready`)
    })
})

