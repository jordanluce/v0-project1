"use client"

import { useState, useEffect } from "react"

// Define screen orientation types
export type Orientation = "portrait" | "landscape"

// Define screen size categories
export type ScreenSize = "small" | "medium" | "large"

interface ScreenOrientationState {
  orientation: Orientation
  screenSize: ScreenSize
  isSmallPortrait: boolean
  width: number
  height: number
}

// Small screen threshold (iPad Mini width is 768px)
const SMALL_SCREEN_THRESHOLD = 768

export default function useScreenOrientation(): ScreenOrientationState {
  // Initialize with default values
  const [state, setState] = useState<ScreenOrientationState>({
    orientation: "landscape",
    screenSize: "large",
    isSmallPortrait: false,
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  })

  useEffect(() => {
    // Function to update orientation and screen size
    const updateOrientation = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isPortrait = height > width
      const screenSize: ScreenSize = width < SMALL_SCREEN_THRESHOLD ? "small" : width < 1024 ? "medium" : "large"

      setState({
        orientation: isPortrait ? "portrait" : "landscape",
        screenSize,
        isSmallPortrait: isPortrait && screenSize === "small",
        width,
        height,
      })
    }

    // Initial call
    updateOrientation()

    // Add event listeners for resize and orientation change
    window.addEventListener("resize", updateOrientation)
    window.addEventListener("orientationchange", updateOrientation)

    // Clean up event listeners
    return () => {
      window.removeEventListener("resize", updateOrientation)
      window.removeEventListener("orientationchange", updateOrientation)
    }
  }, [])

  return state
}

