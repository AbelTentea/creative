import { verify } from "jsonwebtoken"
import { createHash, randomBytes } from "crypto"
import type { UserType } from "./types"

// More secure password hashing with salt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || randomBytes(16).toString("hex")
  const hash = createHash("sha256")
    .update(password + useSalt)
    .digest("hex")
  return { hash, salt: useSalt }
}

// Verify password
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt)
  return hash === storedHash
}

export async function getAuthUser(request: Request): Promise<UserType | null> {
  try {
    // For API routes, we need to get the cookie from the request headers
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) return null

    // Parse the cookie header to get the auth_token
    const cookies = parseCookies(cookieHeader)
    const token = cookies["auth_token"]

    if (!token) return null

    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as {
      id: number
      username: string
      isAdmin: boolean
    }

    return {
      id: decoded.id,
      username: decoded.username,
      isAdmin: decoded.isAdmin,
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return null
  }
}

// Helper function to parse cookies from header
function parseCookies(cookieHeader: string) {
  const cookies: Record<string, string> = {}
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=")
    cookies[name] = decodeURIComponent(value)
  })
  return cookies
}

