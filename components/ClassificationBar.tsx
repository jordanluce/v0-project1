"use client"

import "./ClassificationBar.css"
import { useState } from "react"

const ClassificationBar = ({
  totalClassification = 0,
  competitionLevel = "National",
  players = [],
  teamRules = null,
}) => {
  const [showBonusDetails, setShowBonusDetails] = useState(false)

  // Define the base maximum classification based on competition level
  const getBaseMaxClassification = () => {
    if (competitionLevel === "International") return 14.0
    if (competitionLevel === "Eurocup") return 14.5
    if (competitionLevel === "National") return 14.5 // Always 14.5 base for National
    return 14.5 // Default fallback
  }

  // Calculate bonuses based on player categories and team rules
  const calculateBonuses = () => {
    // For International teams, no bonuses
    if (competitionLevel === "International") {
      return {
        totalBonus: 0,
        details: [],
      }
    }

    // For EuroCup, use standard EuroCup rules
    if (competitionLevel === "Eurocup") {
      let totalBonus = 0
      let femaleCount = 0
      let juniorMaleCount = 0
      let juniorFemaleCount = 0

      players.forEach((player) => {
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
    if (competitionLevel === "National" && teamRules) {
      let totalBonus = 0
      let femaleCount = 0
      let juniorMaleCount = 0
      let juniorFemaleCount = 0
      let femaleAbleBodyCount = 0

      // Count players by category
      players.forEach((player) => {
        const category = player.category || "Senior"

        if (category === "Female") {
          femaleCount++
        } else if (category === "Junior") {
          juniorMaleCount++
        } else if (category === "Junior Female") {
          juniorFemaleCount++
        }

        // Count female able-bodied players
        if (player.isAbleBody && (category === "Female" || category === "Junior Female")) {
          femaleAbleBodyCount++
        }
      })

      // Apply bonuses based on team rules and limits
      // If maxJuniors is -1 (unlimited), apply bonus to all junior players
      const femaleBonusCount = teamRules.maxFemales === -1 ? femaleCount : Math.min(femaleCount, teamRules.maxFemales)
      const juniorBonusCount =
        teamRules.maxJuniors === -1 ? juniorMaleCount : Math.min(juniorMaleCount, teamRules.maxJuniors)
      const juniorFemaleBonusCount =
        teamRules.maxJuniorFemales === -1 ? juniorFemaleCount : Math.min(juniorFemaleCount, teamRules.maxJuniorFemales)

      const femaleBonus = femaleBonusCount * teamRules.femaleBonus
      const juniorBonus = juniorBonusCount * teamRules.juniorBonus
      const juniorFemaleBonus = juniorFemaleBonusCount * teamRules.juniorFemaleBonus
      const femaleAbleBodyBonus = femaleAbleBodyCount * (teamRules.femaleAbleBodyBonus || 0)

      totalBonus = femaleBonus + juniorBonus + juniorFemaleBonus + femaleAbleBodyBonus

      return {
        totalBonus,
        femaleCount,
        juniorMaleCount,
        juniorFemaleCount,
        femaleAbleBodyCount,
        femaleBonusCount,
        juniorBonusCount,
        juniorFemaleBonusCount,
        details: [
          {
            type: "Female",
            count: femaleCount,
            bonusCount: femaleBonusCount,
            bonusPerPlayer: teamRules.femaleBonus,
            bonus: femaleBonus,
          },
          {
            type: "Junior Male",
            count: juniorMaleCount,
            bonusCount: juniorBonusCount,
            bonusPerPlayer: teamRules.juniorBonus,
            bonus: juniorBonus,
          },
          {
            type: "Junior Female",
            count: juniorFemaleCount,
            bonusCount: juniorFemaleBonusCount,
            bonusPerPlayer: teamRules.juniorFemaleBonus,
            bonus: juniorFemaleBonus,
          },
          {
            type: "Female Able-Bodied",
            count: femaleAbleBodyCount,
            bonusCount: femaleAbleBodyCount,
            bonusPerPlayer: teamRules.femaleAbleBodyBonus || 0,
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

  const bonuses = calculateBonuses()

  // Calculate the adjusted maximum with bonuses
  const baseMaxClassification = getBaseMaxClassification()
  let adjustedMaxClassification = baseMaxClassification

  // For EuroCup, cap at 17.0
  if (competitionLevel === "Eurocup") {
    adjustedMaxClassification = Math.min(baseMaxClassification + bonuses.totalBonus, 17.0)
  }
  // For National, use the team's max points allowed as the cap, starting from base 14.5
  else if (competitionLevel === "National" && teamRules) {
    adjustedMaxClassification = Math.min(baseMaxClassification + bonuses.totalBonus, teamRules.maxPointsAllowed)
  }

  // Add a warning message for exceeding base limit without sufficient bonus
  const showBaseWarning =
    competitionLevel === "National" &&
    totalClassification > baseMaxClassification &&
    bonuses.totalBonus < totalClassification - baseMaxClassification

  // Calculate the percentage for the progress bar
  const percentage = Math.min((totalClassification / adjustedMaxClassification) * 100, 100)

  // Determine the color based on how close to the limit
  const getColor = () => {
    if (percentage < 70) return "#4caf50" // Green
    if (percentage < 90) return "#ff9800" // Orange
    return totalClassification > adjustedMaxClassification ? "#f44336" : "#ffd700" // Red if over limit, yellow if close
  }

  return (
    <div className="classification-bar-container">
      <div className="classification-info">
        <div className="classification-label">
          Total Classification: <span className="classification-value">{totalClassification.toFixed(1)}</span>
        </div>
        <div className="classification-limit">
          <span className="limit-label">{competitionLevel} Limit:</span>
          <span className="classification-value">{baseMaxClassification.toFixed(1)}</span>

          {bonuses.totalBonus > 0 && (
            <div
              className="bonus-indicator"
              onClick={() => setShowBonusDetails(!showBonusDetails)}
              title="Click for bonus details"
            >
              <span className="bonus-value">+{bonuses.totalBonus.toFixed(1)}</span>
              {adjustedMaxClassification !== baseMaxClassification && (
                <span className="adjusted-limit">{adjustedMaxClassification.toFixed(1)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {showBonusDetails && bonuses.details.length > 0 && (
        <div className="bonus-details">
          <h4>{competitionLevel} Bonus Points</h4>
          <ul>
            {bonuses.details.map((detail, index) => (
              <li key={index}>
                <span className="bonus-type">{detail.type}:</span>
                {competitionLevel === "National" ? (
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
            {competitionLevel === "Eurocup" && (
              <li className="max-cap-note">
                <span>Maximum Cap:</span>
                <span className="max-cap-value">17.0</span>
              </li>
            )}
            {competitionLevel === "National" && teamRules && (
              <li className="max-cap-note">
                <span>Maximum Cap:</span>
                <span className="max-cap-value">{teamRules.maxPointsAllowed.toFixed(1)}</span>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="classification-bar">
        <div
          className="classification-progress"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        ></div>
      </div>

      {showBaseWarning && (
        <div className="classification-warning">
          Warning: Total classification ({totalClassification.toFixed(1)}) exceeds the base limit of{" "}
          {baseMaxClassification.toFixed(1)} without sufficient bonus points. You need at least{" "}
          {(totalClassification - baseMaxClassification).toFixed(1)} bonus points but only have{" "}
          {bonuses.totalBonus.toFixed(1)}.
        </div>
      )}

      {totalClassification > adjustedMaxClassification && (
        <div className="classification-warning">
          Warning: Total classification ({totalClassification.toFixed(1)}) exceeds the maximum allowed limit of{" "}
          {adjustedMaxClassification.toFixed(1)} for {competitionLevel} competition level.
        </div>
      )}

      {bonuses.totalBonus > 0 && !showBonusDetails && (
        <div className="bonus-hint" onClick={() => setShowBonusDetails(true)}>
          Click on the bonus indicator (+{bonuses.totalBonus.toFixed(1)}) to see details
        </div>
      )}
    </div>
  )
}

export default ClassificationBar

