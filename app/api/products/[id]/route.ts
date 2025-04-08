import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, description, pros, cons, categoryId, basePrice, pricePerSquareMeter, extras, images } =
      await request.json()

    // Update product
    await db.query(
      `UPDATE products 
       SET name = ?, description = ?, pros = ?, cons = ?, category_id = ?, base_price = ?, price_per_square_meter = ?
       WHERE id = ?`,
      [name, description, pros, cons, categoryId, basePrice, pricePerSquareMeter ? 1 : 0, id],
    )

    // Delete existing extras
    await db.query("DELETE FROM extra_options WHERE product_id = ?", [id])

    // Add new extras
    if (extras && extras.length > 0) {
      for (const extra of extras) {
        await db.query(
          `INSERT INTO extra_options (product_id, name, price, price_per_square_meter)
           VALUES (?, ?, ?, ?)`,
          [id, extra.name, extra.price, extra.pricePerSquareMeter ? 1 : 0],
        )
      }
    }

    // Handle images
    if (images) {
      // Delete existing images
      await db.query("DELETE FROM product_images WHERE product_id = ?", [id])

      // Add new images
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        await db.query(
          `INSERT INTO product_images (product_id, image_url, display_order)
           VALUES (?, ?, ?)`,
          [id, image.imageUrl, i],
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Delete images first
    await db.query("DELETE FROM product_images WHERE product_id = ?", [id])

    // Delete extras (foreign key constraint)
    await db.query("DELETE FROM extra_options WHERE product_id = ?", [id])

    // Delete product
    await db.query("DELETE FROM products WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}

