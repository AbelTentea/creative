import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Log the incoming request for debugging
  console.log("Incoming request:", request.url)

  // Start with a default response
  const response = NextResponse.next()

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Only allow API requests from our own domain (CSRF protection)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")

    console.log("API Request detected:", { origin, host })

    // If there's an origin header, check if it matches our host
    if (origin && host && !origin.includes(host)) {
      console.error("CSRF check failed:", { origin, host })
      return new NextResponse("Forbidden", { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: [
    // Apply to all routes except for static files and favicon.ico
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
