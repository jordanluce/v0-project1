"use client"

import { useContext } from "react"
import { AppContext } from "./App"
import "./TacticDisplayModal.css"

const TacticDisplayModal = ({ tactic, onClose }) => {
  const { players, lineups } = useContext(AppContext)

  // Find the lineup associated with this tactic
  const lineup = lineups.find((l) => l.id === tactic.lineupId)

  // Get the players in this lineup
  const lineupPlayers = lineup
    ? lineup.playerIds.map((id) => players.find((player) => player.id === id)).filter(Boolean)
    : []

  return (
    <div className="tactic-display-modal-overlay" onClick={onClose}>
      <div className="tactic-display-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tactic-display-header">
          <h3>{tactic.name}</h3>
          <button className="tactic-display-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="tactic-display-content">
          <div className="tactic-display-description">
            {tactic.description ? (
              <p>{tactic.description}</p>
            ) : (
              <p className="no-description-message">No description provided for this tactic.</p>
            )}
          </div>

          {lineup && (
            <div className="tactic-display-lineup">
              <div className="tactic-display-lineup-header">
                <span className="tactic-display-lineup-title">Lineup: {lineup.name}</span>
                <span className="tactic-display-lineup-classification">
                  {lineup.totalClassification.toFixed(1)} pts
                </span>
              </div>

              <div className="tactic-display-players">
                {lineupPlayers.map((player) => (
                  <div key={player.id} className="tactic-display-player">
                    <span className="tactic-display-player-name">{player.name}</span>
                    <span className="tactic-display-player-classification">{player.classification}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TacticDisplayModal

