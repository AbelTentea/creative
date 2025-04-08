"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProductImageType } from "@/lib/types"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  images: ProductImageType[]
  onChange: (images: ProductImageType[]) => void
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()

          // Add new image to the list
          const newImage: ProductImageType = {
            id: 0, // Will be set by the server when saved
            productId: 0, // Will be set by the server when saved
            imageUrl: data.url,
            displayOrder: images.length,
          }

          onChange([...images, newImage])

          toast({
            title: "Image uploaded",
            description: "Image has been successfully uploaded.",
          })
        } else {
          // Handle error response
          const errorData = await response.json()
          console.error("Failed to upload image:", errorData.error)
          toast({
            title: "Upload failed",
            description: errorData.error || "Failed to upload image. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload error",
        description: "An unexpected error occurred while uploading the image.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)

    // Update display order
    newImages.forEach((image, i) => {
      image.displayOrder = i
    })

    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Product Images</h3>
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Images"}
          </Button>
        </div>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-md border">
              <Image
                src={image.imageUrl || "/placeholder.svg"}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center text-sm text-muted-foreground">
            <ImageIcon className="mb-2 h-8 w-8" />
            <p>No images uploaded</p>
          </div>
        </div>
      )}
    </div>
  )
}

