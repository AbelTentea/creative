import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
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

    // If there's an origin header, check if it matches our host
    if (origin && host && !origin.includes(host)) {
      return new NextResponse(null, { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: [
    // Apply to all routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

