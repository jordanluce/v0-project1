"use client"

import { useEffect, useState } from "react"
import useScreenOrientation from "@/hooks/useScreenOrientation"
import "./OrientationAlert.css"

const OrientationAlert = () => {
  const { isSmallPortrait } = useScreenOrientation()
  const [visible, setVisible] = useState(false)

  // Add a slight delay before showing the alert to prevent flashing during initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(isSmallPortrait)
    }, 500)

    return () => clearTimeout(timer)
  }, [isSmallPortrait])

  if (!visible) return null

  return (
    <div className="orientation-alert-overlay">
      <div className="orientation-alert-content">
        <div className="orientation-icon">
          <div className="phone-outline">
            <div className="rotate-arrow">↻</div>
          </div>
        </div>
        <h2>Please Rotate Your Device</h2>
        <p>This application works best in landscape mode on small screens.</p>
        <p className="orientation-instructions">Rotate your device horizontally for the best experience.</p>
      </div>
    </div>
  )
}

export default OrientationAlert

