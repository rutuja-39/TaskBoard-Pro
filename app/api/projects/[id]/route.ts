import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const db = await getDb()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      $or: [{ ownerId: user.userId }, { "members.userId": user.userId }],
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      project: { ...project, id: project._id.toString() },
    })
  } catch (error) {
    console.error("[v0] Failed to fetch project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { name, description } = await request.json()

    const db = await getDb()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      $or: [{ ownerId: user.userId }, { "members.role": { $in: ["owner", "admin"] } }],
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or insufficient permissions" }, { status: 404 })
    }

    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name?.trim() || project.name,
          description: description?.trim() || project.description,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const db = await getDb()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      ownerId: user.userId,
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or insufficient permissions" }, { status: 404 })
    }

    // Delete project and all associated data
    await db.collection("projects").deleteOne({ _id: new ObjectId(id) })
    await db.collection("tasks").deleteMany({ projectId: id })
    await db.collection("canvas_objects").deleteMany({ projectId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
