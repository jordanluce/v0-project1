"use client"

import "./TeamSetup.css"
import { useState, useContext } from "react"
import { AppContext } from "./App"

const TeamSetup = ({ onClose }) => {
  const { teams, setTeams, activeTeamId, setActiveTeamId, setShowRulesModal } = useContext(AppContext)

  const [teamName, setTeamName] = useState("")
  const [competitionLevel, setCompetitionLevel] = useState("National")
  const [editingTeamId, setEditingTeamId] = useState(null)

  // Initialize form for editing
  const initializeEditForm = (team) => {
    setTeamName(team.name)
    setCompetitionLevel(team.competitionLevel)
    setEditingTeamId(team.id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!teamName.trim()) {
      alert("Please enter a team name")
      return
    }

    if (editingTeamId) {
      // Update existing team
      const updatedTeams = teams.map((team) =>
        team.id === editingTeamId
          ? {
              ...team,
              name: teamName,
              competitionLevel,
            }
          : team,
      )
      setTeams(updatedTeams)
    } else {
      // Create new team
      const newTeam = {
        id: Date.now().toString(),
        name: teamName,
        competitionLevel,
      }

      const updatedTeams = [...teams, newTeam]
      setTeams(updatedTeams)

      // Set as active team if it's the first one or no active team
      if (teams.length === 0 || !activeTeamId) {
        setActiveTeamId(newTeam.id)
      }
    }

    // Reset form
    setTeamName("")
    setCompetitionLevel("National")
    setEditingTeamId(null)

    // Close modal if creating a new team
    if (!editingTeamId) {
      onClose()
    }
  }

  const handleDelete = (teamId) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      const updatedTeams = teams.filter((team) => team.id !== teamId)
      setTeams(updatedTeams)

      // Update active team if it's the one being deleted
      if (activeTeamId === teamId) {
        setActiveTeamId(updatedTeams.length > 0 ? updatedTeams[0].id : null)
      }

      // Reset form if editing the deleted team
      if (editingTeamId === teamId) {
        setTeamName("")
        setCompetitionLevel("National")
        setEditingTeamId(null)
      }
    }
  }

  const setAsActive = (teamId) => {
    setActiveTeamId(teamId)
  }

  const openRulesSetup = (teamId) => {
    setActiveTeamId(teamId)
    setShowRulesModal(true)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{teams.length > 0 ? "Manage Teams" : "Create Team"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="team-form">
          <div className="form-group">
            <label htmlFor="teamName">Team Name</label>
            <input id="teamName" type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="competitionLevel">Competition Level</label>
            <select
              id="competitionLevel"
              value={competitionLevel}
              onChange={(e) => setCompetitionLevel(e.target.value)}
            >
              <option value="International">International (Max: 14.0)</option>
              <option value="National">National (Customizable Rules)</option>
              <option value="Eurocup">Eurocup (Max: 14.5)</option>
            </select>
          </div>

          <div className="form-actions">
            {editingTeamId && (
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  setTeamName("")
                  setCompetitionLevel("National")
                  setEditingTeamId(null)
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="action-button">
              {editingTeamId ? "Update Team" : "Create Team"}
            </button>
          </div>
        </form>

        {teams.length > 0 && (
          <div className="teams-list">
            <h3 style={{ marginBottom: "1rem", color: "#ffd700" }}>Teams</h3>
            <div className="teams-list-table">
              <div className="teams-list-header">
                <div className="team-column name-column">Team Name</div>
                <div className="team-column level-column">Competition Level</div>
                <div className="team-column actions-column">Actions</div>
              </div>
              {teams.map((team) => (
                <div key={team.id} className={`team-row ${activeTeamId === team.id ? "active" : ""}`}>
                  <div className="team-column name-column">{team.name}</div>
                  <div className="team-column level-column">
                    <span className="competition-level-badge">{team.competitionLevel}</span>
                  </div>
                  <div className="team-column actions-column">
                    <button className="team-action-button edit-button" onClick={() => initializeEditForm(team)}>
                      Edit
                    </button>
                    <button className="team-action-button delete-button" onClick={() => handleDelete(team.id)}>
                      Delete
                    </button>
                    <button
                      className={`team-action-button active-button ${activeTeamId === team.id ? "is-active" : ""}`}
                      onClick={() => setAsActive(team.id)}
                      disabled={activeTeamId === team.id}
                    >
                      {activeTeamId === team.id ? "Active" : "Set"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamSetup

