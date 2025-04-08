"use client"

import { useState } from "react"
import { ProductCalculator } from "@/components/product-calculator"
import { ProductCategoryFilter } from "@/components/product-category-filter"
import { SiteHeader } from "@/components/site-header"
import { MultiProductSelection } from "@/components/multi-product-selection"
import { PdfExportButton } from "@/components/pdf-export-button"
import { useLanguage } from "@/lib/i18n/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDown } from "lucide-react"

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <h1 className="mb-6 text-3xl font-bold tracking-tight">{t("appTitle")}</h1>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="space-y-6 md:col-span-1">
              <ProductCategoryFilter onCategoryChange={setSelectedCategoryId} />
              <MultiProductSelection />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileDown className="h-5 w-5" />
                    <span>{t("exportPdf")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PdfExportButton />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-3">
              <ProductCalculator selectedCategoryId={selectedCategoryId} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("companyName")}
          </p>
        </div>
      </footer>
    </div>
  )
}

