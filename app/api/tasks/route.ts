import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const client = await clientPromise
    const db = client.db("taskboard")
    const tasks = db.collection("tasks")

    let query: any = {}

    if (projectId) {
      // If projectId is provided, verify user is a member and show ALL project tasks
      const projects = db.collection("projects")
      const { ObjectId } = await import("mongodb")
      
      const project = await projects.findOne({
        _id: new ObjectId(projectId),
        $or: [
          { ownerId: session.userId },
          { "members.userId": session.userId }
        ]
      })

      if (!project) {
        return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 })
      }

      // Show all tasks in this project
      query.projectId = projectId
    } else {
      // No projectId: show only user's own tasks
      query.userId = session.userId
    }

    const taskList = await tasks.find(query).sort({ createdAt: -1 }).toArray()

    const formattedTasks = taskList.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority || "medium",
      assignee: task.assignee,
      dueDate: task.dueDate,
      createdAt: task.createdAt.toISOString(),
    }))

    return NextResponse.json({ tasks: formattedTasks })
  } catch (error) {
    console.error("[v0] Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, status, priority, assignee, dueDate, projectId } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("taskboard")
    const tasks = db.collection("tasks")

    const result = await tasks.insertOne({
      userId: session.userId,
      projectId: projectId || null,
      title,
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      assignee: assignee || null,
      dueDate: dueDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const newTask = await tasks.findOne({ _id: result.insertedId })

    return NextResponse.json({
      task: {
        id: newTask?._id.toString(),
        title: newTask?.title,
        description: newTask?.description || "",
        status: newTask?.status,
        priority: newTask?.priority || "medium",
        assignee: newTask?.assignee,
        dueDate: newTask?.dueDate,
        createdAt: newTask?.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Create task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
