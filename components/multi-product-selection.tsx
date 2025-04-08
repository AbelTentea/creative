"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/lib/cart/cart-context"
import { useLanguage } from "@/lib/i18n/language-context"
import { Trash2, ShoppingCart, Building, ArrowUp, ArrowDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

export function MultiProductSelection() {
  const { t } = useLanguage()
  const {
    selectedProducts,
    totalPrice,
    removeProduct,
    removeCustomFeature,
    companyName,
    setCompanyName,
    moveProductUp,
    moveProductDown,
  } = useCart()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span>{t("selectedProducts")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{t("companyName")}</span>
          </Label>
          <Input
            id="companyName"
            placeholder={t("enterCompanyName")}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <Separator />

        {selectedProducts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">{t("noProductsSelected")}</div>
        ) : (
          <div className="space-y-4">
            {selectedProducts.map((item, index) => (
              <div key={index} className="flex flex-col border-b pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(item.price)}</span>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveProductUp(index)}
                        disabled={index === 0}
                        className="h-7 w-7"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveProductDown(index)}
                        disabled={index === selectedProducts.length - 1}
                        className="h-7 w-7"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeProduct(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.width} cm × {item.height} cm = {item.squareMeters.toFixed(2)} m²
                </p>

                {/* Standard extras */}
                {item.selectedExtras.length > 0 && item.product.extras && (
                  <div className="mt-1">
                    <p className="text-xs font-medium">{t("extras")}:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {item.selectedExtras.map((extraId) => {
                        const extra = item.product.extras.find((e) => e.id === extraId)
                        return extra ? <li key={extra.id}>{extra.name}</li> : null
                      })}
                    </ul>
                  </div>
                )}

                {/* Custom features */}
                {item.customFeatures && item.customFeatures.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs font-medium">{t("customFeatures")}:</p>
                    <ul className="text-xs text-muted-foreground">
                      {item.customFeatures.map((feature) => (
                        <li key={feature.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-primary">•</span>
                            <span>
                              {feature.name} - {formatCurrency(feature.price)}
                              {feature.isPricePerSquareMeter && ` (${t("perSquareMeter")})`}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => removeCustomFeature(index, feature.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between pt-2 font-medium">
              <span>{t("total")}</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

