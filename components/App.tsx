"use client"

import "./App.css"
import { useState, createContext, useEffect } from "react"
import CoachingBoard from "./CoachingBoard"
import PlayerManagement from "./PlayerManagement"
import LineupSelectionModal from "./LineupSelectionModal"
import TacticManagement from "./TacticManagement"
import PlayerStatsModal from "./PlayerStatsModal"
import RulesSetup from "./RulesSetup"
import useScreenOrientation from "@/hooks/useScreenOrientation"
import ProgressBar from "./ProgressBar"
import ExpandableMenu from "./ExpandableMenu"
import TeamSetup from "./TeamSetup"

// Create context for global state management
export const AppContext = createContext(null)

// Update the App component to handle multiple teams
export default function App() {
  // Screen orientation
  const { screenSize, orientation } = useScreenOrientation()

  // Main state
  const [teams, setTeams] = useState([])
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [players, setPlayers] = useState([])
  const [lineups, setLineups] = useState([])
  const [currentLineup, setCurrentLineup] = useState(null)
  const [tactics, setTactics] = useState([])
  const [currentTactic, setCurrentTactic] = useState(null)
  const [playerStats, setPlayerStats] = useState({})
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState(null)

  // Modal states
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showLineupModal, setShowLineupModal] = useState(false)
  const [showTacticModal, setShowTacticModal] = useState(false)
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false)

  // Get active team
  const activeTeam = teams.find((team) => team.id === activeTeamId) || null

  // Check if setup is complete to determine whether to show progress bar or expandable menu
  const isSetupComplete =
    teams.length > 0 &&
    players.filter((player) => player.teamId === activeTeamId).length > 0 &&
    lineups.filter((lineup) => lineup.teamId === activeTeamId).length > 0 &&
    (activeTeam?.competitionLevel !== "National" || activeTeam?.rules !== undefined)

  // Calculate total classification for current lineup
  const calculateTotalClassification = () => {
    if (!currentLineup || !players.length) return 0

    const lineupPlayers = currentLineup.playerIds.map((id) => players.find((player) => player.id === id))

    return lineupPlayers.reduce((sum, player) => (player ? sum + Number.parseFloat(player.classification) : sum), 0)
  }

  // Switch to a different team
  const switchTeam = (teamId) => {
    setActiveTeamId(teamId)

    // Reset lineups and tactics when switching teams
    setCurrentLineup(null)
    setCurrentTactic(null)
  }

  // Initialize player stats
  const initializePlayerStats = (playerId) => {
    if (!playerStats[playerId]) {
      setPlayerStats((prev) => ({
        ...prev,
        [playerId]: {
          points: 0,
          rebounds: 0,
          assists: 0,
          turnovers: 0,
          fouls: 0,
        },
      }))
    }
  }

  // Check if we should show the initial team setup modal
  useEffect(() => {
    let initialTeamSetup = false
    if (teams.length === 0) {
      initialTeamSetup = true
    }
    setShowTeamModal(initialTeamSetup)
  }, [teams])

  // Initialize player stats for all players
  useEffect(() => {
    players.forEach((player) => {
      initializePlayerStats(player.id)
    })
  }, [players])

  // Open player stats modal
  const openPlayerStatsModal = (player) => {
    initializePlayerStats(player.id)
    setSelectedPlayerForStats(player)
    setShowPlayerStatsModal(true)
  }

  // Get lineup-related tactics
  const getLineupTactics = () => {
    if (!currentLineup) return []
    return tactics.filter((tactic) => tactic.lineupId === currentLineup.id && tactic.teamId === activeTeamId)
  }

  return (
    <AppContext.Provider
      value={{
        teams,
        setTeams,
        activeTeam,
        activeTeamId,
        setActiveTeamId,
        switchTeam,
        players,
        setPlayers,
        lineups,
        setLineups,
        currentLineup,
        setCurrentLineup,
        tactics,
        setTactics,
        currentTactic,
        setCurrentTactic,
        playerStats,
        setPlayerStats,
        showTeamModal,
        setShowTeamModal,
        showPlayerModal,
        setShowPlayerModal,
        showRulesModal,
        setShowRulesModal,
        showLineupModal,
        setShowLineupModal,
        showTacticModal,
        setShowTacticModal,
        openPlayerStatsModal,
      }}
    >
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <div className="app-title-container">
              <div className="app-title-content">
                <h1 className="app-title">
                  Court<span className="title-360">360</span>
                </h1>
                <div className="title-accent"></div>
                <span className="app-subtitle">WHEELCHAIR BASKETBALL TEAM MANAGER</span>
              </div>
              {activeTeam && (
                <>
                  <span className="team-badge">{activeTeam.name} Team</span>
                  <span className="classification-limit-chip">
                    {activeTeam.competitionLevel}
                    {activeTeam.competitionLevel === "International"
                      ? " Limit: 14.0"
                      : activeTeam.competitionLevel === "Eurocup"
                        ? " Limit: 14.5"
                        : activeTeam.rules
                          ? ` Limit: ${activeTeam.rules.maxPointsAllowed.toFixed(1)}`
                          : " Limit: TBD"}
                  </span>
                </>
              )}
            </div>

            {/* Team selection dropdown */}
            {teams.length > 1 && (
              <div className="team-switcher">
                <select
                  className="team-dropdown"
                  value={activeTeamId || ""}
                  onChange={(e) => switchTeam(e.target.value)}
                >
                  <option value="" disabled>
                    Select Team
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Show either Progress Bar or Expandable Menu based on setup completion */}
        {!isSetupComplete ? <ProgressBar /> : <ExpandableMenu />}

        <main className="app-main">
          <CoachingBoard
            players={players.filter((player) => player.teamId === activeTeamId)}
            currentLineup={currentLineup}
            lineupTactics={getLineupTactics()}
            disabled={!activeTeam}
            activeTeamId={activeTeamId}
            openPlayerStatsModal={openPlayerStatsModal}
          />
        </main>

        {/* Modals */}
        {showTeamModal && <TeamSetup onClose={() => setShowTeamModal(false)} />}
        {showPlayerModal && <PlayerManagement onClose={() => setShowPlayerModal(false)} />}
        {showRulesModal && <RulesSetup onClose={() => setShowRulesModal(false)} />}
        {showLineupModal && <LineupSelectionModal onClose={() => setShowLineupModal(false)} />}
        {showTacticModal && <TacticManagement onClose={() => setShowTacticModal(false)} />}
        {showPlayerStatsModal && selectedPlayerForStats && (
          <PlayerStatsModal player={selectedPlayerForStats} onClose={() => setShowPlayerStatsModal(false)} />
        )}
      </div>
    </AppContext.Provider>
  )
}

