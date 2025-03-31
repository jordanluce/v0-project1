"use client"

import type React from "react"
import "./HowItWorksButton.css"

interface HowItWorksButtonProps {
  onClick: () => void
}

const HowItWorksButton: React.FC<HowItWorksButtonProps> = ({ onClick }) => {
  return (
    <button className="how-it-works-button" onClick={onClick} aria-label="How it works">
      <span className="question-mark-icon">?</span>
      <span className="button-text">How I Work?</span>
    </button>
  )
}

export default HowItWorksButton


