import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, hashPassword } from "@/lib/auth-utils"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const id = params.id
    const { username, password, isAdmin } = await request.json()

    // Input validation
    if (!username) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 })
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ message: "Username must be between 3 and 50 characters" }, { status: 400 })
    }

    if (password && password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Check if username already exists (for another user)
    const existingUsers = await db.query("SELECT * FROM users WHERE username = ? AND id != ?", [username, id])
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    // Update user
    if (password) {
      // If password is provided, update it too
      const { hash, salt } = hashPassword(password)
      await db.query("UPDATE users SET username = ?, password = ?, salt = ?, is_admin = ? WHERE id = ?", [
        username,
        hash,
        salt,
        isAdmin ? 1 : 0,
        id,
      ])
    } else {
      // Otherwise just update username and admin status
      await db.query("UPDATE users SET username = ?, is_admin = ? WHERE id = ?", [username, isAdmin ? 1 : 0, id])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const id = params.id

    // Don't allow deleting yourself
    if (authUser.id.toString() === id) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 })
    }

    await db.query("DELETE FROM users WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

