import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get all products with their extras
    const products = await db.query(`
      SELECT p.*, c.name as categoryName
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `)

    // For each product, get its extras and images
    const productsWithExtrasAndImages = await Promise.all(
      products.map(async (product: any) => {
        const extras = await db.query(
          `
          SELECT * FROM extra_options
          WHERE product_id = ?
        `,
          [product.id],
        )

        const images = await db.query(
          `
          SELECT * FROM product_images
          WHERE product_id = ?
          ORDER BY display_order ASC
        `,
          [product.id],
        )

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          pros: product.pros,
          cons: product.cons,
          categoryId: product.category_id,
          categoryName: product.categoryName,
          basePrice: product.base_price,
          pricePerSquareMeter: product.price_per_square_meter === 1,
          canExport: product.can_export === 1,
          extras: extras.map((extra: any) => ({
            id: extra.id,
            name: extra.name,
            price: extra.price,
            pricePerSquareMeter: extra.price_per_square_meter === 1,
            useProductDimensions: extra.use_product_dimensions === 1,
          })),
          images: images.map((image: any) => ({
            id: image.id,
            productId: image.product_id,
            imageUrl: image.image_url,
            displayOrder: image.display_order,
          })),
        }
      }),
    )

    return NextResponse.json(productsWithExtrasAndImages)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, pros, cons, categoryId, basePrice, pricePerSquareMeter, canExport, extras, images } =
      await request.json()

    // Insert product
    const result = await db.query(
      `INSERT INTO products (name, description, pros, cons, category_id, base_price, price_per_square_meter, can_export)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, pros, cons, categoryId, basePrice, pricePerSquareMeter ? 1 : 0, canExport ? 1 : 0],
    )

    const productId = result.insertId

    // Insert extras
    if (extras && extras.length > 0) {
      for (const extra of extras) {
        await db.query(
          `INSERT INTO extra_options (product_id, name, price, price_per_square_meter, use_product_dimensions)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, extra.name, extra.price, extra.pricePerSquareMeter ? 1 : 0, extra.useProductDimensions ? 1 : 0],
        )
      }
    }

    // Insert images
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        await db.query(
          `INSERT INTO product_images (product_id, image_url, display_order)
           VALUES (?, ?, ?)`,
          [productId, image.imageUrl, i],
        )
      }
    }

    return NextResponse.json({
      id: productId,
      name,
      description,
      pros,
      cons,
      categoryId,
      basePrice,
      pricePerSquareMeter,
      canExport,
      extras,
      images,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

