import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    const db = await getDb()

    // Check if user has permission to invite
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      members: {
        $elemMatch: {
          userId: user.userId,
          role: { $in: ["owner", "admin"] },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or insufficient permissions" }, { status: 404 })
    }

    // Check if user already exists
    const invitedUser = await db.collection("users").findOne({ email })

    if (invitedUser) {
      // Add directly to project if user exists
      const alreadyMember = project.members.some((m: any) => m.userId === invitedUser._id.toString())

      if (alreadyMember) {
        return NextResponse.json({ error: "User is already a member" }, { status: 400 })
      }

      await db.collection("projects").updateOne(
        { _id: new ObjectId(id) },
        {
          $push: {
            members: {
              userId: invitedUser._id.toString(),
              email: invitedUser.email,
              name: invitedUser.name,
              role,
              joinedAt: new Date().toISOString(),
            },
          } as any,
        },
      )

      return NextResponse.json({ success: true, message: "Member added successfully" })
    } else {
      // Create invitation for non-existing user
      const invitation = {
        projectId: id,
        email,
        role,
        invitedBy: user.userId,
        createdAt: new Date().toISOString(),
        status: "pending",
      }

      await db.collection("invitations").insertOne(invitation)

      return NextResponse.json({ success: true, message: "Invitation sent" })
    }
  } catch (error) {
    console.error("[v0] Failed to invite member:", error)
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const memberUserId = searchParams.get("userId")

    if (!memberUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const db = await getDb()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      members: {
        $elemMatch: {
          userId: user.userId,
          role: { $in: ["owner", "admin"] },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or insufficient permissions" }, { status: 404 })
    }

    // Prevent removing the owner
    const memberToRemove = project.members.find((m: any) => m.userId === memberUserId)
    if (memberToRemove?.role === "owner") {
      return NextResponse.json({ error: "Cannot remove project owner" }, { status: 400 })
    }

    await db
      .collection("projects")
      .updateOne({ _id: new ObjectId(id) }, { $pull: { members: { userId: memberUserId } } } as any)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to remove member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
