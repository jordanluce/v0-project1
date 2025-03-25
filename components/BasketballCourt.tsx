"use client"

// Make sure CSS import is at the top of the file
import "./BasketballCourt.css"
import { useState, useEffect, useRef } from "react"

const BasketballCourt = () => {
  const [selectedPlayerForFouls, setSelectedPlayerForFouls] = useState(null)

  const handleOpenFoulsModal = (player, e) => {
    e.stopPropagation()
    setSelectedPlayerForFouls(player)
  }

  const handleCloseFoulsModal = () => {
    setSelectedPlayerForFouls(null)
  }

  const handleUpdateFouls = (playerId, fouls, technicalFouls) => {
    const updatedPlayers = players.map((player) =>
      player.id === playerId ? { ...player, fouls, technicalFouls } : player,
    )
    setPlayers(updatedPlayers)
  }

  const players = []
  const setPlayers = () => {}
  const selectedPlayer = null
  const handlePlayerClick = () => {}

  const svgRef = useRef(null)

  useEffect(() => {
    const svgElement = svgRef.current

    if (!svgElement) return

    // Function to prevent default on touch events
    const preventScroll = (e) => {
      e.preventDefault()
    }

    // Add event listeners
    svgElement.addEventListener("touchstart", preventScroll, { passive: false })
    svgElement.addEventListener("touchmove", preventScroll, { passive: false })

    // Cleanup
    return () => {
      svgElement.removeEventListener("touchstart", preventScroll)
      svgElement.removeEventListener("touchmove", preventScroll)
    }
  }, [])

  const renderPlayer = (player, location) => {
    // Existing code...

    return (
      <div
        key={player.id}
        className={`player-card ${location === "court" ? "court" : "bench"} ${
          selectedPlayer?.id === player.id ? "selected" : ""
        }`}
        onClick={() => handlePlayerClick(player)}
      >
        <div className="player-name">{player.name}</div>
        <div className={`player-classification ${location === "court" ? "court" : "bench"}`}>
          {player.classification}
        </div>

        {/* Add fouls tracking button */}
        <button className="fouls-tracking-button" onClick={(e) => handleOpenFoulsModal(player, e)} title="Track fouls">
          +
        </button>

        {/* Display fouls indicators if they exist */}
        {player.fouls > 0 && (
          <div className="fouls-indicator" title={`${player.fouls} personal fouls`}>
            F: {player.fouls}
          </div>
        )}
        {player.technicalFouls > 0 && (
          <div className="technical-fouls-indicator" title={`${player.technicalFouls} technical fouls`}>
            T: {player.technicalFouls}
          </div>
        )}

        <div className="player-select-text">Click to select</div>
      </div>
    )
  }

  const PlayerFoulsModal = ({ player, onClose, onUpdateFouls }) => {
    return (
      <div>
        {player.name}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }

  return (
    <>
      <svg className="basketball-court" viewBox="0 0 940 500" preserveAspectRatio="xMidYMid meet" ref={svgRef}>
        {/* Court outline */}
        <rect x="10" y="10" width="920" height="480" fill="#f8f8f8" stroke="#000" strokeWidth="2" />

        {/* Center line */}
        <line x1="470" y1="10" x2="470" y2="490" stroke="#000" strokeWidth="2" />

        {/* Center circle */}
        <circle cx="470" cy="250" r="60" fill="none" stroke="#000" strokeWidth="2" />

        {/* LEFT HALF COURT */}
        {/* Left key (paint) - reduced width from 190 to 160 */}
        <rect x="10" y="185" width="160" height="130" fill="none" stroke="#000" strokeWidth="2" />

        {/* Left free throw line - moved from x=200 to x=170 */}
        <line x1="10" y1="315" x2="170" y2="315" stroke="#000" strokeWidth="2" />

        {/* Left free throw circle - moved from x=200 to x=170 */}
        <circle cx="170" cy="250" r="60" fill="none" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />

        {/* Left basket */}
        <circle cx="40" cy="250" r="7.5" fill="none" stroke="#000" strokeWidth="2" />
        <line x1="10" y1="250" x2="40" y2="250" stroke="#000" strokeWidth="2" />

        {/* Left three-point line - adjusted to match standard proportions */}
        <path
          d="M 10,90 L 10,410 M 10,90 C 150,90 237.5,160 237.5,250 C 237.5,340 150,410 10,410"
          fill="none"
          stroke="#000"
          strokeWidth="2"
        />

        {/* RIGHT HALF COURT */}
        {/* Right key (paint) - reduced width from 190 to 160 */}
        <rect x="770" y="185" width="160" height="130" fill="none" stroke="#000" strokeWidth="2" />

        {/* Right free throw line - moved from x=740 to x=770 */}
        <line x1="770" y1="315" x2="930" y2="315" stroke="#000" strokeWidth="2" />

        {/* Right free throw circle - moved from x=740 to x=770 */}
        <circle cx="770" cy="250" r="60" fill="none" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />

        {/* Right basket */}
        <circle cx="900" cy="250" r="7.5" fill="none" stroke="#000" strokeWidth="2" />
        <line x1="900" y1="250" x2="930" y2="250" stroke="#000" strokeWidth="2" />

        {/* Right three-point line - adjusted to match standard proportions */}
        <path
          d="M 930,90 L 930,410 M 930,90 C 790,90 702.5,160 702.5,250 C 702.5,340 790,410 930,410"
          fill="none"
          stroke="#000"
          strokeWidth="2"
        />
      </svg>
      {selectedPlayerForFouls && (
        <PlayerFoulsModal
          player={selectedPlayerForFouls}
          onClose={handleCloseFoulsModal}
          onUpdateFouls={handleUpdateFouls}
        />
      )}
    </>
  )
}

export default BasketballCourt


