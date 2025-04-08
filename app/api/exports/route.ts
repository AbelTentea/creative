import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // If admin, get all exports, otherwise get only user's exports
    let exports
    if (authUser.isAdmin) {
      exports = await db.query(`
        SELECT e.*, u.username 
        FROM export_history e
        JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
      `)
    } else {
      exports = await db.query(
        `
        SELECT e.*, u.username 
        FROM export_history e
        JOIN users u ON e.user_id = u.id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC
      `,
        [authUser.id],
      )
    }

    return NextResponse.json(
      exports.map((exp: any) => ({
        id: exp.id,
        userId: exp.user_id,
        username: exp.username,
        exportData: JSON.parse(exp.export_data),
        createdAt: exp.created_at,
      })),
    )
  } catch (error) {
    console.error("Error fetching exports:", error)
    return NextResponse.json({ error: "Failed to fetch exports" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const exportData = await request.json()

    // Save export to database
    const result = await db.query("INSERT INTO export_history (user_id, export_data) VALUES (?, ?)", [
      authUser.id,
      JSON.stringify(exportData),
    ])

    return NextResponse.json({
      id: result.insertId,
      userId: authUser.id,
      exportData,
    })
  } catch (error) {
    console.error("Error saving export:", error)
    return NextResponse.json({ error: "Failed to save export" }, { status: 500 })
  }
}

