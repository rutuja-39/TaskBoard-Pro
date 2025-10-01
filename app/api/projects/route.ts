import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const projects = await db
      .collection("projects")
      .find({
        $or: [{ ownerId: user.userId }, { "members.userId": user.userId }],
      })
      .toArray()

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("[v0] Failed to fetch projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const db = await getDb()
    const project = {
      name: name.trim(),
      description: description?.trim() || "",
      ownerId: user.userId,
      members: [
        {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: "owner",
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("projects").insertOne(project)

    return NextResponse.json({
      project: { ...project, id: result.insertedId.toString() },
    })
  } catch (error) {
    console.error("[v0] Failed to create project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
