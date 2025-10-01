import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const client = await clientPromise
    const db = client.db("taskboard")
    const tasks = db.collection("tasks")

    const task = await tasks.findOne({
      _id: new ObjectId(id),
      userId: session.userId,
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({
      task: {
        id: task._id.toString(),
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority || "medium",
        assignee: task.assignee,
        dueDate: task.dueDate,
        createdAt: task.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Get task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    const client = await clientPromise
    const db = client.db("taskboard")
    const tasks = db.collection("tasks")

    const result = await tasks.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: session.userId,
      },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({
      task: {
        id: result._id.toString(),
        title: result.title,
        description: result.description || "",
        status: result.status,
        priority: result.priority || "medium",
        assignee: result.assignee,
        dueDate: result.dueDate,
        createdAt: result.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Update task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const client = await clientPromise
    const db = client.db("taskboard")
    const tasks = db.collection("tasks")

    const result = await tasks.deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
