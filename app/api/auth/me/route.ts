import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

export async function GET() {
  try {
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as {
      id: number
      username: string
      isAdmin: boolean
    }

    return NextResponse.json({
      id: decoded.id,
      username: decoded.username,
      isAdmin: decoded.isAdmin,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ message: "Invalid token" }, { status: 401 })
  }
}

