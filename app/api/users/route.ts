import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, hashPassword } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Check if user is admin
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const users = await db.query("SELECT id, username, is_admin as isAdmin, created_at as createdAt FROM users")

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { username, password, isAdmin } = await request.json()

    // Input validation
    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ message: "Username must be between 3 and 50 characters" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Check if username already exists
    const existingUsers = await db.query("SELECT * FROM users WHERE username = ?", [username])
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    // Hash password with salt
    const { hash, salt } = hashPassword(password)

    // Insert user
    const result = await db.query("INSERT INTO users (username, password, salt, is_admin) VALUES (?, ?, ?, ?)", [
      username,
      hash,
      salt,
      isAdmin ? 1 : 0,
    ])

    return NextResponse.json({
      id: result.insertId,
      username,
      isAdmin,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

