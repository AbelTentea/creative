"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { ProductType, CustomFeatureType } from "@/lib/types"
import { Calculator, Check, DollarSign, Ruler, ImageIcon, Search, ShoppingCart, Plus, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ImageCarousel } from "./image-carousel"
import { ProductDetailsTabs } from "./product-details-tabs"
import { useCart } from "@/lib/cart/cart-context"
import { useLanguage } from "@/lib/i18n/language-context"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { v4 as uuidv4 } from "uuid"

interface ProductCalculatorProps {
  selectedCategoryId: number | null
}

interface ExtraDimension {
  extraId: number
  width: number
  height: number
  squareMeters: number
}

export function ProductCalculator({ selectedCategoryId }: ProductCalculatorProps) {
  const { t } = useLanguage()
  const { addProduct, selectedProducts } = useCart()
  const { toast } = useToast()

  // Product state
  const [products, setProducts] = useState<ProductType[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Dimensions state
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)
  const [squareMeters, setSquareMeters] = useState<number>(0)

  // Extras state
  const [selectedExtras, setSelectedExtras] = useState<number[]>([])
  const [extraDimensions, setExtraDimensions] = useState<ExtraDimension[]>([])

  // Custom features state (temporary, before adding to cart)
  const [tempCustomFeatures, setTempCustomFeatures] = useState<CustomFeatureType[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [isCustomFeatureOpen, setIsCustomFeatureOpen] = useState(false)
  const [totalPrice, setTotalPrice] = useState<number>(0)

  // Custom feature state
  const [customFeature, setCustomFeature] = useState<CustomFeatureType>({
    id: "",
    name: "",
    price: 0,
    width: 0,
    height: 0,
    isPricePerSquareMeter: false,
    useProductDimensions: false,
    productId: 0,
  })
  const [calculatedFeaturePrice, setCalculatedFeaturePrice] = useState<number>(0)

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/products")
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        const data = await response.json()
        setProducts(data)
        if (data.length > 0) {
          setSelectedProduct(data[0])
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Failed to load products",
          description: "There was an error loading the product data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter products based on category and search query
  useEffect(() => {
    let filtered = [...products]

    // Filter by category
    if (selectedCategoryId && selectedCategoryId > 0) {
      filtered = filtered.filter((product) => product.categoryId === selectedCategoryId)
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.categoryName?.toLowerCase().includes(query),
      )
    }

    setFilteredProducts(filtered)

    // Update selected product if needed
    if (filtered.length > 0 && selectedProduct && !filtered.some((p) => p.id === selectedProduct.id)) {
      setSelectedProduct(filtered[0])
      setSelectedExtras([])
      setExtraDimensions([])
      setTempCustomFeatures([])
    }
  }, [searchQuery, products, selectedCategoryId, selectedProduct])

  // Calculate square meters and price when dimensions, extras, or custom features change
  useEffect(() => {
    if (selectedProduct && width > 0 && height > 0) {
      // Calculate square meters
      const sqm = (width * height) / 10000 // Convert cm² to m²
      setSquareMeters(sqm)

      // Calculate base price
      let price = selectedProduct.pricePerSquareMeter
        ? sqm * Number(selectedProduct.basePrice)
        : Number(selectedProduct.basePrice)

      // Add extras
      if (selectedExtras.length > 0 && selectedProduct.extras) {
        selectedExtras.forEach((extraId) => {
          const extra = selectedProduct.extras.find((e) => e.id === extraId)
          if (extra) {
            if (extra.useProductDimensions) {
              // Use product dimensions
              price += extra.pricePerSquareMeter ? sqm * Number(extra.price) : Number(extra.price)
            } else {
              // Use custom dimensions if available
              const customDimension = extraDimensions.find((d) => d.extraId === extraId)
              if (customDimension && customDimension.width > 0 && customDimension.height > 0) {
                const extraSqm = customDimension.squareMeters
                price += extra.pricePerSquareMeter ? extraSqm * Number(extra.price) : Number(extra.price)
              } else {
                // Fallback to fixed price if no dimensions
                price += Number(extra.price)
              }
            }
          }
        })
      }

      // Add temporary custom features
      if (tempCustomFeatures.length > 0) {
        tempCustomFeatures.forEach((feature) => {
          price += feature.price
        })
      }

      setTotalPrice(price)
    } else {
      setSquareMeters(0)
      setTotalPrice(0)
    }
  }, [selectedProduct, width, height, selectedExtras, extraDimensions, tempCustomFeatures])

  // Update custom feature dimensions when useProductDimensions changes
  useEffect(() => {
    if (customFeature.useProductDimensions && width > 0 && height > 0) {
      setCustomFeature((prev) => ({
        ...prev,
        width: width,
        height: height,
      }))
    }
  }, [customFeature.useProductDimensions, width, height])

  // Calculate custom feature price
  useEffect(() => {
    let featurePrice = customFeature.price

    if (customFeature.isPricePerSquareMeter) {
      let sqm = 0

      if (customFeature.useProductDimensions && width > 0 && height > 0) {
        sqm = (width * height) / 10000
      } else if (customFeature.width > 0 && customFeature.height > 0) {
        sqm = (customFeature.width * customFeature.height) / 10000
      }

      if (sqm > 0) {
        featurePrice = sqm * customFeature.price
      }
    }

    setCalculatedFeaturePrice(featurePrice)
  }, [
    customFeature.price,
    customFeature.isPricePerSquareMeter,
    customFeature.useProductDimensions,
    customFeature.width,
    customFeature.height,
    width,
    height,
  ])

  // Handle product selection change
  const handleProductChange = (productId: number) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setSelectedExtras([])
      setExtraDimensions([])
      setTempCustomFeatures([])
    }
  }

  // Handle extra option selection
  const handleExtraChange = (extraId: number, checked: boolean) => {
    if (checked) {
      setSelectedExtras((prev) => [...prev, extraId])

      // Initialize dimensions for extras that need custom dimensions
      if (selectedProduct?.extras) {
        const extra = selectedProduct.extras.find((e) => e.id === extraId)
        if (extra && !extra.useProductDimensions) {
          setExtraDimensions((prev) => [...prev, { extraId, width: 0, height: 0, squareMeters: 0 }])
        }
      }
    } else {
      setSelectedExtras((prev) => prev.filter((id) => id !== extraId))
      setExtraDimensions((prev) => prev.filter((d) => d.extraId !== extraId))
    }
  }

  // Handle extra dimension changes
  const handleExtraDimensionChange = (extraId: number, field: "width" | "height", value: number) => {
    setExtraDimensions((prev) => {
      const existing = prev.find((d) => d.extraId === extraId)
      if (existing) {
        const updated = prev.map((d) => {
          if (d.extraId === extraId) {
            const newValues = { ...d, [field]: value }
            // Recalculate square meters
            if (field === "width" || field === "height") {
              newValues.squareMeters = (newValues.width * newValues.height) / 10000
            }
            return newValues
          }
          return d
        })
        return updated
      } else {
        // Create new entry if it doesn't exist
        const newDimension = {
          extraId,
          width: field === "width" ? value : 0,
          height: field === "height" ? value : 0,
          squareMeters: 0,
        }
        return [...prev, newDimension]
      }
    })
  }

  // Handle adding product to cart
  const handleAddToCart = () => {
    if (!selectedProduct || width <= 0 || height <= 0) {
      toast({
        title: t("invalidDimensions"),
        description: t("enterValidDimensions"),
        variant: "destructive",
      })
      return
    }

    if (totalPrice <= 0) {
      toast({
        title: t("invalidCalculation"),
        description: t("priceMustBeGreaterThanZero"),
        variant: "destructive",
      })
      return
    }

    // Check if all custom dimensions are filled
    const missingDimensions = selectedExtras.some((extraId) => {
      const extra = selectedProduct.extras?.find((e) => e.id === extraId)
      if (extra && !extra.useProductDimensions) {
        const dimension = extraDimensions.find((d) => d.extraId === extraId)
        return !dimension || dimension.width <= 0 || dimension.height <= 0
      }
      return false
    })

    if (missingDimensions) {
      toast({
        title: t("missingDimensions"),
        description: t("enterDimensionsForAllExtras"),
        variant: "destructive",
      })
      return
    }

    // Create custom extras array with dimensions
    const customExtras = extraDimensions.map((dim) => ({
      extraId: dim.extraId,
      width: dim.width,
      height: dim.height,
      squareMeters: dim.squareMeters,
    }))

    // Add product to cart with all temporary custom features
    addProduct({
      product: selectedProduct,
      width,
      height,
      squareMeters,
      selectedExtras,
      customExtras,
      price: totalPrice,
      customFeatures: tempCustomFeatures, // Include all temporary custom features
    })

    // Show success message
    toast({
      title: t("productAdded"),
      description: t("productAddedToSelection"),
    })

    // Reset form
    setWidth(0)
    setHeight(0)
    setSelectedExtras([])
    setExtraDimensions([])
    setTempCustomFeatures([])
  }

  // Handle custom feature field changes
  const handleCustomFeatureChange = (field: string, value: any) => {
    setCustomFeature((prev) => {
      const updated = { ...prev, [field]: value }

      // If toggling useProductDimensions to true, update dimensions
      if (field === "useProductDimensions" && value === true && width > 0 && height > 0) {
        updated.width = width
        updated.height = height
      }

      return updated
    })
  }

  // Handle adding custom feature to temporary state (not directly to cart)
  const handleAddCustomFeature = () => {
    if (!selectedProduct) {
      toast({
        title: t("noProductSelected"),
        description: t("selectProductFirst"),
        variant: "destructive",
      })
      return
    }

    if (!customFeature.name || customFeature.price <= 0) {
      toast({
        title: t("invalidCustomFeature"),
        description: t("enterNameAndValidPrice"),
        variant: "destructive",
      })
      return
    }

    if (customFeature.isPricePerSquareMeter) {
      if (customFeature.useProductDimensions && (width <= 0 || height <= 0)) {
        toast({
          title: t("invalidProductDimensions"),
          description: t("enterProductDimensionsFirst"),
          variant: "destructive",
        })
        return
      } else if (!customFeature.useProductDimensions && (customFeature.width <= 0 || customFeature.height <= 0)) {
        toast({
          title: t("invalidDimensions"),
          description: t("enterValidDimensionsForCalculation"),
          variant: "destructive",
        })
        return
      }
    }

    // Create the custom feature with calculated price and dimensions
    const newFeature: CustomFeatureType = {
      id: uuidv4(),
      productId: selectedProduct.id,
      name: customFeature.name,
      price: calculatedFeaturePrice,
      width: customFeature.useProductDimensions ? width : customFeature.width,
      height: customFeature.useProductDimensions ? height : customFeature.height,
      isPricePerSquareMeter: customFeature.isPricePerSquareMeter,
      useProductDimensions: customFeature.useProductDimensions,
    }

    // Add to temporary custom features
    setTempCustomFeatures((prev) => [...prev, newFeature])

    // Show success message
    toast({
      title: t("customFeatureAdded"),
      description: t("customFeatureAddedMessage"),
    })

    // Reset custom feature form and close dialog
    setCustomFeature({
      id: "",
      name: "",
      price: 0,
      width: 0,
      height: 0,
      isPricePerSquareMeter: false,
      useProductDimensions: false,
      productId: 0,
    })
    setIsCustomFeatureOpen(false)
  }

  // Remove a temporary custom feature
  const handleRemoveTempCustomFeature = (featureId: string) => {
    setTempCustomFeatures((prev) => prev.filter((f) => f.id !== featureId))
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <span>{t("appTitle")}</span>
          </CardTitle>
          <CardDescription>{t("loading")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <span>{t("appTitle")}</span>
          </CardTitle>
          <CardDescription>{t("search")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Search and Product Selection */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product" className="text-base">
                    {t("products")}
                  </Label>
                  <select
                    id="product"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => handleProductChange(Number(e.target.value))}
                    value={selectedProduct?.id || ""}
                  >
                    {filteredProducts.length === 0 ? (
                      <option value="" disabled>
                        {t("noProductsFound")}
                      </option>
                    ) : (
                      filteredProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.categoryName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-muted-foreground">{t("noProductsFound")}</p>
                  <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                    {t("clearSearch")}
                  </Button>
                </div>
              )}

              {selectedProduct && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-medium">{selectedProduct.name}</h3>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">{t("basePrice")}:</span>{" "}
                        {formatCurrency(Number(selectedProduct.basePrice))}
                        {selectedProduct.pricePerSquareMeter ? ` ${t("perSquareMeter")}` : ` ${t("fixedPrice")}`}
                      </div>
                      {selectedProduct.canExport === false && (
                        <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                          {t("productCannotBeExported")}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedProduct.images && selectedProduct.images.length > 0 && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsCarouselOpen(true)}>
                          <ImageIcon className="h-4 w-4" />
                          <span>{t("viewImages")}</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsCustomFeatureOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>{t("addCustomFeature")}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProductDetailsTabs product={selectedProduct} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="width" className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    <span>{t("width")} (cm)</span>
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    min="0"
                    value={width || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (value >= 0) setWidth(value)
                    }}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    <span>{t("height")} (cm)</span>
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    value={height || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (value >= 0) setHeight(value)
                    }}
                    className="text-base"
                  />
                </div>
              </div>

              {/* Display temporary custom features */}
              {tempCustomFeatures.length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                  <Label className="text-base">{t("customFeatures")}</Label>
                  <div className="space-y-2">
                    {tempCustomFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="font-medium">{feature.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(feature.price)}
                            {feature.isPricePerSquareMeter ? ` (${t("perSquareMeter")})` : ""}
                            {feature.isPricePerSquareMeter &&
                              feature.width &&
                              feature.height &&
                              ` - ${feature.width} cm × ${feature.height} cm`}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTempCustomFeature(feature.id)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct?.extras && selectedProduct.extras.length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                  <Label className="text-base">{t("extras")}</Label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedProduct.extras.map((extra) => (
                      <div key={extra.id} className="flex flex-col space-y-3 rounded-md border p-3 shadow-sm">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={`extra-${extra.id}`}
                            checked={selectedExtras.includes(extra.id)}
                            onCheckedChange={(checked) => handleExtraChange(extra.id, checked === true)}
                            className="mt-1"
                          />
                          <div>
                            <Label htmlFor={`extra-${extra.id}`} className="font-medium">
                              {extra.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              +{formatCurrency(Number(extra.price))}{" "}
                              {extra.pricePerSquareMeter ? t("perSquareMeter") : t("fixedPrice")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {extra.useProductDimensions ? t("usesProductDimensions") : t("requiresCustomDimensions")}
                            </p>
                          </div>
                        </div>

                        {/* Custom dimensions for extras that need them */}
                        {selectedExtras.includes(extra.id) && !extra.useProductDimensions && (
                          <div className="mt-2 border-t pt-2">
                            <p className="text-xs font-medium mb-2">{t("enterDimensionsForExtra")}:</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`extra-${extra.id}-width`} className="text-xs">
                                  {t("width")} (cm)
                                </Label>
                                <Input
                                  id={`extra-${extra.id}-width`}
                                  type="number"
                                  min="0"
                                  value={extraDimensions.find((d) => d.extraId === extra.id)?.width || ""}
                                  onChange={(e) =>
                                    handleExtraDimensionChange(extra.id, "width", Number(e.target.value))
                                  }
                                  className="text-sm h-8"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`extra-${extra.id}-height`} className="text-xs">
                                  {t("height")} (cm)
                                </Label>
                                <Input
                                  id={`extra-${extra.id}-height`}
                                  type="number"
                                  min="0"
                                  value={extraDimensions.find((d) => d.extraId === extra.id)?.height || ""}
                                  onChange={(e) =>
                                    handleExtraDimensionChange(extra.id, "height", Number(e.target.value))
                                  }
                                  className="text-sm h-8"
                                />
                              </div>
                            </div>
                            {/* Show calculated area */}
                            {extraDimensions.find((d) => d.extraId === extra.id)?.squareMeters > 0 && (
                              <p className="text-xs mt-1">
                                {t("area")}:{" "}
                                {extraDimensions.find((d) => d.extraId === extra.id)?.squareMeters.toFixed(2)} m²
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div>
              <Separator className="my-6" />
              <h3 className="mb-4 text-lg font-medium">{t("results")}</h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Ruler className="h-5 w-5 text-muted-foreground" />
                      <span>{t("area")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="text-4xl font-bold tabular-nums text-primary">
                        {Number(squareMeters).toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">m²</p>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {width > 0 && height > 0 ? (
                        <p>
                          {t("dimensions")}: {width} cm × {height} cm
                        </p>
                      ) : (
                        <p>{t("enterDimensions")}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span>{t("price")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="text-4xl font-bold tabular-nums text-primary">{formatCurrency(totalPrice)}</div>
                      <p className="text-sm text-muted-foreground">{t("total")}</p>
                    </div>
                    {selectedExtras.length > 0 && selectedProduct?.extras && (
                      <div className="mt-2 text-xs">
                        <p className="font-medium">{t("selectedExtras")}:</p>
                        <ul className="mt-1 list-inside list-disc">
                          {selectedExtras.map((extraId) => {
                            const extra = selectedProduct.extras.find((e) => e.id === extraId)
                            return extra ? <li key={extra.id}>{extra.name}</li> : null
                          })}
                        </ul>
                      </div>
                    )}
                    {tempCustomFeatures.length > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="font-medium">{t("customFeatures")}:</p>
                        <ul className="mt-1 list-inside list-disc">
                          {tempCustomFeatures.map((feature) => (
                            <li key={feature.id}>
                              {feature.name} - {formatCurrency(feature.price)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {totalPrice > 0 && (
                <div className="mt-6 space-y-4">
                  <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t("calculationComplete")}</h3>
                        <p className="text-sm text-muted-foreground">{t("estimateReady")}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={handleAddToCart} className="w-full gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    {t("addToSelection")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Feature Dialog */}
      <Dialog open={isCustomFeatureOpen} onOpenChange={setIsCustomFeatureOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("addCustomFeature")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customFeatureName">{t("name")}</Label>
              <Input
                id="customFeatureName"
                value={customFeature.name}
                onChange={(e) => handleCustomFeatureChange("name", e.target.value)}
                placeholder={t("enterFeatureName")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customFeaturePrice">{t("price")}</Label>
              <Input
                id="customFeaturePrice"
                type="number"
                min="0"
                step="0.01"
                value={customFeature.price || ""}
                onChange={(e) => handleCustomFeatureChange("price", Number(e.target.value))}
                placeholder={t("enterPrice")}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPricePerSquareMeter"
                checked={customFeature.isPricePerSquareMeter}
                onCheckedChange={(checked) => handleCustomFeatureChange("isPricePerSquareMeter", checked === true)}
              />
              <Label htmlFor="isPricePerSquareMeter">{t("perSquareMeter")}</Label>
            </div>

            {customFeature.isPricePerSquareMeter && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useProductDimensions"
                    checked={customFeature.useProductDimensions}
                    onCheckedChange={(checked) => handleCustomFeatureChange("useProductDimensions", checked === true)}
                    disabled={width <= 0 || height <= 0}
                  />
                  <Label htmlFor="useProductDimensions">{t("useProductDimensions")}</Label>
                </div>

                {!customFeature.useProductDimensions ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customFeatureWidth">{t("width")} (cm)</Label>
                      <Input
                        id="customFeatureWidth"
                        type="number"
                        min="0"
                        value={customFeature.width || ""}
                        onChange={(e) => handleCustomFeatureChange("width", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customFeatureHeight">{t("height")} (cm)</Label>
                      <Input
                        id="customFeatureHeight"
                        type="number"
                        min="0"
                        value={customFeature.height || ""}
                        onChange={(e) => handleCustomFeatureChange("height", Number(e.target.value))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm">
                      {t("usingProductDimensions")}: {width} cm × {height} cm
                    </p>
                  </div>
                )}
              </>
            )}

            {customFeature.price > 0 && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">
                  {customFeature.isPricePerSquareMeter ? (
                    <>
                      {t("calculatedArea")}:{" "}
                      {customFeature.useProductDimensions
                        ? ((width * height) / 10000).toFixed(2)
                        : ((customFeature.width * customFeature.height) / 10000).toFixed(2)}{" "}
                      m²
                      <br />
                    </>
                  ) : null}
                  {t("totalPrice")}: {formatCurrency(calculatedFeaturePrice)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomFeatureOpen(false)}>
              {t("cancel")}
            </Button>

            <Button onClick={handleAddCustomFeature}>{t("add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProduct?.images && (
        <ImageCarousel images={selectedProduct.images} open={isCarouselOpen} onOpenChange={setIsCarouselOpen} />
      )}
    </div>
  )
}

