"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminProductsTable } from "@/components/admin/products-table"
import { AdminCategoriesTable } from "@/components/admin/categories-table"
import { UserManagement } from "@/components/admin/user-management"
import { ExportHistory } from "@/components/admin/export-history"
import { useLanguage } from "@/lib/i18n/language-context"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { Package, Layers, Users, FileDown } from "lucide-react"

export default function AdminDashboard() {
  const { t } = useLanguage()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isLoading && (!user || !user.isAdmin)) {
      router.push("/login")
    }
  }, [user, isLoading, isClient, router])

  if (isLoading || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />

      <main className="flex-1 bg-muted/30 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
            <p className="text-muted-foreground">{t("manageYourProducts")}</p>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{t("products")}</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>{t("categories")}</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{t("users")}</span>
              </TabsTrigger>
              <TabsTrigger value="exports" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                <span>{t("exports")}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <AdminProductsTable />
            </TabsContent>
            <TabsContent value="categories">
              <AdminCategoriesTable />
            </TabsContent>
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            <TabsContent value="exports">
              <ExportHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

