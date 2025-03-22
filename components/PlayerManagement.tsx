"use client"

import "./PlayerManagement.css"
import { useState, useContext } from "react"
import { AppContext } from "./App"

const PlayerManagement = ({ onClose }) => {
  const { players, setPlayers, activeTeamId, activeTeam } = useContext(AppContext)

  const [playerName, setPlayerName] = useState("")
  const [playerClassification, setPlayerClassification] = useState("1.0")
  const [playerCategory, setPlayerCategory] = useState("Senior") // Senior, Junior, Female, Junior Female
  const [isForeignPlayer, setIsForeignPlayer] = useState(false) // For National teams: Foreign Player checkbox
  const [editingPlayerId, setEditingPlayerId] = useState(null)

  // Get only players for the active team
  const teamPlayers = players.filter((player) => player.teamId === activeTeamId)

  // Check if team is international
  const isInternational = activeTeam?.competitionLevel === "International"
  const isNational = activeTeam?.competitionLevel === "National"
  const isEuroCup = activeTeam?.competitionLevel === "Eurocup"

  // Initialize form for editing
  const initializeEditForm = (player) => {
    setPlayerName(player.name)
    setPlayerClassification(player.classification)
    setIsForeignPlayer(player.isForeign || false)

    // Set player category based on the stored data or derive it from gender/age and isAbleBody
    if (player.category) {
      setPlayerCategory(player.category)
    } else if (player.isAbleBody && player.gender === "female") {
      setPlayerCategory("Female Able-Bodied")
    } else if (player.gender === "female" && player.ageCategory === "junior") {
      setPlayerCategory("Junior Female")
    } else if (player.gender === "female") {
      setPlayerCategory("Female")
    } else if (player.ageCategory === "junior") {
      setPlayerCategory("Junior")
    } else {
      setPlayerCategory("Senior")
    }

    setEditingPlayerId(player.id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!playerName.trim()) {
      alert("Please enter a player name")
      return
    }

    // Determine gender and age category based on competition level
    let gender = "male"
    let ageCategory = "senior"
    let category = "Senior"
    let isAbleBody = false

    // Apply categories for EuroCup and National teams
    if (isEuroCup || isNational) {
      if (
        playerCategory === "Female" ||
        playerCategory === "Junior Female" ||
        playerCategory === "Female Able-Bodied"
      ) {
        gender = "female"
      }

      if (playerCategory === "Junior" || playerCategory === "Junior Female") {
        ageCategory = "junior"
      }

      // Set isAbleBody flag for Able-Bodied categories
      if (playerCategory === "Female Able-Bodied" || playerCategory === "Male Able-Bodied") {
        isAbleBody = true
      }

      category = playerCategory

      // Auto-assign Male Able-Bodied category if classification is 5.0 and gender is male
      if (playerClassification === "5.0" && gender === "male" && category === "Senior") {
        category = "Male Able-Bodied"
        isAbleBody = true
      }

      // Auto-assign Female Able-Bodied category if classification is 5.0 and gender is female
      if (playerClassification === "5.0" && gender === "female" && category === "Female") {
        category = "Female Able-Bodied"
        isAbleBody = true
      }
    }

    // Set classification to 5.0 for able-bodied players
    let finalClassification = playerClassification
    if (isAbleBody) {
      finalClassification = "5.0"
    }

    if (editingPlayerId) {
      // Update existing player
      const updatedPlayers = players.map((player) =>
        player.id === editingPlayerId
          ? {
              ...player,
              name: playerName,
              classification: finalClassification,
              gender: gender,
              ageCategory: ageCategory,
              category: category,
              isForeign: isForeignPlayer,
              isAbleBody: isAbleBody,
            }
          : player,
      )
      setPlayers(updatedPlayers)
    } else {
      // Create new player
      const newPlayer = {
        id: Date.now().toString(),
        teamId: activeTeamId,
        name: playerName,
        classification: finalClassification,
        gender: gender,
        ageCategory: ageCategory,
        category: category,
        isForeign: isForeignPlayer,
        isAbleBody: isAbleBody,
      }

      setPlayers([...players, newPlayer])
    }

    // Reset form
    setPlayerName("")
    setPlayerClassification("1.0")
    setPlayerCategory("Senior")
    setIsForeignPlayer(false)
    setEditingPlayerId(null)
  }

  const handleDelete = (playerId) => {
    if (window.confirm("Are you sure you want to delete this player?")) {
      setPlayers(players.filter((player) => player.id !== playerId))

      // Reset form if editing the deleted player
      if (editingPlayerId === playerId) {
        setPlayerName("")
        setPlayerClassification("1.0")
        setPlayerCategory("Senior")
        setIsForeignPlayer(false)
        setEditingPlayerId(null)
      }
    }
  }

  // Calculate bonus points based on gender and age category
  const calculateBonusPoints = (category) => {
    if (isEuroCup) {
      switch (category) {
        case "Female":
          return 1.5
        case "Junior":
          return 1.0
        case "Junior Female":
          return 2.0
        default:
          return 0
      }
    } else if (isNational && activeTeam?.rules) {
      switch (category) {
        case "Female":
          return activeTeam.rules.femaleBonus
        case "Junior":
          return activeTeam.rules.juniorBonus
        case "Junior Female":
          return activeTeam.rules.juniorFemaleBonus
        case "Female Able-Bodied":
          return activeTeam.rules.femaleAbleBodyBonus || 0
        default:
          return 0
      }
    }
    return 0
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Players - {activeTeam?.name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="playerName">Player Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="playerClassification">Classification</label>
            <select
              id="playerClassification"
              value={playerClassification}
              onChange={(e) => setPlayerClassification(e.target.value)}
              disabled={false}
            >
              <option value="1.0">1.0</option>
              <option value="1.5">1.5</option>
              <option value="2.0">2.0</option>
              <option value="2.5">2.5</option>
              <option value="3.0">3.0</option>
              <option value="3.5">3.5</option>
              <option value="4.0">4.0</option>
              <option value="4.5">4.5</option>
              {isNational && <option value="5.0">5.0</option>}
            </select>
          </div>

          {/* Player Category field - only show for EuroCup and National teams */}
          {(isEuroCup || isNational) && (
            <div className="form-group">
              <label htmlFor="playerCategory">Player Category</label>
              <select id="playerCategory" value={playerCategory} onChange={(e) => setPlayerCategory(e.target.value)}>
                <option value="Senior">Senior</option>
                <option value="Junior">Junior</option>
                <option value="Female">Female</option>
                <option value="Junior Female">Junior Female</option>
                <option value="Female Able-Bodied">Female Able-Bodied</option>
                <option value="Male Able-Bodied">Male Able-Bodied</option>
              </select>

              {playerCategory !== "Senior" && (
                <div className="bonus-info">
                  <span className="bonus-badge">+{calculateBonusPoints(playerCategory).toFixed(1)} points</span>
                  <span className="bonus-explanation">
                    {playerCategory === "Female"
                      ? "Female players add bonus points to lineup limit"
                      : playerCategory === "Junior"
                        ? "Junior players add bonus points to lineup limit"
                        : playerCategory === "Junior Female"
                          ? "Junior female players add bonus points to lineup limit"
                          : playerCategory === "Female Able-Bodied"
                            ? "Female able-bodied players add bonus points to lineup limit"
                            : "Male able-bodied players do not add bonus points"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* National team specific fields */}
          {isNational && (
            <div className="form-group checkbox-group">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="foreignPlayer"
                  checked={isForeignPlayer}
                  onChange={(e) => setIsForeignPlayer(e.target.checked)}
                />
                <label htmlFor="foreignPlayer" className="checkbox-label">
                  Foreign Player
                </label>
              </div>
              <span className="checkbox-help">
                Mark if this player is considered a foreign player under national rules
              </span>
            </div>
          )}

          <div className="form-actions">
            {editingPlayerId && (
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  setPlayerName("")
                  setPlayerClassification("1.0")
                  setPlayerCategory("Senior")
                  setIsForeignPlayer(false)
                  setEditingPlayerId(null)
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="action-button">
              {editingPlayerId ? "Update Player" : "Add Player"}
            </button>
          </div>
        </form>

        {teamPlayers.length > 0 && (
          <div className="players-list" style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#ffd700" }}>Team Players</h3>
            <div className="players-list-table">
              <div className="players-list-header">
                <div className="player-column name-column">Player Name</div>
                <div className="player-column class-column">Classification</div>
                {(isEuroCup || isNational) && (
                  <>
                    <div className="player-column category-column">Category</div>
                    <div className="player-column bonus-column">Bonus</div>
                  </>
                )}
                <div className="player-column actions-column">Actions</div>
              </div>
              {teamPlayers.map((player) => {
                const category = player.category || "Senior"
                const bonusPoints = calculateBonusPoints(category)

                return (
                  <div key={player.id} className="player-row">
                    <div className="player-column name-column">{player.name}</div>
                    <div className="player-column class-column">{player.classification}</div>
                    {(isEuroCup || isNational) && (
                      <>
                        <div className="player-column category-column">
                          <span className={`category-badge ${category.toLowerCase().replace(" ", "-")}`}>
                            {category === "Female Able-Bodied"
                              ? "FAB"
                              : category === "Male Able-Bodied"
                                ? "MAB"
                                : category}
                          </span>
                        </div>
                        <div className="player-column bonus-column">
                          {bonusPoints > 0 ? (
                            <span className="bonus-value">+{bonusPoints.toFixed(1)}</span>
                          ) : (
                            <span className="no-bonus">—</span>
                          )}
                        </div>
                      </>
                    )}
                    <div className="player-column actions-column">
                      <button
                        className="action-icon edit-icon"
                        onClick={() => initializeEditForm(player)}
                        title="Edit player"
                      />
                      <button
                        className="action-icon delete-icon"
                        onClick={() => handleDelete(player.id)}
                        title="Delete player"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerManagement


