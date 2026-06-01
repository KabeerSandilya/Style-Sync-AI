import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Garment } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayImageUrl(garment: Garment): string {
  return garment.processedImageUrl ?? garment.imageUrl;
}
