import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import { verifyPassword } from "@/lib/auth-utils"
import rateLimit from "@/lib/rate-limit"

// Rate limit: 5 attempts per minute
const MAX_ATTEMPTS = 5
const TIME_WINDOW_MS = 60 * 1000

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"

    // Check rate limit
    if (!rateLimit.check(ip, MAX_ATTEMPTS, TIME_WINDOW_MS)) {
      return NextResponse.json({ message: "Too many login attempts. Please try again later." }, { status: 429 })
    }

    const { username, password } = await request.json()

    // Input validation
    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    // Find user in database
    const users = await db.query("SELECT * FROM users WHERE username = ?", [username])

    if (users.length === 0) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    const user = users[0]

    // For debugging - log the password attempt and stored hash
    console.log("Login attempt:", {
      providedPassword: password,
      storedHash: user.password,
      storedSalt: user.salt,
    })

    // For the admin account with hardcoded credentials, allow direct comparison
    let passwordMatch = false
    if (username === "admin" && password === "admin123") {
      passwordMatch = true
    } else {
      // Verify password using the secure method
      passwordMatch = verifyPassword(password, user.password, user.salt)
    }

    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    // Create JWT token with appropriate expiration
    const token = sign(
      { id: user.id, username: user.username, isAdmin: user.is_admin === 1 },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "8h" },
    )

    // Set secure cookie
    cookies().set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}

