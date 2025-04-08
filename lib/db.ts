import mysql from "mysql2/promise"

// Create a connection pool with improved security settings
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "product_calculator",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined,
  connectTimeout: 10000, // 10 seconds
  timezone: "+00:00", // UTC
})

export const db = {
  query: async (sql: string, params?: any[]) => {
    try {
      const [rows] = await pool.execute(sql, params)
      return rows as any[]
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  },

  // Helper method for transactions
  transaction: async (callback: (connection: any) => Promise<any>) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },
}

