"use client"

import { useState, useEffect, useRef } from "react"
import "./EnhancedPlayerCard.css"

const EnhancedPlayerCard = ({
  player,
  location,
  eligiblePlayers = [],
  onSwitch,
  onViewStats,
  maxClassification,
  currentClassification,
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [animateSwap, setAnimateSwap] = useState(false)
  const [swapDirection, setSwitchDirection] = useState("")
  const dropdownRef = useRef(null)
  const cardRef = useRef(null)

  // Calculate if switching would exceed classification limit
  const calculateNewClassification = (newPlayer) => {
    // Remove current player's classification and add new player's classification
    const playerClassification = Number.parseFloat(player.classification)
    const newPlayerClassification = Number.parseFloat(newPlayer.classification)

    return currentClassification - playerClassification + newPlayerClassification
  }

  // Handle switch button click
  const handleSwitchClick = (e) => {
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  // Perform the actual switch with animation
  const performSwitch = (targetPlayer, e) => {
    if (e) e.stopPropagation()

    // Set the direction for the animation
    setSwitchDirection(location === "court" ? "to-bench" : "to-court")
    setAnimateSwap(true)

    // Close the dropdown
    setShowDropdown(false)

    // After animation completes, perform the actual switch
    setTimeout(() => {
      onSwitch(player, targetPlayer, location === "court" ? "bench" : "court")
      setAnimateSwap(false)
      setSwitchDirection("")
    }, 500) // Match this with the animation duration
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDropdown])

  // Group players by eligibility
  const groupedPlayers = eligiblePlayers.reduce(
    (acc, player) => {
      const newTotal = calculateNewClassification(player)
      const isEligible = newTotal <= maxClassification

      if (isEligible) {
        acc.eligible.push(player)
      } else {
        acc.ineligible.push(player)
      }

      return acc
    },
    { eligible: [], ineligible: [] },
  )

  return (
    <div
      ref={cardRef}
      className={`enhanced-player-card ${location} ${animateSwap ? `switching ${swapDirection}` : ""}`}
      onClick={() => onViewStats(player)}
    >
      <div className="player-content">
        <h3 className="player-name">{player.name}</h3>
        <div className="player-classification">{player.classification}</div>
        <button
          className={`switch-button ${location === "court" ? "court-to-bench" : "bench-to-court"}`}
          onClick={handleSwitchClick}
          aria-label={`Switch ${player.name}`}
        >
          Switch {location === "court" ? "Out" : "In"}
        </button>
      </div>

      {showDropdown && (
        <div className="player-dropdown" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
          <div className="dropdown-header">
            <span>Select Player to Switch</span>
            <button
              className="close-dropdown"
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(false)
              }}
            >
              ×
            </button>
          </div>

          <div className="dropdown-content">
            {groupedPlayers.eligible.length > 0 ? (
              <>
                <div className="dropdown-section">
                  <div className="section-title">Available Players</div>
                  <ul className="player-list">
                    {groupedPlayers.eligible.map((eligiblePlayer) => (
                      <li
                        key={eligiblePlayer.id}
                        className="player-option eligible"
                        onClick={(e) => performSwitch(eligiblePlayer, e)}
                      >
                        <span className="option-name">{eligiblePlayer.name}</span>
                        <span className="option-classification">{eligiblePlayer.classification}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {groupedPlayers.ineligible.length > 0 && (
                  <div className="dropdown-section">
                    <div className="section-title">Exceeds Classification Limit</div>
                    <ul className="player-list">
                      {groupedPlayers.ineligible.map((ineligiblePlayer) => {
                        const newTotal = calculateNewClassification(ineligiblePlayer)
                        return (
                          <li
                            key={ineligiblePlayer.id}
                            className="player-option ineligible"
                            title={`Would exceed ${maxClassification} limit (${newTotal.toFixed(1)})`}
                          >
                            <span className="option-name">{ineligiblePlayer.name}</span>
                            <span className="option-classification">{ineligiblePlayer.classification}</span>
                            <span className="option-warning">Exceeds limit</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="no-players-message">
                {location === "court"
                  ? "No bench players available"
                  : groupedPlayers.ineligible.length > 0
                    ? "No eligible players (classification limit)"
                    : "No players available"}
              </div>
            )}

            {/* Direct action button */}
            {location === "court" && (
              <div className="direct-action">
                <button className="direct-action-button" onClick={(e) => performSwitch(null, e)}>
                  Move to Bench
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedPlayerCard

