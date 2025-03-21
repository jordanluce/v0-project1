"use client"

// Make sure CSS import is at the top of the file
import "./LineupNamingPopup.css"

import { useState, useEffect, useRef } from "react"
// Remove duplicate import
// import "./LineupNamingPopup.css"

const LineupNamingPopup = ({ lineup, defaultName, onSave, onCancel }) => {
  const [lineupName, setLineupName] = useState(defaultName || "")
  const inputRef = useRef(null)

  // Focus the input field when the popup opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!lineupName.trim()) {
      return
    }

    const success = onSave(lineupName)
    if (success) {
      setLineupName("")
    }
  }

  return (
    <div className="naming-popup-overlay" onClick={onCancel}>
      <div className="naming-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="naming-popup-header">
          <h3>Save Lineup</h3>
          <button className="close-button" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="lineup-preview">
          <div className="lineup-preview-header">
            <span className="lineup-preview-classification">{lineup.totalClassification.toFixed(1)} points</span>
          </div>
          <div className="lineup-preview-players">
            {lineup.players.map((player) => (
              <div key={player.id} className="lineup-preview-player">
                <span className="player-number">#{player.number}</span>
                <span className="player-name">{player.name}</span>
                <span className="player-classification">{player.classification}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="lineupName">Lineup Name</label>
            <input
              id="lineupName"
              type="text"
              value={lineupName}
              onChange={(e) => setLineupName(e.target.value)}
              placeholder="Enter a name for this lineup"
              ref={inputRef}
              required
            />
          </div>

          <div className="naming-popup-actions">
            <button type="button" className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Lineup
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LineupNamingPopup

