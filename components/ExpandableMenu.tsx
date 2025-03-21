"use client"

import { useContext, useState } from "react"
import { AppContext } from "./App"
import "./ExpandableMenu.css"

const ExpandableMenu = () => {
  const {
    teams,
    players,
    lineups,
    tactics,
    activeTeamId,
    activeTeam,
    setShowTeamModal,
    setShowPlayerModal,
    setShowRulesModal,
    setShowLineupModal,
    setShowTacticModal,
  } = useContext(AppContext)

  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate counts for each section
  const teamCount = teams.length
  const playerCount = players.filter((player) => player.teamId === activeTeamId).length
  const lineupCount = lineups.filter((lineup) => lineup.teamId === activeTeamId).length
  const tacticCount = tactics.filter((tactic) => tactic.teamId === activeTeamId).length

  // Check if competition level is National - fix the case sensitivity issue
  const isNationalLevel = activeTeam?.competitionLevel === "National"

  const toggleMenu = () => {
    setIsExpanded(!isExpanded)
  }

  const handleSectionClick = (action) => {
    switch (action) {
      case "teams":
        setShowTeamModal(true)
        break
      case "players":
        setShowPlayerModal(true)
        break
      case "rules":
        setShowRulesModal(true)
        break
      case "lineups":
        setShowLineupModal(true)
        break
      case "tactics":
        setShowTacticModal(true)
        break
    }
    setIsExpanded(false)
  }

  return (
    <div className={`expandable-menu-container ${isExpanded ? "expanded" : ""}`}>
      <button
        className="menu-toggle-button"
        onClick={toggleMenu}
        aria-expanded={isExpanded}
        aria-label="Toggle navigation menu"
      >
        <span className="menu-title">{isExpanded ? "CLOSE MENU" : "MENU"}</span>
        <span className="menu-toggle-icon">{isExpanded ? "−" : "+"}</span>
      </button>

      {isExpanded && (
        <div className="menu-sections-container">
          <div className="menu-section" onClick={() => handleSectionClick("teams")}>
            <div className="section-header">TEAMS</div>
            <div className="section-line"></div>
            <div className="section-count">{teamCount}</div>
            <div className="section-add">+</div>
          </div>

          {isNationalLevel && (
            <div className="menu-section" onClick={() => handleSectionClick("rules")}>
              <div className="section-header">RULES</div>
              <div className="section-line"></div>
              <div className="section-count">1</div>
              <div className="section-add">+</div>
            </div>
          )}

          <div className="menu-section" onClick={() => handleSectionClick("players")}>
            <div className="section-header">PLAYERS</div>
            <div className="section-line"></div>
            <div className="section-count">{playerCount}</div>
            <div className="section-add">+</div>
          </div>

          <div className="menu-section" onClick={() => handleSectionClick("lineups")}>
            <div className="section-header">LINEUPS</div>
            <div className="section-line"></div>
            <div className="section-count">{lineupCount}</div>
            <div className="section-add">+</div>
          </div>

          <div className="menu-section" onClick={() => handleSectionClick("tactics")}>
            <div className="section-header">TACTICS</div>
            <div className="section-line"></div>
            <div className="section-count">{tacticCount}</div>
            <div className="section-add">+</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpandableMenu

