// Update the ProgressBar component to include the Rules step
// Only showing the relevant parts that need to be changed

"use client"

import { useContext } from "react"
import { AppContext } from "./App"
import "./ProgressBar.css"

const ProgressBar = () => {
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

  // Determine step status
  const hasTeams = teams.length > 0
  const hasPlayers = players.filter((player) => player.teamId === activeTeamId).length > 0
  const hasRules = activeTeam?.competitionLevel !== "National" || activeTeam?.rules !== undefined
  const hasLineups = lineups.filter((lineup) => lineup.teamId === activeTeamId).length > 0
  const hasTactics = tactics.filter((tactic) => tactic.teamId === activeTeamId).length > 0

  // Calculate progress percentage - now conditionally based on competition level
  const calculateProgress = () => {
    let progress = 0
    let totalSteps = 4 // Default for National teams (Teams, Rules, Players, Lineups)

    // For non-National teams, we only have 3 steps (Teams, Players, Lineups)
    if (activeTeam?.competitionLevel !== "National") {
      totalSteps = 3
    }

    if (hasTeams) progress += 1
    // Only count Rules step for National teams
    if (hasRules && activeTeam?.competitionLevel === "National") progress += 1
    if (hasPlayers) progress += 1
    if (hasLineups) progress += 1

    return Math.floor((progress / totalSteps) * 100)
  }

  // Update the handleStepClick function to remove the tactics case

  // Handle step click
  const handleStepClick = (step) => {
    // Don't do anything if the step is locked
    if (
      (step === "rules" && !hasTeams) ||
      (step === "players" && (!hasTeams || (activeTeam?.competitionLevel === "National" && !hasRules))) ||
      (step === "lineups" && !hasPlayers)
      // Removed the check for tactics
    ) {
      return
    }

    // Open the appropriate modal
    switch (step) {
      case "teams":
        setShowTeamModal(true)
        break
      case "rules":
        setShowRulesModal(true)
        break
      case "players":
        setShowPlayerModal(true)
        break
      case "lineups":
        setShowLineupModal(true)
        break
      // Removed the tactics case
    }
  }

  // Update the getStepClasses, getLabelClasses, getDescriptionClasses, getStatusInfo, and getButtonClass functions
  // to remove the tactics case

  // Determine step classes
  const getStepClasses = (step) => {
    let classes = "step-circle"

    if (step === "teams") {
      if (hasTeams) classes += " completed"
      else classes += " active"
    } else if (step === "rules") {
      if (!hasTeams) classes += " locked"
      else if (hasRules) classes += " completed"
      else classes += " active"
    } else if (step === "players") {
      if (!hasTeams || (activeTeam?.competitionLevel === "National" && !hasRules)) classes += " locked"
      else if (hasPlayers) classes += " completed"
      else classes += " active"
    } else if (step === "lineups") {
      if (!hasPlayers) classes += " locked"
      else if (hasLineups) classes += " completed"
      else classes += " active"
    }
    // Removed the tactics case

    return classes
  }

  // Determine label classes
  const getLabelClasses = (step) => {
    let classes = "step-label"

    if (step === "teams") {
      if (hasTeams) classes += " completed"
      else classes += " active"
    } else if (step === "rules") {
      if (!hasTeams) classes += " locked"
      else if (hasRules) classes += " completed"
      else classes += " active"
    } else if (step === "players") {
      if (!hasTeams || (activeTeam?.competitionLevel === "National" && !hasRules)) classes += " locked"
      else if (hasPlayers) classes += " completed"
      else classes += " active"
    } else if (step === "lineups") {
      if (!hasPlayers) classes += " locked"
      else if (hasLineups) classes += " completed"
      else classes += " active"
    }
    // Removed the tactics case

    return classes
  }

  // Determine description classes
  const getDescriptionClasses = (step) => {
    let classes = "step-description"

    if (step === "teams") {
      if (hasTeams) classes += " completed"
      else classes += " active"
    } else if (step === "rules") {
      if (!hasTeams) classes += " locked"
      else if (hasRules) classes += " completed"
      else classes += " active"
    } else if (step === "players") {
      if (!hasTeams || (activeTeam?.competitionLevel === "National" && !hasRules)) classes += " locked"
      else if (hasPlayers) classes += " completed"
      else classes += " active"
    } else if (step === "lineups") {
      if (!hasPlayers) classes += " locked"
      else if (hasLineups) classes += " completed"
      else classes += " active"
    }
    // Removed the tactics case

    return classes
  }

  // Get status text and class
  const getStatusInfo = (step) => {
    let text = ""
    let statusClass = "step-status"

    if (step === "teams") {
      if (hasTeams) {
        text = "Completed"
        statusClass += " completed"
      } else {
        text = "Start Here"
        statusClass += " active"
      }
    } else if (step === "rules") {
      if (!hasTeams) {
        text = "Locked"
        statusClass += " locked"
      } else if (hasRules) {
        text = "Completed"
        statusClass += " completed"
      } else {
        text = "Current Step"
        statusClass += " active"
      }
    } else if (step === "players") {
      if (!hasTeams || (activeTeam?.competitionLevel === "National" && !hasRules)) {
        text = "Locked"
        statusClass += " locked"
      } else if (hasPlayers) {
        text = "Completed"
        statusClass += " completed"
      } else {
        text = "Current Step"
        statusClass += " active"
      }
    } else if (step === "lineups") {
      if (!hasPlayers) {
        text = "Locked"
        statusClass += " locked"
      } else if (hasLineups) {
        text = "Completed"
        statusClass += " completed"
      } else {
        text = "Current Step"
        statusClass += " active"
      }
    }
    // Removed the tactics case

    return { text, statusClass }
  }

  // Get button class
  const getButtonClass = (step) => {
    let classes = "step-button"

    if (
      (step === "rules" && !hasTeams) ||
      (step === "players" && (!hasTeams || (activeTeam?.competitionLevel === "National" && !hasRules))) ||
      (step === "lineups" && !hasPlayers)
      // Removed the tactics case
    ) {
      classes += " locked"
    }

    return classes
  }

  // If all steps are complete, don't show the progress bar
  if (hasTeams && hasPlayers && hasLineups && (activeTeam?.competitionLevel !== "National" || hasRules)) {
    return null
  }

  // Otherwise, render the progress bar
  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3 className="progress-title">
          <span className="progress-title-accent"></span>
          Setup Progress
        </h3>
        <div className="progress-percentage">{calculateProgress()}% Complete</div>
      </div>

      {/* Update the progress steps rendering to change the order for National teams */}
      {/* Reorder the steps in the progress-steps div */}
      <div className="progress-steps">
        <div className="progress-line">
          <div className="progress-line-fill" style={{ width: `${calculateProgress()}%` }}></div>
        </div>

        <div className="progress-step">
          <button className={getButtonClass("teams")} onClick={() => handleStepClick("teams")}>
            <div className={getStepClasses("teams")}>
              <span className="step-text">{hasTeams ? "✓" : "1"}</span>
            </div>
            <div className={getLabelClasses("teams")}>TEAMS</div>
            <div className={getDescriptionClasses("teams")}>Create your wheelchair basketball teams</div>
            <div className={getStatusInfo("teams").statusClass}>{getStatusInfo("teams").text}</div>
          </button>
        </div>

        {/* Only show Rules step for National teams */}
        {activeTeam?.competitionLevel === "National" && (
          <div className="progress-step">
            <button className={getButtonClass("rules")} onClick={() => handleStepClick("rules")}>
              <div className={getStepClasses("rules")}>
                <span className="step-text">{hasRules ? "✓" : hasTeams ? "2" : ""}</span>
              </div>
              <div className={getLabelClasses("rules")}>RULES</div>
              <div className={getDescriptionClasses("rules")}>Configure competition rules</div>
              <div className={getStatusInfo("rules").statusClass}>{getStatusInfo("rules").text}</div>
            </button>
          </div>
        )}

        <div className="progress-step">
          <button className={getButtonClass("players")} onClick={() => handleStepClick("players")}>
            <div className={getStepClasses("players")}>
              <span className="step-text">
                {hasPlayers ? "✓" : hasTeams ? (activeTeam?.competitionLevel === "National" ? "3" : "2") : ""}
              </span>
            </div>
            <div className={getLabelClasses("players")}>PLAYERS</div>
            <div className={getDescriptionClasses("players")}>Add players with classifications</div>
            <div className={getStatusInfo("players").statusClass}>{getStatusInfo("players").text}</div>
          </button>
        </div>

        <div className="progress-step">
          <button className={getButtonClass("lineups")} onClick={() => handleStepClick("lineups")}>
            <div className={getStepClasses("lineups")}>
              <span className="step-text">
                {hasLineups ? "✓" : hasPlayers ? (activeTeam?.competitionLevel === "National" ? "4" : "3") : ""}
              </span>
            </div>
            <div className={getLabelClasses("lineups")}>LINEUPS</div>
            <div className={getDescriptionClasses("lineups")}>Create team lineups with your players</div>
            <div className={getStatusInfo("lineups").statusClass}>{getStatusInfo("lineups").text}</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar

