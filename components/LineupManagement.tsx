"use client"

import "./LineupManagement.css"
import { useState, useContext, useEffect } from "react"
import { AppContext } from "./App"

const LineupManagement = ({ onClose, isEmbedded = false }) => {
  const { players, lineups, setLineups, activeTeamId, activeTeam, currentLineup, setCurrentLineup } =
    useContext(AppContext)

  const [lineupName, setLineupName] = useState("")
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [editingLineupId, setEditingLineupId] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [lastSelectedPlayer, setLastSelectedPlayer] = useState(null)
  const [isOverLimit, setIsOverLimit] = useState(false)
  const [showBonusDetails, setShowBonusDetails] = useState(false)
  const [ruleViolations, setRuleViolations] = useState([])

  // Get only players for the active team
  const teamPlayers = players.filter((player) => player.teamId === activeTeamId)

  // Get only lineups for the active team
  const teamLineups = lineups.filter((lineup) => lineup.teamId === activeTeamId)

  // Check competition level
  const isInternational = activeTeam?.competitionLevel === "International"
  const isNational = activeTeam?.competitionLevel === "National"
  const isEuroCup = activeTeam?.competitionLevel === "Eurocup"

  // Calculate bonuses based on selected players and competition level
  const calculateBonuses = () => {
    // If not EuroCup or National, return zero bonuses
    if (!isEuroCup && !isNational) {
      return {
        totalBonus: 0,
        details: [],
      }
    }

    // Get selected player objects
    const selectedPlayerObjects = selectedPlayers
      .map((id) => players.find((player) => player.id === id))
      .filter(Boolean)

    // For EuroCup, use standard EuroCup rules
    if (isEuroCup) {
      let totalBonus = 0
      let femaleCount = 0
      let juniorMaleCount = 0
      let juniorFemaleCount = 0

      selectedPlayerObjects.forEach((player) => {
        const category = player.category || "Senior"

        if (category === "Female") {
          femaleCount++
          totalBonus += 1.5
        } else if (category === "Junior") {
          juniorMaleCount++
          totalBonus += 1.0
        } else if (category === "Junior Female") {
          juniorFemaleCount++
          totalBonus += 2.0
        }
      })

      return {
        totalBonus,
        femaleCount,
        juniorMaleCount,
        juniorFemaleCount,
        details: [
          { type: "Female", count: femaleCount, bonus: femaleCount * 1.5 },
          { type: "Junior Male", count: juniorMaleCount, bonus: juniorMaleCount * 1.0 },
          { type: "Junior Female", count: juniorFemaleCount, bonus: juniorFemaleCount * 2.0 },
        ].filter((item) => item.count > 0),
      }
    }

    // For National teams, use the team's custom rules
    if (isNational && activeTeam?.rules) {
      const rules = activeTeam.rules
      let totalBonus = 0
      let femaleCount = 0
      let juniorMaleCount = 0
      let juniorFemaleCount = 0
      let femaleAbleBodyCount = 0
      let maleAbleBodyCount = 0

      // Count players by category
      selectedPlayerObjects.forEach((player) => {
        const category = player.category || "Senior"

        if (category === "Female") {
          femaleCount++
        } else if (category === "Junior") {
          juniorMaleCount++
        } else if (category === "Junior Female") {
          juniorFemaleCount++
        }

        // Count female able-bodied players
        if (player.isAbleBody && player.gender === "female") {
          femaleAbleBodyCount++
        }

        // Count male able-bodied players
        if (player.isAbleBody && player.gender === "male") {
          maleAbleBodyCount++
        }
      })

      // Apply bonuses based on team rules and limits
      // If max value is -1 (unlimited), apply bonus to all players of that category
      const femaleBonusCount = rules.maxFemales === -1 ? femaleCount : Math.min(femaleCount, rules.maxFemales)
      const juniorBonusCount = rules.maxJuniors === -1 ? juniorMaleCount : Math.min(juniorMaleCount, rules.maxJuniors)
      const juniorFemaleBonusCount =
        rules.maxJuniorFemales === -1 ? juniorFemaleCount : Math.min(juniorFemaleCount, rules.maxJuniorFemales)

      const femaleBonus = femaleBonusCount * rules.femaleBonus
      const juniorBonus = juniorBonusCount * rules.juniorBonus
      const juniorFemaleBonus = juniorFemaleBonusCount * rules.juniorFemaleBonus
      const femaleAbleBodyBonus = femaleAbleBodyCount * (rules.femaleAbleBodyBonus || 0)
      // Male able-bodied players don't get bonus points

      totalBonus = femaleBonus + juniorBonus + juniorFemaleBonus + femaleAbleBodyBonus

      return {
        totalBonus,
        femaleCount,
        juniorMaleCount,
        juniorFemaleCount,
        femaleAbleBodyCount,
        maleAbleBodyCount,
        femaleBonusCount,
        juniorBonusCount,
        juniorFemaleBonusCount,
        details: [
          {
            type: "Female",
            count: femaleCount,
            bonusCount: femaleBonusCount,
            bonusPerPlayer: rules.femaleBonus,
            bonus: femaleBonus,
          },
          {
            type: "Junior Male",
            count: juniorMaleCount,
            bonusCount: juniorBonusCount,
            bonusPerPlayer: rules.juniorBonus,
            bonus: juniorBonus,
          },
          {
            type: "Junior Female",
            count: juniorFemaleCount,
            bonusCount: juniorFemaleBonusCount,
            bonusPerPlayer: rules.juniorFemaleBonus,
            bonus: juniorFemaleBonus,
          },
          {
            type: "Female Able-Bodied",
            count: femaleAbleBodyCount,
            bonusCount: femaleAbleBodyCount,
            bonusPerPlayer: rules.femaleAbleBodyBonus || 0,
            bonus: femaleAbleBodyBonus,
          },
        ].filter((item) => item.count > 0),
      }
    }

    // Default fallback
    return {
      totalBonus: 0,
      details: [],
    }
  }

  // Calculate player bonus based on category and competition level
  const calculatePlayerBonus = (player) => {
    if (!player) return 0

    const category = player.category || "Senior"

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
      const rules = activeTeam.rules

      // Count players by category to check limits
      const selectedPlayerObjects = selectedPlayers
        .map((id) => players.find((player) => player.id === id))
        .filter(Boolean)

      let femaleCount = 0
      let juniorMaleCount = 0
      let juniorFemaleCount = 0
      let femaleAbleBodyCount = 0

      selectedPlayerObjects.forEach((p) => {
        const cat = p.category || "Senior"
        if (cat === "Female") femaleCount++
        else if (cat === "Junior") juniorMaleCount++
        else if (cat === "Junior Female") juniorFemaleCount++
        else if (cat === "Female Able-Bodied") femaleAbleBodyCount++
      })

      switch (category) {
        case "Female":
          // If maxFemales is -1 (unlimited), always apply the bonus
          return rules.maxFemales === -1 ? rules.femaleBonus : femaleCount <= rules.maxFemales ? rules.femaleBonus : 0
        case "Junior":
          // If maxJuniors is -1 (unlimited), always apply the bonus
          return rules.maxJuniors === -1
            ? rules.juniorBonus
            : juniorMaleCount <= rules.maxJuniors
              ? rules.juniorBonus
              : 0
        case "Junior Female":
          // If maxJuniorFemales is -1 (unlimited), always apply the bonus
          return rules.maxJuniorFemales === -1
            ? rules.juniorFemaleBonus
            : juniorFemaleCount <= rules.maxJuniorFemales
              ? rules.juniorFemaleBonus
              : 0
        case "Female Able-Bodied":
          // Female Able-Bodied players always get their bonus (no limit)
          return rules.femaleAbleBodyBonus || 0
        default:
          return 0
      }
    }

    return 0
  }

  // Get base max classification based on competition level
  const getBaseMaxClassification = () => {
    if (isInternational) return 14.0
    return 14.5 // Always 14.5 base for National and Eurocup
  }

  // Calculate bonuses
  const bonuses = calculateBonuses()
  const baseMaxClassification = getBaseMaxClassification()

  // Calculate adjusted max classification
  let adjustedMaxClassification = baseMaxClassification

  // For EuroCup, cap at 17.0
  if (isEuroCup) {
    adjustedMaxClassification = Math.min(baseMaxClassification + bonuses.totalBonus, 17.0)
  }
  // For National, use the team's max points allowed as the cap, but start from base 14.5
  else if (isNational && activeTeam?.rules) {
    // The adjusted max is the base (14.5) plus any bonus points, up to the maximum allowed
    adjustedMaxClassification = Math.min(baseMaxClassification + bonuses.totalBonus, activeTeam.rules.maxPointsAllowed)
  }

  // Calculate current total classification
  const currentTotalClassification = selectedPlayers.reduce((sum, playerId) => {
    const player = players.find((p) => p.id === playerId)
    return player ? sum + Number.parseFloat(player.classification) : sum
  }, 0)

  // Calculate total with bonuses
  const totalWithBonuses = currentTotalClassification + bonuses.totalBonus

  // Validate lineup against National rules
  const validateNationalRules = () => {
    if (!isNational || !activeTeam?.rules) return []

    const rules = activeTeam.rules
    const violations = []

    // Get selected player objects
    const selectedPlayerObjects = selectedPlayers
      .map((id) => players.find((player) => player.id === id))
      .filter(Boolean)

    // Check foreign players limit
    const foreignPlayers = selectedPlayerObjects.filter((p) => p.isForeign)
    if (rules.maxForeignPlayers !== -1 && foreignPlayers.length > rules.maxForeignPlayers) {
      violations.push({
        type: "foreign",
        message: `Maximum ${rules.maxForeignPlayers} foreign players allowed (currently ${foreignPlayers.length})`,
      })
    }

    // Check able-bodied players limit - count both male and female able-bodied players
    const ableBodyPlayers = selectedPlayerObjects.filter((p) => p.isAbleBody)
    if (ableBodyPlayers.length > rules.maxAbleBodyPlayers) {
      violations.push({
        type: "ableBody",
        message: `Maximum ${rules.maxAbleBodyPlayers} able-bodied players allowed (currently ${ableBodyPlayers.length})`,
      })
    }

    // Check total points limit
    if (totalWithBonuses > rules.maxPointsAllowed) {
      violations.push({
        type: "points",
        message: `Total points (${totalWithBonuses.toFixed(1)}) exceed the maximum allowed (${rules.maxPointsAllowed.toFixed(1)})`,
      })
    }

    return violations
  }

  // Check if the current selection exceeds the limit
  useEffect(() => {
    if (!activeTeam) return

    // Reset error state
    setIsOverLimit(false)
    setErrorMessage("")
    setRuleViolations([])

    // Calculate values inside the effect instead of using them as dependencies
    const currentTotal = selectedPlayers.reduce((sum, playerId) => {
      const player = players.find((p) => p.id === playerId)
      return player ? sum + Number.parseFloat(player.classification) : sum
    }, 0)

    // Calculate bonuses inside the effect
    let bonusTotal = 0
    let violations = []

    // Get selected player objects
    const selectedPlayerObjects = selectedPlayers.map((id) => players.find((p) => p.id === id)).filter(Boolean)

    // For National teams
    if (isNational && activeTeam?.rules) {
      // Calculate bonuses for National teams
      const rules = activeTeam.rules
      let femaleCount = 0,
        juniorMaleCount = 0,
        juniorFemaleCount = 0,
        femaleAbleBodyCount = 0

      selectedPlayerObjects.forEach((player) => {
        const category = player.category || "Senior"
        if (category === "Female") femaleCount++
        else if (category === "Junior") juniorMaleCount++
        else if (category === "Junior Female") juniorFemaleCount++
        if (player.isAbleBody && player.gender === "female") femaleAbleBodyCount++
      })

      const femaleBonusCount = rules.maxFemales === -1 ? femaleCount : Math.min(femaleCount, rules.maxFemales)
      const juniorBonusCount = rules.maxJuniors === -1 ? juniorMaleCount : Math.min(juniorMaleCount, rules.maxJuniors)
      const juniorFemaleBonusCount =
        rules.maxJuniorFemales === -1 ? juniorFemaleCount : Math.min(juniorFemaleCount, rules.maxJuniorFemales)

      bonusTotal =
        femaleBonusCount * rules.femaleBonus +
        juniorBonusCount * rules.juniorBonus +
        juniorFemaleBonusCount * rules.juniorFemaleBonus +
        femaleAbleBodyCount * (rules.femaleAbleBodyBonus || 0)

      // NEW VALIDATION LOGIC FOR NATIONAL
      // Check if (Total Classification - Total Bonus) exceeds 14.5
      if (currentTotal - bonusTotal > 14.5) {
        setIsOverLimit(true)
        setErrorMessage(
          `Base classification minus bonuses (${(currentTotal - bonusTotal).toFixed(1)}) exceeds the limit of 14.5. Add more bonus players or reduce classification.`,
        )
        return
      }

      // Check if total with bonuses exceeds the maximum allowed in rules
      const totalWithBonus = currentTotal
      if (totalWithBonus > activeTeam.rules.maxPointsAllowed) {
        setIsOverLimit(true)
        setErrorMessage(
          `Total classification (${totalWithBonus.toFixed(1)}) exceeds the maximum allowed (${activeTeam.rules.maxPointsAllowed.toFixed(1)}) for National competition level`,
        )
        return
      }

      // Check other National rules
      const foreignPlayers = selectedPlayerObjects.filter((p) => p.isForeign)
      const ableBodyPlayers = selectedPlayerObjects.filter((p) => p.isAbleBody)

      violations = []

      if (rules.maxForeignPlayers !== -1 && foreignPlayers.length > rules.maxForeignPlayers) {
        violations.push({
          type: "foreign",
          message: `Maximum ${rules.maxForeignPlayers} foreign players allowed (currently ${foreignPlayers.length})`,
        })
      }

      if (ableBodyPlayers.length > rules.maxAbleBodyPlayers) {
        violations.push({
          type: "ableBody",
          message: `Maximum ${rules.maxAbleBodyPlayers} able-bodied players allowed (currently ${ableBodyPlayers.length})`,
        })
      }

      if (violations.length > 0) {
        setRuleViolations(violations)
        setIsOverLimit(true)
        setErrorMessage(violations[0].message)
        return
      }
    }
    // For EuroCup
    else if (isEuroCup) {
      // Calculate bonuses for EuroCup
      selectedPlayerObjects.forEach((player) => {
        const category = player.category || "Senior"
        if (category === "Female") bonusTotal += 1.5
        else if (category === "Junior") bonusTotal += 1.0
        else if (category === "Junior Female") bonusTotal += 2.0
      })

      // NEW VALIDATION LOGIC FOR EUROCUP
      // Check if (Total Classification - Total Bonus) exceeds 14.5
      if (currentTotal - bonusTotal > 14.5) {
        setIsOverLimit(true)
        setErrorMessage(
          `Base classification minus bonuses (${(currentTotal - bonusTotal).toFixed(1)}) exceeds the limit of 14.5. Add more bonus players or reduce classification.`,
        )
        return
      }

      // Check against the 17.0 cap
      const totalWithBonus = currentTotal
      if (totalWithBonus > 17.0) {
        setIsOverLimit(true)
        setErrorMessage(
          `Total classification (${totalWithBonus.toFixed(1)}) exceeds the maximum allowed (17.0) for EuroCup competition level`,
        )
        return
      }
    }
    // For International
    else if (isInternational) {
      // Check against the 14.0 cap
      if (currentTotal > 14.0) {
        setIsOverLimit(true)
        setErrorMessage(
          `Total classification (${currentTotal.toFixed(1)}) exceeds the maximum allowed (14.0) for International competition level`,
        )
        return
      }
    }
  }, [selectedPlayers, activeTeam, players, isNational, isEuroCup, isInternational])

  // Initialize form for editing
  const initializeEditForm = (lineup) => {
    setLineupName(lineup.name)
    setSelectedPlayers(lineup.playerIds)
    setEditingLineupId(lineup.id)
    setLastSelectedPlayer(null)
    setIsOverLimit(false)
    setErrorMessage("")
    setRuleViolations([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!lineupName.trim()) {
      setErrorMessage("Please enter a lineup name")
      return
    }

    if (selectedPlayers.length !== 5) {
      setErrorMessage("Please select exactly 5 players for the lineup")
      return
    }

    // For National teams, check if total classification exceeds the base limit without sufficient bonus points
    if (isNational) {
      // Calculate bonuses
      const bonusPoints = bonuses.totalBonus

      // NEW VALIDATION LOGIC: Check if (Total Classification - Total Bonus) exceeds 14.5
      if (currentTotalClassification - bonusPoints > 14.5) {
        setErrorMessage(
          `Base classification minus bonuses (${(currentTotalClassification - bonusPoints).toFixed(1)}) exceeds the limit of 14.5. Add more bonus players or reduce classification.`,
        )
        return
      }

      // Also check if total classification exceeds the maximum allowed
      if (currentTotalClassification > activeTeam.rules.maxPointsAllowed) {
        setErrorMessage(
          `Total classification (${currentTotalClassification.toFixed(1)}) exceeds the maximum allowed (${activeTeam.rules.maxPointsAllowed.toFixed(1)}) for ${activeTeam.competitionLevel} competition level`,
        )
        return
      }
    } else if (isEuroCup) {
      // For EuroCup, apply the new validation logic
      const bonusPoints = bonuses.totalBonus

      // NEW VALIDATION LOGIC: Check if (Total Classification - Total Bonus) exceeds 14.5
      if (currentTotalClassification - bonusPoints > 14.5) {
        setErrorMessage(
          `Base classification minus bonuses (${(currentTotalClassification - bonusPoints).toFixed(1)}) exceeds the limit of 14.5. Add more bonus players or reduce classification.`,
        )
        return
      }

      // Also check against the 17.0 cap
      if (currentTotalClassification > 17.0) {
        setErrorMessage(
          `Total classification (${currentTotalClassification.toFixed(1)}) exceeds the maximum allowed (17.0) for EuroCup competition level`,
        )
        return
      }
    } else if (isInternational) {
      // For International, keep the existing validation
      if (currentTotalClassification > 14.0) {
        setErrorMessage(
          `Total classification (${currentTotalClassification.toFixed(1)}) exceeds the maximum allowed (14.0) for International competition level`,
        )
        return
      }
    }

    // Check National rules for other violations (foreign players, able-bodied players)
    if (isNational) {
      const violations = validateNationalRules().filter((v) => v.type !== "points") // We already checked points above
      if (violations.length > 0) {
        setErrorMessage(violations[0].message)
        return
      }
    }

    const newLineup = {
      id: editingLineupId || Date.now().toString(),
      teamId: activeTeamId,
      name: lineupName,
      playerIds: selectedPlayers,
      totalClassification: currentTotalClassification,
      bonuses: bonuses,
      baseMaxClassification: baseMaxClassification, // Add base limit for reference
      adjustedMaxClassification: isNational
        ? activeTeam.rules.maxPointsAllowed
        : isEuroCup
          ? 17.0
          : isInternational
            ? 14.0
            : 14.5,
      rating: editingLineupId ? currentLineup?.rating || 0 : 0,
      source: "manual",
    }

    if (editingLineupId) {
      // Update existing lineup
      setLineups(lineups.map((lineup) => (lineup.id === editingLineupId ? newLineup : lineup)))

      // Update current lineup if it's the one being edited
      if (currentLineup && currentLineup.id === editingLineupId) {
        setCurrentLineup(newLineup)
      }
    } else {
      // Create new lineup
      setLineups([...lineups, newLineup])
    }

    // Reset form
    setLineupName("")
    setSelectedPlayers([])
    setEditingLineupId(null)
    setLastSelectedPlayer(null)
    setIsOverLimit(false)
    setErrorMessage("")
    setRuleViolations([])

    // Show success message
    if (!isEmbedded) {
      alert("Lineup saved successfully!")
    }
  }

  // Fix the togglePlayerSelection function to provide better feedback
  const togglePlayerSelection = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
      if (playerId === lastSelectedPlayer) {
        setLastSelectedPlayer(null)
      }
      return
    }

    if (selectedPlayers.length >= 5) {
      setErrorMessage("You can only select 5 players for a lineup")
      return
    }

    const player = players.find((p) => p.id === playerId)
    if (!player) return

    const newTotal = currentTotalClassification + Number.parseFloat(player.classification)

    // Calculate new bonuses with this player added
    const newSelectedPlayers = [...selectedPlayers, playerId]
    const newSelectedPlayerObjects = newSelectedPlayers.map((id) => players.find((p) => p.id === id)).filter(Boolean)

    // Recalculate bonuses with the new player included
    let newBonusTotal = 0

    if (isEuroCup) {
      newBonusTotal = newSelectedPlayerObjects.reduce((sum, p) => {
        const cat = p.category || "Senior"
        if (cat === "Female") return sum + 1.5
        if (cat === "Junior") return sum + 1.0
        if (cat === "Junior Female") return sum + 2.0
        return sum
      }, 0)
    } else if (isNational && activeTeam?.rules) {
      const rules = activeTeam.rules
      let femaleCount = 0,
        juniorCount = 0,
        juniorFemaleCount = 0,
        femaleAbleBodyCount = 0

      newSelectedPlayerObjects.forEach((p) => {
        const cat = p.category || "Senior"
        if (cat === "Female") femaleCount++
        else if (cat === "Junior") juniorCount++
        else if (cat === "Junior Female") juniorFemaleCount++

        if (p.isAbleBody && p.gender === "female") femaleAbleBodyCount++
      })

      const femaleBonusCount = rules.maxFemales === -1 ? femaleCount : Math.min(femaleCount, rules.maxFemales)
      const juniorBonusCount = rules.maxJuniors === -1 ? juniorCount : Math.min(juniorCount, rules.maxJuniors)
      const juniorFemaleBonusCount =
        rules.maxJuniorFemales === -1 ? juniorFemaleCount : Math.min(juniorFemaleCount, rules.maxJuniorFemales)

      newBonusTotal =
        femaleBonusCount * rules.femaleBonus +
        juniorBonusCount * rules.juniorBonus +
        juniorFemaleBonusCount * rules.juniorFemaleBonus +
        femaleAbleBodyCount * (rules.femaleAbleBodyBonus || 0)
    }

    const newTotalWithBonus = newTotal + newBonusTotal

    // Check if adding this player would exceed limits
    let willExceedLimit = false
    let limitMessage = ""

    if (isNational) {
      // NEW VALIDATION LOGIC FOR NATIONAL
      // Check if (Total Classification - Total Bonus) exceeds 14.5
      if (newTotal - newBonusTotal > 14.5) {
        willExceedLimit = true
        limitMessage = `Adding this player would make base classification minus bonuses (${(newTotal - newBonusTotal).toFixed(1)}) exceed the limit of 14.5.`
      }

      // Also check if total classification exceeds the maximum allowed in rules
      if (newTotal > activeTeam.rules.maxPointsAllowed) {
        willExceedLimit = true
        limitMessage = `Adding this player would exceed the maximum allowed limit of ${activeTeam.rules.maxPointsAllowed.toFixed(1)}.`
      }
    } else if (isEuroCup) {
      // NEW VALIDATION LOGIC FOR EUROCUP
      // Check if (Total Classification - Total Bonus) exceeds 14.5
      if (newTotal - newBonusTotal > 14.5) {
        willExceedLimit = true
        limitMessage = `Adding this player would make base classification minus bonuses (${(newTotal - newBonusTotal).toFixed(1)}) exceed the limit of 14.5.`
      }

      // Also check against the 17.0 cap
      if (newTotal > 17.0) {
        willExceedLimit = true
        limitMessage = `Adding this player would exceed the maximum allowed limit of 17.0 for EuroCup.`
      }
    } else if (isInternational) {
      // Keep existing validation for International
      if (newTotal > 14.0) {
        willExceedLimit = true
        limitMessage = `Adding this player would exceed the maximum allowed limit of 14.0 for International.`
      }
    }

    // Add the player to selection
    setSelectedPlayers([...selectedPlayers, playerId])

    // Update UI feedback
    if (willExceedLimit) {
      setLastSelectedPlayer(playerId)
      setErrorMessage(limitMessage)
      setIsOverLimit(true)
    } else {
      setLastSelectedPlayer(null)
      setErrorMessage("")
      setIsOverLimit(false)
    }
  }

  // Render the component
  const content = (
    <div className="lineup-management-content">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="lineupName">Lineup Name</label>
          <input
            id="lineupName"
            type="text"
            value={lineupName}
            onChange={(e) => setLineupName(e.target.value)}
            required
          />
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {/* Display all rule violations */}
        {ruleViolations.length > 0 && (
          <div className="rule-violations">
            <h4>Rule Violations:</h4>
            <ul>
              {ruleViolations.map((violation, index) => (
                <li key={index} className={`violation-item ${violation.type}`}>
                  {violation.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-group">
          <label>Select 5 Players</label>
          <div className="player-selection-grid">
            {teamPlayers.map((player) => {
              const isSelected = selectedPlayers.includes(player.id)
              const isOverLimitPlayer = isOverLimit && player.id === lastSelectedPlayer
              const hasBonus =
                (isEuroCup || isNational) && player.category !== "Senior" && player.category !== "Male Able-Bodied"
              const bonusAmount = calculatePlayerBonus(player)
              const isForeign = isNational && player.isForeign
              const isAbleBody = isNational && player.isAbleBody
              const isFemaleAbleBody = isNational && player.category === "Female Able-Bodied"
              const isMaleAbleBody = isNational && player.category === "Male Able-Bodied"

              return (
                <div
                  key={player.id}
                  className={`player-selection-card ${isSelected ? "selected" : ""} ${isOverLimitPlayer ? "over-limit" : ""} ${hasBonus ? "has-bonus" : ""} ${isForeign ? "foreign" : ""} ${isAbleBody ? "able-body" : ""} ${isFemaleAbleBody ? "female-able-body" : ""} ${isMaleAbleBody ? "male-able-body" : ""}`}
                  onClick={() => togglePlayerSelection(player.id)}
                >
                  <div className="player-selection-info">
                    <span className="player-selection-name">{player.name}</span>
                    <div className="player-attributes">
                      <span className="player-selection-classification">{player.classification}</span>
                      {hasBonus && bonusAmount > 0 && (
                        <span
                          className="player-bonus-badge"
                          title={`${player.category} bonus: +${bonusAmount.toFixed(1)}`}
                        >
                          +{bonusAmount.toFixed(1)}
                        </span>
                      )}
                      {(isEuroCup || isNational) && (
                        <>
                          {player.category === "Female" && <span className="gender-indicator female">F</span>}
                          {player.category === "Junior" && <span className="age-indicator junior">J</span>}
                          {player.category === "Junior Female" && (
                            <>
                              <span className="gender-indicator female">F</span>
                              <span className="age-indicator junior">J</span>
                            </>
                          )}
                        </>
                      )}
                      {isNational && (
                        <>
                          {player.isForeign && <span className="foreign-indicator">FRN</span>}
                          {player.isAbleBody && (
                            <span
                              className={`able-body-indicator ${player.category === "Male Able-Bodied" ? "male-able-body" : "female-able-body"}`}
                            >
                              {player.category === "Male Able-Bodied" ? "MAB" : "FAB"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add a new style for the classification bonus display */}
        {/* Apply the inline style to the classification-bonus span */}
        <div className={`classification-summary ${isOverLimit ? "over-limit" : ""}`}>
          <div className="classification-total">
            Total Classification: <span className="classification-value">{currentTotalClassification.toFixed(1)}</span>
            {bonuses.totalBonus > 0 && (
              <span
                className="classification-bonus"
                style={{
                  color: "#ffd700",
                  fontWeight: "bold",
                  marginLeft: "4px",
                }}
              >
                {" "}
                + ({bonuses.totalBonus.toFixed(1)})
              </span>
            )}
          </div>
          <div className="classification-limit">
            <span>
              Base Limit: <span className="base-limit-value">{baseMaxClassification.toFixed(1)}</span>
            </span>
            {bonuses.totalBonus > 0 && (
              <div
                className="bonus-indicator"
                onClick={() => setShowBonusDetails(!showBonusDetails)}
                title="Click for bonus details"
              >
                <span className="bonus-value">+{bonuses.totalBonus.toFixed(1)}</span>
                {isEuroCup && <span className="adjusted-limit">{adjustedMaxClassification.toFixed(1)}</span>}
              </div>
            )}
          </div>
        </div>

        {showBonusDetails && bonuses.details.length > 0 && (
          <div className="bonus-details">
            <h4>{activeTeam?.competitionLevel} Bonus Points</h4>
            <ul>
              {bonuses.details.map((detail, index) => (
                <li key={index}>
                  <span className="bonus-type">{detail.type}:</span>
                  {isNational ? (
                    <>
                      <span className="bonus-count">{detail.count} players (</span>
                      <span className="bonus-amount">{detail.bonusCount} with bonus</span>
                      <span className="bonus-count">) × </span>
                      <span className="bonus-amount">+{detail.bonusPerPlayer.toFixed(1)}</span>
                    </>
                  ) : (
                    <>
                      <span className="bonus-count">{detail.count} × </span>
                      <span className="bonus-amount">
                        {detail.type === "Female" ? "+1.5" : detail.type === "Junior Male" ? "+1.0" : "+2.0"}
                      </span>
                    </>
                  )}
                  <span className="bonus-total"> = +{detail.bonus.toFixed(1)}</span>
                </li>
              ))}
              <li className="bonus-summary">
                <span>Total Bonus:</span>
                <span className="bonus-total-value">+{bonuses.totalBonus.toFixed(1)}</span>
              </li>
              {isEuroCup && (
                <li className="max-cap-note">
                  <span>Maximum Cap:</span>
                  <span className="max-cap-value">17.0</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* National Rules Summary */}
        {isNational && activeTeam?.rules && (
          <div className="national-rules-summary">
            <h4>National Rules Summary</h4>
            <ul>
              <li>
                <span className="rule-label">Junior Players:</span>
                <span className="rule-value">
                  {bonuses.juniorMaleCount || 0}
                  {activeTeam.rules.maxJuniors === -1 ? " / Unlimited allowed" : `/${selectedPlayers.length} players`}
                  {bonuses.juniorMaleCount > 0 && (
                    <span className="rule-bonus">
                      {activeTeam.rules.maxJuniors === -1 ? (
                        <> (all with +{activeTeam.rules.juniorBonus.toFixed(1)} bonus)</>
                      ) : (
                        <>
                          {" "}
                          ({Math.min(bonuses.juniorMaleCount, activeTeam.rules.maxJuniors)} with +
                          {activeTeam.rules.juniorBonus.toFixed(1)} bonus)
                        </>
                      )}
                    </span>
                  )}
                </span>
              </li>
              <li>
                <span className="rule-label">Female Players:</span>
                <span className="rule-value">
                  {bonuses.femaleCount || 0}
                  {activeTeam.rules.maxFemales === -1 ? " / Unlimited allowed" : `/${selectedPlayers.length} players`}
                  {bonuses.femaleCount > 0 && (
                    <span className="rule-bonus">
                      {activeTeam.rules.maxFemales === -1 ? (
                        <> (all with +{activeTeam.rules.femaleBonus.toFixed(1)} bonus)</>
                      ) : (
                        <>
                          {" "}
                          ({Math.min(bonuses.femaleCount, activeTeam.rules.maxFemales)} with +
                          {activeTeam.rules.femaleBonus.toFixed(1)} bonus)
                        </>
                      )}
                    </span>
                  )}
                </span>
              </li>
              <li>
                <span className="rule-label">Junior Female Players:</span>
                <span className="rule-value">
                  {bonuses.juniorFemaleCount || 0}
                  {activeTeam.rules.maxJuniorFemales === -1
                    ? " / Unlimited allowed"
                    : `/${selectedPlayers.length} players`}
                  {bonuses.juniorFemaleCount > 0 && (
                    <span className="rule-bonus">
                      {activeTeam.rules.maxJuniorFemales === -1 ? (
                        <> (all with +{activeTeam.rules.juniorFemaleBonus.toFixed(1)} bonus)</>
                      ) : (
                        <>
                          {" "}
                          ({Math.min(bonuses.juniorFemaleCount, activeTeam.rules.maxJuniorFemales)} with +
                          {activeTeam.rules.juniorFemaleBonus.toFixed(1)} bonus)
                        </>
                      )}
                    </span>
                  )}
                </span>
              </li>
              <li>
                <span className="rule-label">Foreign Players:</span>
                <span className={`rule-value ${ruleViolations.some((v) => v.type === "foreign") ? "violation" : ""}`}>
                  {
                    selectedPlayers.filter((id) => {
                      const player = players.find((p) => p.id === id)
                      return player && player.isForeign
                    }).length
                  }
                  {activeTeam.rules.maxForeignPlayers === -1
                    ? " / Unlimited allowed"
                    : ` / ${activeTeam.rules.maxForeignPlayers} allowed`}
                </span>
              </li>
              <li>
                <span className="rule-label">Able-Bodied Players:</span>
                <span className={`rule-value ${ruleViolations.some((v) => v.type === "ableBody") ? "violation" : ""}`}>
                  {
                    selectedPlayers.filter((id) => {
                      const player = players.find((p) => p.id === id)
                      return player && player.isAbleBody
                    }).length
                  }
                  /{activeTeam.rules.maxAbleBodyPlayers} allowed
                </span>
              </li>
              <li>
                <span className="rule-label">Total Points:</span>
                <span
                  className={`rule-value ${currentTotalClassification > activeTeam.rules.maxPointsAllowed ? "violation" : ""}`}
                >
                  {currentTotalClassification.toFixed(1)}/{activeTeam.rules.maxPointsAllowed.toFixed(1)} allowed
                </span>
              </li>
              <li>
                <span className="rule-label">Lineup After Bonus:</span>
                <span
                  className={`rule-value ${(currentTotalClassification - bonuses.totalBonus) > 14.5 ? "violation" : ""}`}
                >
                  {(currentTotalClassification - bonuses.totalBonus).toFixed(1)}/14.5 allowed
                </span>
              </li>
            </ul>
          </div>
        )}

        <div className="form-actions">
          {editingLineupId && (
            <button
              type="button"
              className="action-button"
              onClick={() => {
                setLineupName("")
                setSelectedPlayers([])
                setEditingLineupId(null)
                setLastSelectedPlayer(null)
                setIsOverLimit(false)
                setErrorMessage("")
                setRuleViolations([])
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="action-button"
            disabled={isOverLimit || selectedPlayers.length !== 5 || ruleViolations.length > 0}
          >
            {editingLineupId ? "Update Lineup" : "Create Lineup"}
          </button>
        </div>
      </form>

      {/* Display saved lineups if not embedded */}
      {!isEmbedded && teamLineups.length > 0 && (
        <div className="lineups-list">
          <h3>Team Lineups</h3>
          <div className="lineups-grid">
            {teamLineups.map((lineup) => (
              <div
                key={lineup.id}
                className={`lineup-card ${currentLineup && currentLineup.id === lineup.id ? "active" : ""}`}
              >
                <div className="lineup-header">
                  <h4>{lineup.name}</h4>
                  <div className="lineup-classification-info">
                    <span className="classification-badge">{lineup.totalClassification.toFixed(1)}</span>
                    {lineup.bonuses && lineup.bonuses.totalBonus > 0 && (
                      <span className="lineup-bonus-badge" title="Uses bonus points">
                        +{lineup.bonuses.totalBonus.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {lineup.playerIds.map((playerId) => {
                  const player = players.find((p) => p.id === playerId)
                  if (!player) return null

                  return (
                    <div
                      key={player.id}
                      className={`lineup-player ${player.isForeign ? "foreign" : ""} ${player.isAbleBody ? "able-body" : ""}`}
                    >
                      <span className="player-name">{player.name}</span>
                      <div className="player-details">
                        <span className="player-classification">{player.classification}</span>
                        {(isEuroCup || isNational) && (
                          <>
                            {player.category === "Female" && <span className="player-gender female">F</span>}
                            {player.category === "Junior" && <span className="player-age junior">J</span>}
                            {player.category === "Junior Female" && (
                              <>
                                <span className="player-gender female">F</span>
                                <span className="player-age junior">J</span>
                              </>
                            )}
                          </>
                        )}
                        {isNational && (
                          <>
                            {player.isForeign && <span className="player-status foreign">FRN</span>}
                            {player.isAbleBody && <span className="player-status able-body">AB</span>}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="lineup-actions">
                  <button className="action-button small" onClick={() => initializeEditForm(lineup)}>
                    Edit
                  </button>
                  <button
                    className="action-button small"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this lineup?")) {
                        setLineups(lineups.filter((l) => l.id !== lineup.id))
                        if (currentLineup && currentLineup.id === lineup.id) {
                          setCurrentLineup(null)
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="action-button small"
                    onClick={() => setCurrentLineup(lineup)}
                    disabled={currentLineup && currentLineup.id === lineup.id}
                  >
                    {currentLineup && currentLineup.id === lineup.id ? "Active" : "Use"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Return content directly if embedded
  if (isEmbedded) {
    return content
  }

  // Wrap in modal if not embedded
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Lineups - {activeTeam?.name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        {content}
      </div>
    </div>
  )
}

export default LineupManagement


