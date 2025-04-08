"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import type { ProductType } from "@/lib/types"
import { ThumbsUp, ThumbsDown, Info } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

interface ProductDetailsTabsProps {
  product: ProductType
}

export function ProductDetailsTabs({ product }: ProductDetailsTabsProps) {
  const { t } = useLanguage()

  // Function to convert newline-separated text to array
  const textToList = (text: string) => {
    if (!text) return []
    return text.split("\n").filter((item) => item.trim() !== "")
  }

  const prosList = textToList(product.pros || "")
  const consList = textToList(product.cons || "")

  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="description" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>{t("description")}</span>
        </TabsTrigger>
        <TabsTrigger value="pros" className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4" />
          <span>{t("pros")}</span>
        </TabsTrigger>
        <TabsTrigger value="cons" className="flex items-center gap-2">
          <ThumbsDown className="h-4 w-4" />
          <span>{t("cons")}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description">
        <Card>
          <CardContent className="pt-6">
            <div className="prose max-w-none dark:prose-invert">
              {product.description
                .split("\n")
                .map((paragraph, index) => (paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pros">
        <Card>
          <CardContent className="pt-6">
            {prosList.length > 0 ? (
              <ul className="space-y-2">
                {prosList.map((pro, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ThumbsUp className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t("noProsListed")}</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cons">
        <Card>
          <CardContent className="pt-6">
            {consList.length > 0 ? (
              <ul className="space-y-2">
                {consList.map((con, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ThumbsDown className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t("noConsListed")}</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

