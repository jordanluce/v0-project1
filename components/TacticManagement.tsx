"use client"

// Make sure CSS import is at the top of the file
import "./TacticManagement.css"

import { useState, useContext } from "react"
import { AppContext } from "./App"

const TacticManagement = ({ onClose }) => {
  const { lineups, tactics, setTactics, activeTeamId, activeTeam, currentTactic, setCurrentTactic } =
    useContext(AppContext)

  const [tacticName, setTacticName] = useState("")
  const [tacticDescription, setTacticDescription] = useState("")
  const [selectedLineupId, setSelectedLineupId] = useState("")
  const [editingTacticId, setEditingTacticId] = useState(null)

  // Get only lineups for the active team
  const teamLineups = lineups.filter((lineup) => lineup.teamId === activeTeamId)

  // Get only tactics for the active team
  const teamTactics = tactics.filter((tactic) => tactic.teamId === activeTeamId)

  // Initialize form for editing
  const initializeEditForm = (tactic) => {
    setTacticName(tactic.name)
    setTacticDescription(tactic.description || "")
    setSelectedLineupId(tactic.lineupId)
    setEditingTacticId(tactic.id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!tacticName.trim()) {
      alert("Please enter a tactic name")
      return
    }

    if (!selectedLineupId) {
      alert("Please select a lineup for this tactic")
      return
    }

    if (editingTacticId) {
      // Update existing tactic
      const updatedTactics = tactics.map((tactic) =>
        tactic.id === editingTacticId
          ? {
              ...tactic,
              name: tacticName,
              description: tacticDescription,
              lineupId: selectedLineupId,
            }
          : tactic,
      )
      setTactics(updatedTactics)

      // Update current tactic if it's the one being edited
      if (currentTactic && currentTactic.id === editingTacticId) {
        setCurrentTactic({
          ...currentTactic,
          name: tacticName,
          description: tacticDescription,
          lineupId: selectedLineupId,
        })
      }
    } else {
      // Create new tactic
      const newTactic = {
        id: Date.now().toString(),
        teamId: activeTeamId,
        name: tacticName,
        description: tacticDescription,
        lineupId: selectedLineupId,
      }

      setTactics([...tactics, newTactic])
    }

    // Reset form
    setTacticName("")
    setTacticDescription("")
    setSelectedLineupId("")
    setEditingTacticId(null)
  }

  const handleDelete = (tacticId) => {
    if (window.confirm("Are you sure you want to delete this tactic?")) {
      setTactics(tactics.filter((tactic) => tactic.id !== tacticId))

      // Reset current tactic if it's the one being deleted
      if (currentTactic && currentTactic.id === tacticId) {
        setCurrentTactic(null)
      }

      // Reset form if editing the deleted tactic
      if (editingTacticId === tacticId) {
        setTacticName("")
        setTacticDescription("")
        setSelectedLineupId("")
        setEditingTacticId(null)
      }
    }
  }

  const setAsActive = (tactic) => {
    setCurrentTactic(tactic)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Tactics - {activeTeam?.name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tacticName">Tactic Name</label>
            <input
              id="tacticName"
              type="text"
              value={tacticName}
              onChange={(e) => setTacticName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tacticDescription">Description (Optional)</label>
            <textarea
              id="tacticDescription"
              value={tacticDescription}
              onChange={(e) => setTacticDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="selectedLineup">Lineup</label>
            <select
              id="selectedLineup"
              value={selectedLineupId}
              onChange={(e) => setSelectedLineupId(e.target.value)}
              required
            >
              <option value="">Select a Lineup</option>
              {teamLineups.map((lineup) => (
                <option key={lineup.id} value={lineup.id}>
                  {lineup.name} ({lineup.totalClassification.toFixed(1)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            {editingTacticId && (
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  setTacticName("")
                  setTacticDescription("")
                  setSelectedLineupId("")
                  setEditingTacticId(null)
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="action-button">
              {editingTacticId ? "Update Tactic" : "Create Tactic"}
            </button>
          </div>
        </form>

        {teamTactics.length > 0 && (
          <div className="tactics-list" style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#ffd700" }}>Team Tactics</h3>
            <div className="tactics-grid">
              {teamTactics.map((tactic) => {
                const lineup = lineups.find((l) => l.id === tactic.lineupId)
                return (
                  <div key={tactic.id} className="tactic-card">
                    <div className="tactic-header">
                      <h4>{tactic.name}</h4>
                      {lineup && <span className="lineup-badge">Lineup: {lineup.name}</span>}
                    </div>

                    {tactic.description && <div className="tactic-description">{tactic.description}</div>}

                    <div className="tactic-actions">
                      <button className="action-button small" onClick={() => initializeEditForm(tactic)}>
                        Edit
                      </button>
                      <button className="action-button small" onClick={() => handleDelete(tactic.id)}>
                        Delete
                      </button>
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

export default TacticManagement

