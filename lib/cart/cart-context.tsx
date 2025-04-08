"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { SelectedProductType, CustomFeatureType } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

type CartContextType = {
  selectedProducts: SelectedProductType[]
  companyName: string
  totalPrice: number
  addProduct: (product: SelectedProductType) => void
  removeProduct: (index: number) => void
  addCustomFeature: (productIndex: number, feature: CustomFeatureType) => void
  removeCustomFeature: (productIndex: number, featureId: string) => void
  setCompanyName: (name: string) => void
  clearCart: () => void
  moveProductUp: (index: number) => void
  moveProductDown: (index: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductType[]>([])
  const [companyName, setCompanyName] = useState<string>("")

  const calculateTotalPrice = (): number => {
    return selectedProducts.reduce((sum, item) => sum + item.price, 0)
  }

  const addProduct = (product: SelectedProductType) => {
    setSelectedProducts((prev) => [...prev, product])
  }

  const removeProduct = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index))
  }

  // New function to add custom feature directly to a product in the cart
  const addCustomFeature = (productIndex: number, feature: CustomFeatureType) => {
    if (productIndex < 0 || productIndex >= selectedProducts.length) {
      console.error("Invalid product index")
      return
    }

    setSelectedProducts((prev) => {
      const updatedProducts = [...prev]
      const product = { ...updatedProducts[productIndex] }

      // Calculate feature price
      let featurePrice = feature.price

      if (feature.isPricePerSquareMeter) {
        let sqm = 0

        if (feature.useProductDimensions) {
          // Use product dimensions
          sqm = (product.width * product.height) / 10000
        } else if (feature.width && feature.height) {
          // Use custom dimensions
          sqm = (feature.width * feature.height) / 10000
        }

        if (sqm > 0) {
          featurePrice = sqm * feature.price
        }
      }

      // Create the custom feature with a unique ID
      const newFeature = {
        id: uuidv4(),
        productId: product.product.id,
        name: feature.name,
        price: featurePrice,
        width: feature.useProductDimensions ? product.width : feature.width,
        height: feature.useProductDimensions ? product.height : feature.height,
        isPricePerSquareMeter: feature.isPricePerSquareMeter,
        useProductDimensions: feature.useProductDimensions,
      }

      // Add the custom feature
      product.customFeatures = [...(product.customFeatures || []), newFeature]

      // Update the total price
      product.price += featurePrice

      updatedProducts[productIndex] = product
      return updatedProducts
    })
  }

  const removeCustomFeature = (productIndex: number, featureId: string) => {
    setSelectedProducts((prev) => {
      const updatedProducts = [...prev]
      const product = { ...updatedProducts[productIndex] }

      if (product.customFeatures) {
        const feature = product.customFeatures.find((f) => f.id === featureId)
        if (feature) {
          // Update the total price
          product.price -= feature.price

          // Remove the feature
          product.customFeatures = product.customFeatures.filter((f) => f.id !== featureId)

          updatedProducts[productIndex] = product
        }
      }

      return updatedProducts
    })
  }

  const moveProductUp = (index: number) => {
    if (index <= 0) return // Can't move up if already at the top

    setSelectedProducts((prev) => {
      const newProducts = [...prev]
      // Swap the product with the one above it
      ;[newProducts[index], newProducts[index - 1]] = [newProducts[index - 1], newProducts[index]]
      return newProducts
    })
  }

  const moveProductDown = (index: number) => {
    if (index >= selectedProducts.length - 1) return // Can't move down if already at the bottom

    setSelectedProducts((prev) => {
      const newProducts = [...prev]
      // Swap the product with the one below it
      ;[newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]]
      return newProducts
    })
  }

  const clearCart = () => {
    setSelectedProducts([])
    setCompanyName("")
  }

  return (
    <CartContext.Provider
      value={{
        selectedProducts,
        companyName,
        totalPrice: calculateTotalPrice(),
        addProduct,
        removeProduct,
        addCustomFeature,
        removeCustomFeature,
        setCompanyName,
        clearCart,
        moveProductUp,
        moveProductDown,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

