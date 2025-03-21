"use client"

import { useState } from "react"
import "./PlayerFoulsModal.css"

const PlayerFoulsModal = ({ player, onClose, onUpdateFouls }) => {
  const [fouls, setFouls] = useState(player.fouls || 0)
  const [technicalFouls, setTechnicalFouls] = useState(player.technicalFouls || 0)

  const handleIncreaseFouls = () => {
    if (fouls < 5) {
      setFouls(fouls + 1)
    }
  }

  const handleDecreaseFouls = () => {
    if (fouls > 0) {
      setFouls(fouls - 1)
    }
  }

  const handleIncreaseTechnicalFouls = () => {
    if (technicalFouls < 2) {
      setTechnicalFouls(technicalFouls + 1)
    }
  }

  const handleDecreaseTechnicalFouls = () => {
    if (technicalFouls > 0) {
      setTechnicalFouls(technicalFouls - 1)
    }
  }

  const handleSave = () => {
    onUpdateFouls(player.id, fouls, technicalFouls)
    onClose()
  }

  return (
    <div className="fouls-modal-overlay">
      <div className="fouls-modal-content">
        <div className="fouls-modal-header">
          <h2>Fouls - {player.name}</h2>
          <button className="fouls-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="fouls-section">
          <div className="fouls-type">
            <h3>Personal Fouls</h3>
            <div className="fouls-counter">
              <button className="fouls-button decrease" onClick={handleDecreaseFouls} disabled={fouls <= 0}>
                −
              </button>
              <div className="fouls-count">{fouls}</div>
              <button className="fouls-button increase" onClick={handleIncreaseFouls} disabled={fouls >= 5}>
                +
              </button>
            </div>
            <div className="fouls-limit-info">
              {fouls >= 5 ? (
                <span className="fouls-warning">Fouled Out</span>
              ) : (
                <span className="fouls-remaining">{5 - fouls} remaining</span>
              )}
            </div>
          </div>

          <div className="fouls-type">
            <h3>Technical Fouls</h3>
            <div className="fouls-counter">
              <button
                className="fouls-button decrease"
                onClick={handleDecreaseTechnicalFouls}
                disabled={technicalFouls <= 0}
              >
                −
              </button>
              <div className="fouls-count">{technicalFouls}</div>
              <button
                className="fouls-button increase"
                onClick={handleIncreaseTechnicalFouls}
                disabled={technicalFouls >= 2}
              >
                +
              </button>
            </div>
            <div className="fouls-limit-info">
              {technicalFouls >= 2 ? (
                <span className="fouls-warning">Ejected</span>
              ) : (
                <span className="fouls-remaining">{2 - technicalFouls} remaining</span>
              )}
            </div>
          </div>
        </div>

        <div className="fouls-actions">
          <button className="fouls-save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerFoulsModal

