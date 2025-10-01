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
    const canvasObjects = db.collection("canvas_objects")

    let query: any = {}

    if (projectId) {
      // If projectId is provided, verify user is a member and show ALL project objects
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

      // Show all objects in this project
      query.projectId = projectId
    } else {
      // No projectId: show only user's own objects
      query.userId = session.userId
    }

    const objects = await canvasObjects.find(query).sort({ createdAt: -1 }).toArray()

    const formattedObjects = objects.map((obj) => ({
      id: obj._id.toString(),
      type: obj.type,
      position: obj.position,
      size: obj.size,
      rotation: obj.rotation,
      style: obj.style,
      content: obj.content,
      projectId: obj.projectId,
      userId: obj.userId,
      createdAt: obj.createdAt.toISOString(),
    }))

    return NextResponse.json({ objects: formattedObjects })
  } catch (error) {
    console.error("[v0] Get canvas objects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, position, size, rotation, style, content, projectId } = await request.json()

    if (!type || !position) {
      return NextResponse.json({ error: "Type and position are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("taskboard")
    const canvasObjects = db.collection("canvas_objects")

    const result = await canvasObjects.insertOne({
      userId: session.userId,
      projectId: projectId || null,
      type,
      position,
      size: size || null,
      rotation: rotation || 0,
      style: style || {},
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const newObject = await canvasObjects.findOne({ _id: result.insertedId })

    return NextResponse.json({
      object: {
        id: newObject?._id.toString(),
        type: newObject?.type,
        position: newObject?.position,
        size: newObject?.size,
        rotation: newObject?.rotation,
        style: newObject?.style,
        content: newObject?.content,
        createdAt: newObject?.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Create canvas object error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
