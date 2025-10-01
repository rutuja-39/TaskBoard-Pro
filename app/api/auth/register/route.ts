import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { hashPassword, createToken, setSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("taskboard")
    const users = db.collection("users")

    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const result = await users.insertOne({
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
    })

    const token = await createToken({
      userId: result.insertedId.toString(),
      email,
    })

    await setSession(token)

    return NextResponse.json({
      user: {
        id: result.insertedId.toString(),
        email,
        name,
      },
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
