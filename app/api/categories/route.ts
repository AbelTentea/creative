import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const categories = await db.query("SELECT * FROM categories")

    return NextResponse.json(
      categories.map((category: any) => ({
        id: category.id,
        name: category.name,
      })),
    )
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    const result = await db.query("INSERT INTO categories (name) VALUES (?)", [name])

    return NextResponse.json({
      id: result.insertId,
      name,
    })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

