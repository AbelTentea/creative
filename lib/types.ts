export type CategoryType = {
  id: number
  name: string
}

export type ExtraOptionType = {
  id: number
  name: string
  price: number
  pricePerSquareMeter: boolean
  useProductDimensions?: boolean
}

export type ProductImageType = {
  id: number
  productId: number
  imageUrl: string
  displayOrder: number
}

export type ProductType = {
  id: number
  name: string
  description: string
  pros?: string
  cons?: string
  categoryId: number
  categoryName?: string
  basePrice: number
  pricePerSquareMeter: boolean
  extras?: ExtraOptionType[]
  images?: ProductImageType[]
  canExport?: boolean
}

export type UserType = {
  id: number
  username: string
  isAdmin: boolean
}

export type CustomFeatureType = {
  id?: string
  productId: number
  name: string
  price: number
  width?: number
  height?: number
  isPricePerSquareMeter?: boolean
  useProductDimensions?: boolean
}

export type SelectedProductType = {
  product: ProductType
  width: number
  height: number
  squareMeters: number
  selectedExtras: number[]
  customExtras?: {
    extraId: number
    width?: number
    height?: number
    squareMeters?: number
  }[]
  price: number
  customFeatures?: CustomFeatureType[]
}

export type CustomProductType = {
  id: string
  productId?: number
  name: string
  price: number
  width?: number
  height?: number
  isPricePerSquareMeter?: boolean
  useProductDimensions?: boolean
}

export type ExportHistoryType = {
  id: number
  userId: number
  username: string
  exportData: {
    selectedProducts: SelectedProductType[]
    companyName: string
    totalPrice: number
    date: string
  }
  createdAt: string
}

