import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { mkdir } from "fs/promises"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename with sanitized original name
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase()
    const filename = `${uuidv4()}-${originalName}`

    // Ensure the uploads directory exists
    const uploadsDir = join(process.cwd(), "public/uploads")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      console.error("Error creating uploads directory:", error)
    }

    const path = join(uploadsDir, filename)

    // Save file to public/uploads directory
    try {
      await writeFile(path, buffer)
    } catch (error) {
      console.error("Error writing file:", error)
      return NextResponse.json({ error: "Failed to save file to server" }, { status: 500 })
    }

    // Return the URL to the uploaded file
    return NextResponse.json({
      url: `/uploads/${filename}`,
      success: true,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

