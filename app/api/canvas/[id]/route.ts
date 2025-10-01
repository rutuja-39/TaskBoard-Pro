import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { position, size, rotation, style, content } = await request.json()

    const client = await clientPromise
    const db = client.db("taskboard")
    const canvasObjects = db.collection("canvas_objects")

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (position) updateData.position = position
    if (size) updateData.size = size
    if (rotation !== undefined) updateData.rotation = rotation
    if (style) updateData.style = style
    if (content) updateData.content = content

    const result = await canvasObjects.updateOne(
      { _id: new ObjectId(id), userId: session.userId },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update canvas object error:", error)
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
    const canvasObjects = db.collection("canvas_objects")

    const result = await canvasObjects.deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete canvas object error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
