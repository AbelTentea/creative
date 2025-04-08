"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { ProductImageType } from "@/lib/types"

interface ImageCarouselProps {
  images: ProductImageType[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageCarousel({ images, open, onOpenChange }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  if (images.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <div className="relative flex flex-col items-center">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={images[currentIndex]?.imageUrl || "/placeholder.svg?height=400&width=600"}
              alt={`Product image ${currentIndex + 1}`}
              width={800}
              height={450}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="mt-4 flex w-full items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePrevious} disabled={images.length <= 1}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </span>
            <Button variant="outline" size="icon" onClick={handleNext} disabled={images.length <= 1}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

