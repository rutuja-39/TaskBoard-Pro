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
    const comments = db.collection("comments")

    const taskComments = await comments.find({ taskId: id }).sort({ createdAt: -1 }).toArray()

    const formattedComments = taskComments.map((comment) => ({
      id: comment._id.toString(),
      taskId: comment.taskId,
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    }))

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error("[v0] Get comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("taskboard")

    // Get user name
    const users = db.collection("users")
    const user = await users.findOne({ _id: new ObjectId(session.userId) })

    const comments = db.collection("comments")

    const result = await comments.insertOne({
      taskId: id,
      userId: session.userId,
      userName: user?.name || "Unknown User",
      text,
      createdAt: new Date(),
    })

    const newComment = await comments.findOne({ _id: result.insertedId })

    return NextResponse.json({
      comment: {
        id: newComment?._id.toString(),
        taskId: newComment?.taskId,
        userId: newComment?.userId,
        userName: newComment?.userName,
        text: newComment?.text,
        createdAt: newComment?.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
