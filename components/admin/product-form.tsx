"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { CategoryType, ProductType, ExtraOptionType, ProductImageType } from "@/lib/types"
import { X, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ImageUpload } from "./image-upload"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

interface ProductFormProps {
  product: ProductType | null
  onSubmit: (product: ProductType) => void
  onCancel: () => void
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<CategoryType[]>([])
  const { t } = useLanguage()
  const [formData, setFormData] = useState<ProductType>({
    id: product?.id || 0,
    name: product?.name || "",
    description: product?.description || "",
    pros: product?.pros || "",
    cons: product?.cons || "",
    categoryId: product?.categoryId || 0,
    basePrice: product?.basePrice || 0,
    pricePerSquareMeter: product?.pricePerSquareMeter || false,
    canExport: product?.canExport !== false, // Default to true if not specified
    extras: product?.extras || [],
    images: product?.images || [],
  })
  const [newExtra, setNewExtra] = useState<ExtraOptionType>({
    id: 0,
    name: "",
    price: 0,
    pricePerSquareMeter: false,
    useProductDimensions: true,
  })
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        const data = await response.json()
        setCategories(data)

        if (data.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }))
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewExtra((prev) => ({ ...prev, [name]: value }))
  }

  const handleExtraCheckboxChange = (field: string, checked: boolean) => {
    setNewExtra((prev) => ({ ...prev, [field]: checked }))
  }

  const addExtra = () => {
    if (!newExtra.name || newExtra.price <= 0) return

    const extraId = formData.extras?.length ? Math.max(...formData.extras.map((e) => e.id)) + 1 : 1

    const extraToAdd = {
      ...newExtra,
      id: extraId,
      useProductDimensions: true, // Always set to true
    }

    setFormData((prev) => ({
      ...prev,
      extras: [...(prev.extras || []), extraToAdd],
    }))

    setNewExtra({
      id: 0,
      name: "",
      price: 0,
      pricePerSquareMeter: false,
      useProductDimensions: true,
    })
  }

  const removeExtra = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      extras: prev.extras?.filter((e) => e.id !== id) || [],
    }))
  }

  const handleImagesChange = (images: ProductImageType[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Product name is required")
      return false
    }

    if (formData.basePrice <= 0) {
      setError("Base price must be greater than zero")
      return false
    }

    if (!formData.categoryId) {
      setError("Please select a category")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = product?.id ? `/api/products/${product.id}` : "/api/products"
      const method = product?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSubmit(formData)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save product")
      }
    } catch (error) {
      console.error("Error saving product:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? t("editProduct") : t("addProduct")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("productName")}</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">{t("category")}</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">{t("description")}</TabsTrigger>
                <TabsTrigger value="pros">{t("pros")}</TabsTrigger>
                <TabsTrigger value="cons">{t("cons")}</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Enter detailed product description..."
                />
                <p className="text-xs text-muted-foreground">
                  Provide a comprehensive description of the product, including materials, features, and use cases.
                </p>
              </TabsContent>
              <TabsContent value="pros" className="space-y-2">
                <Label htmlFor="pros">{t("pros")}</Label>
                <Textarea
                  id="pros"
                  name="pros"
                  value={formData.pros}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Enter product advantages (one per line)..."
                />
                <p className="text-xs text-muted-foreground">
                  List the advantages of this product, one per line. These will be displayed as bullet points.
                </p>
              </TabsContent>
              <TabsContent value="cons" className="space-y-2">
                <Label htmlFor="cons">{t("cons")}</Label>
                <Textarea
                  id="cons"
                  name="cons"
                  value={formData.cons}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Enter product limitations (one per line)..."
                />
                <p className="text-xs text-muted-foreground">
                  List the limitations or disadvantages of this product, one per line. These will be displayed as bullet
                  points.
                </p>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">{t("basePrice")}</Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-4 pt-8">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pricePerSquareMeter"
                    checked={formData.pricePerSquareMeter}
                    onCheckedChange={(checked) => handleCheckboxChange("pricePerSquareMeter", checked === true)}
                  />
                  <Label htmlFor="pricePerSquareMeter">{t("pricePerSquareMeter")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canExport"
                    checked={formData.canExport}
                    onCheckedChange={(checked) => handleCheckboxChange("canExport", checked === true)}
                  />
                  <Label htmlFor="canExport">{t("canExportToPdf")}</Label>
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="space-y-4">
              <ImageUpload images={formData.images || []} onChange={handleImagesChange} />
            </div>

            <Separator className="my-2" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>{t("extras")}</Label>
              </div>

              {formData.extras && formData.extras.length > 0 && (
                <div className="space-y-2">
                  {formData.extras.map((extra) => (
                    <div key={extra.id} className="flex items-center space-x-2 p-2 border rounded-md">
                      <div className="flex-1">{extra.name}</div>
                      <div className="flex-1">
                        ${Number(extra.price).toFixed(2)} {extra.pricePerSquareMeter ? "per m²" : "fixed"}
                      </div>
                      <div className="flex-1">{extra.pricePerSquareMeter ? "Per m²" : "Fixed price"}</div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeExtra(extra.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="space-y-2">
                  <Label htmlFor="extraName">{t("name")}</Label>
                  <Input id="extraName" name="name" value={newExtra.name} onChange={handleExtraChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extraPrice">{t("price")}</Label>
                  <Input
                    id="extraPrice"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newExtra.price || ""}
                    onChange={handleExtraChange}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extraPricePerSquareMeter"
                      checked={newExtra.pricePerSquareMeter}
                      onCheckedChange={(checked) => handleExtraCheckboxChange("pricePerSquareMeter", checked === true)}
                    />
                    <Label htmlFor="extraPricePerSquareMeter">{t("perSquareMeter")}</Label>
                  </div>
                </div>
              </div>

              <Button type="button" variant="outline" onClick={addExtra} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> {t("addExtraOption")}
              </Button>
            </div>
          </div>
          {error && <div className="p-4 rounded-md bg-destructive text-destructive-foreground">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("submitting") : product ? t("update") : t("create")} {t("product")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

