"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CategoryType } from "@/lib/types"
import { Layers } from "lucide-react"

interface ProductCategoryFilterProps {
  onCategoryChange: (categoryId: number | null) => void
}

export function ProductCategoryFilter({ onCategoryChange }: ProductCategoryFilterProps) {
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch categories from API
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        const data = await response.json()
        setCategories(data)
        if (data.length > 0) {
          setSelectedCategory(data[0].id)
          onCategoryChange(data[0].id)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [onCategoryChange])

  const handleCategoryChange = (categoryId: string) => {
    const id = Number(categoryId)
    setSelectedCategory(id)
    onCategoryChange(id)
  }

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          <span>Categories</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <RadioGroup
            value={selectedCategory?.toString() || ""}
            onValueChange={handleCategoryChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted">
              <RadioGroupItem value="0" id="category-all" />
              <Label htmlFor="category-all" className="w-full cursor-pointer font-medium">
                All Categories
              </Label>
            </div>
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted"
              >
                <RadioGroupItem value={category.id.toString()} id={`category-${category.id}`} />
                <Label htmlFor={`category-${category.id}`} className="w-full cursor-pointer font-medium">
                  {category.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  )
}

