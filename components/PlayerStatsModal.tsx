"use client"

// Make sure CSS import is at the top of the file
import "./PlayerStatsModal.css"

import { useContext } from "react"
import { AppContext } from "./App"

const PlayerStatsModal = ({ player, onClose }) => {
  const { playerStats, setPlayerStats } = useContext(AppContext)

  // Get player stats or initialize if not present
  const stats = playerStats[player.id] || {
    points: 0,
    rebounds: 0,
    assists: 0,
    turnovers: 0,
    fouls: 0,
  }

  // Update a specific stat
  const updateStat = (stat, amount) => {
    // Don't allow negative values
    const newValue = Math.max(0, stats[stat] + amount)

    setPlayerStats((prev) => ({
      ...prev,
      [player.id]: {
        ...(prev[player.id] || {}), // Ensure we have an object to spread
        [stat]: newValue,
      },
    }))
  }

  // Handle modal close without affecting lineup selection
  const handleClose = (e) => {
    if (e) {
      e.stopPropagation()
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content player-stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Player Stats: {player.name} {player.number && `(#${player.number})`}
          </h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="player-stats-content">
          <div className="player-info">
            <div className="player-classification">Classification: {player.classification}</div>
          </div>

          {stats.fouls >= 5 && <div className="foul-alert fouled-out-alert">Player has fouled out (5 fouls)</div>}
          {stats.fouls >= 3 && stats.fouls < 5 && (
            <div className="foul-alert foul-warning-alert">Foul warning: {stats.fouls} fouls</div>
          )}

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-name">Points</div>
              <div className="stat-controls">
                <button
                  className="stat-button decrement"
                  onClick={() => updateStat("points", -1)}
                  disabled={stats.points === 0}
                >
                  -
                </button>
                <div className="stat-value">{stats.points}</div>
                <button className="stat-button increment" onClick={() => updateStat("points", 1)}>
                  +
                </button>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-name">Fouls</div>
              <div className="stat-controls">
                <button
                  className="stat-button decrement"
                  onClick={() => updateStat("fouls", -1)}
                  disabled={stats.fouls === 0}
                >
                  -
                </button>
                <div
                  className={`stat-value ${stats.fouls >= 5 ? "fouled-out" : stats.fouls >= 3 ? "foul-warning" : ""}`}
                >
                  {stats.fouls}
                </div>
                <button className="stat-button increment" onClick={() => updateStat("fouls", 1)}>
                  +
                </button>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-name">Rebounds</div>
              <div className="stat-controls">
                <button
                  className="stat-button decrement"
                  onClick={() => updateStat("rebounds", -1)}
                  disabled={stats.rebounds === 0}
                >
                  -
                </button>
                <div className="stat-value">{stats.rebounds}</div>
                <button className="stat-button increment" onClick={() => updateStat("rebounds", 1)}>
                  +
                </button>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-name">Turnovers</div>
              <div className="stat-controls">
                <button
                  className="stat-button decrement"
                  onClick={() => updateStat("turnovers", -1)}
                  disabled={stats.turnovers === 0}
                >
                  -
                </button>
                <div className="stat-value">{stats.turnovers}</div>
                <button className="stat-button increment" onClick={() => updateStat("turnovers", 1)}>
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-button" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerStatsModal

