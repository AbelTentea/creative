"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { useCart } from "@/lib/cart/cart-context"
import { useAuth } from "@/lib/auth/auth-context"
import { useLanguage } from "@/lib/i18n/language-context"
import { jsPDF } from "jspdf"
import "jspdf/dist/polyfills.es.js"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function PdfExportButton() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { selectedProducts, totalPrice, companyName } = useCart()
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const { toast } = useToast()

  const generatePdf = async () => {
    if (selectedProducts.length === 0) return

    setIsGenerating(true)

    try {
      // Create a new PDF document
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(20)
      doc.text(t("pdfTitle"), 14, 22)

      // Add date, user info, and company name
      doc.setFontSize(10)
      doc.text(`${t("pdfGeneratedOn")}: ${new Date().toLocaleDateString()}`, 14, 30)

      if (user) {
        doc.text(`${t("exportedBy")}: ${user.username}`, 14, 36)
      }

      if (companyName) {
        doc.text(`${t("companyName")}: ${companyName}`, 14, 42)
        doc.setLineWidth(0.5)
        doc.line(14, 44, 196, 44)
      }

      let yPos = companyName ? 50 : 44

      // Filter out products that can't be exported
      const exportableProducts = selectedProducts.filter((item) => item.product.canExport !== false)
      let itemNumber = 1

      // Add selected products
      if (exportableProducts.length > 0) {
        for (let i = 0; i < exportableProducts.length; i++) {
          const item = exportableProducts[i]
          const product = item.product

          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }

          // Product header with number
          doc.setFontSize(14)
          doc.setFont(undefined, "bold")
          doc.text(`${itemNumber}. ${product.name}`, 14, yPos)
          doc.setFont(undefined, "normal")
          yPos += 8

          // Product description
          doc.setFontSize(10)
          const descLines = doc.splitTextToSize(product.description, 180)
          doc.text(descLines, 14, yPos)
          yPos += descLines.length * 5 + 5

          // Product dimensions
          doc.text(
            `${t("dimensions")}: ${item.width} cm × ${item.height} cm = ${item.squareMeters.toFixed(2)} m²`,
            14,
            yPos,
          )
          yPos += 5

          // Selected extras
          if (item.selectedExtras.length > 0 && product.extras) {
            doc.text(`${t("extras")}:`, 14, yPos)
            yPos += 5

            item.selectedExtras.forEach((extraId) => {
              const extra = product.extras.find((e) => e.id === extraId)
              if (extra) {
                let extraText = `- ${extra.name}: ${formatCurrency(Number(extra.price))} ${extra.pricePerSquareMeter ? t("perSquareMeter") : t("fixedPrice")}`

                // Add custom dimensions if applicable
                if (!extra.useProductDimensions && item.customExtras) {
                  const customDimension = item.customExtras.find((d) => d.extraId === extraId)
                  if (customDimension) {
                    extraText += ` (${customDimension.width} cm × ${customDimension.height} cm = ${customDimension.squareMeters.toFixed(2)} m²)`
                  }
                }

                doc.text(extraText, 20, yPos)
                yPos += 5
              }
            })
          }

          // Custom features
          if (item.customFeatures && item.customFeatures.length > 0) {
            doc.text(`${t("customFeatures")}:`, 14, yPos)
            yPos += 5

            item.customFeatures.forEach((feature) => {
              let featureText = `- ${feature.name}: ${formatCurrency(feature.price)}`

              if (feature.isPricePerSquareMeter && feature.width && feature.height) {
                featureText += ` (${feature.width} cm × ${feature.height} cm = ${((feature.width * feature.height) / 10000).toFixed(2)} m²)`
              }

              doc.text(featureText, 20, yPos)
              yPos += 5
            })
          }

          // Product price
          doc.setFontSize(12)
          doc.text(`${t("price")}: ${formatCurrency(item.price)}`, 14, yPos)
          yPos += 10

          // Add separator between products
          doc.setDrawColor(200, 200, 200)
          doc.line(14, yPos, 196, yPos)
          yPos += 10

          itemNumber++
        }
      }

      // Total price
      doc.setDrawColor(100, 100, 100)
      doc.setLineWidth(0.5)
      doc.line(14, yPos, 196, yPos)
      yPos += 8

      doc.setFontSize(14)
      doc.setFont(undefined, "bold")
      doc.text(`${t("pdfTotalPrice")}: ${formatCurrency(totalPrice)}`, 14, yPos)
      doc.setFont(undefined, "normal")

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.text(t("pdfThankYou"), 14, doc.internal.pageSize.height - 10)
        doc.text(
          `${t("pdfPage")} ${i} ${t("pdfOf")} ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10,
        )
      }

      // Save the PDF
      doc.save(
        `product-calculation-${companyName ? companyName.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${new Date().toISOString().slice(0, 10)}.pdf`,
      )

      // Save export to database if user is logged in
      if (user) {
        try {
          await fetch("/api/exports", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              selectedProducts,
              companyName,
              totalPrice,
              date: new Date().toISOString(),
            }),
          })

          toast({
            title: "Export saved",
            description: "Your export has been saved to your history.",
          })
        } catch (error) {
          console.error("Error saving export:", error)
          toast({
            title: "Error saving export",
            description: "There was an error saving your export to history.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error generating PDF",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generatePdf} disabled={isGenerating || selectedProducts.length === 0} className="w-full gap-2">
      <FileDown className="h-4 w-4" />
      {isGenerating ? t("generatingPdf") : t("exportPdf")}
    </Button>
  )
}

