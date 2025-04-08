import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name } = await request.json()

    await db.query("UPDATE categories SET name = ? WHERE id = ?", [name, id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if category has products
    const products = await db.query("SELECT COUNT(*) as count FROM products WHERE category_id = ?", [id])

    if (products[0].count > 0) {
      return NextResponse.json({ error: "Cannot delete category with associated products" }, { status: 400 })
    }

    await db.query("DELETE FROM categories WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}

