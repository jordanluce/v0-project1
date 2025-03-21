"use client"

import { useState, useContext, useEffect } from "react"
import { AppContext } from "./App"
import "./RulesSetup.css"

const RulesSetup = ({ onClose }) => {
  const { activeTeam, teams, setTeams, activeTeamId } = useContext(AppContext)

  // Default rules for National teams
  const defaultRules = {
    maxJuniors: -1, // -1 represents "Unlimited"
    juniorBonus: 0,
    maxFemales: -1, // -1 represents "Unlimited"
    femaleBonus: 0,
    maxJuniorFemales: -1, // -1 represents "Unlimited"
    juniorFemaleBonus: 0,
    maxForeignPlayers: -1, // Changed from 2 to -1 (Unlimited)
    maxAbleBodyPlayers: 1, // This must be defined and cannot be unlimited
    femaleAbleBodyBonus: 0, // Default to 0
    maxPointsAllowed: 17, // Changed from 15.5 to 17
  }

  // Initialize state with current team rules or defaults
  const [rules, setRules] = useState(activeTeam?.rules || defaultRules)
  const [hasChanges, setHasChanges] = useState(false)

  // Update rules when active team changes
  useEffect(() => {
    if (activeTeam) {
      setRules(activeTeam.rules || defaultRules)
      setHasChanges(false)
    }
  }, [activeTeam])

  // Handle input changes
  const handleInputChange = (field, value) => {
    // Special handling for "unlimited" in select fields
    if (value === "unlimited") {
      setRules((prev) => ({
        ...prev,
        [field]: -1, // Use -1 to represent unlimited
      }))
      setHasChanges(true)
      return
    }

    // Convert to number and ensure it's not negative (except for -1 which means unlimited)
    const numValue = value === "" ? 0 : Math.max(0, Number(value))

    setRules((prev) => ({
      ...prev,
      [field]: numValue,
    }))
    setHasChanges(true)
  }

  // Add validation for the form
  const validateForm = () => {
    // Check if maxAbleBodyPlayers is defined and valid
    if (rules.maxAbleBodyPlayers <= 0) {
      alert("Max Able-Bodied Players must be defined with a value greater than 0")
      return false
    }
    return true
  }

  // Save rules to team
  const handleSave = () => {
    if (!activeTeamId) return

    // Validate the form before saving
    if (!validateForm()) return

    const updatedTeams = teams.map((team) => {
      if (team.id === activeTeamId) {
        return {
          ...team,
          rules: rules,
        }
      }
      return team
    })

    setTeams(updatedTeams)
    setHasChanges(false)
    onClose()
  }

  // Reset to defaults
  const handleReset = () => {
    setRules(defaultRules)
    setHasChanges(true)
  }

  // Only show for National teams
  if (activeTeam?.competitionLevel !== "National") {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>National Rules Setup</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="rules-not-applicable">
            <p>Rules setup is only applicable for National competition level teams.</p>
            <p>
              This team is set to <strong>{activeTeam?.competitionLevel}</strong> competition level.
            </p>
          </div>
          <div className="form-actions">
            <button className="action-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content rules-setup-modal">
        <div className="modal-header">
          <h2>National Rules Setup - {activeTeam?.name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="rules-explanation">
          <p>
            Configure the lineup rules for your National team. These rules will be used to validate lineups and
            calculate bonuses.
          </p>
        </div>

        <div className="rules-form">
          <div className="rules-section">
            <h3 className="rules-section-title">Player Category Bonuses</h3>

            <div className="rules-grid">
              <div className="rule-item">
                <label htmlFor="maxJuniors">Max Junior Players with Bonus:</label>
                <select
                  id="maxJuniors"
                  value={rules.maxJuniors === -1 ? "unlimited" : rules.maxJuniors}
                  onChange={(e) => handleInputChange("maxJuniors", e.target.value)}
                >
                  <option value="unlimited" className="unlimited-option">
                    Unlimited
                  </option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <div className="rule-help">Maximum number of junior players that can receive bonus points</div>
              </div>

              <div className="rule-item">
                <label htmlFor="juniorBonus">Junior Player Bonus:</label>
                <div className="stepper-control">
                  <button
                    type="button"
                    className="stepper-button decrement"
                    onClick={() => handleInputChange("juniorBonus", Math.max(0, rules.juniorBonus - 0.5))}
                    aria-label="Decrease Junior Player Bonus"
                  >
                    −
                  </button>
                  <div className="stepper-value">{rules.juniorBonus.toFixed(1)}</div>
                  <button
                    type="button"
                    className="stepper-button increment"
                    onClick={() => handleInputChange("juniorBonus", rules.juniorBonus + 0.5)}
                    aria-label="Increase Junior Player Bonus"
                  >
                    +
                  </button>
                </div>
                <div className="rule-help">Bonus points added per junior player (up to the max)</div>
              </div>

              <div className="rule-item">
                <label htmlFor="maxFemales">Max Female Players with Bonus:</label>
                <select
                  id="maxFemales"
                  value={rules.maxFemales === -1 ? "unlimited" : rules.maxFemales}
                  onChange={(e) => handleInputChange("maxFemales", e.target.value)}
                >
                  <option value="unlimited" className="unlimited-option">
                    Unlimited
                  </option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <div className="rule-help">Maximum number of female players that can receive bonus points</div>
              </div>

              <div className="rule-item">
                <label htmlFor="femaleBonus">Female Player Bonus:</label>
                <div className="stepper-control">
                  <button
                    type="button"
                    className="stepper-button decrement"
                    onClick={() => handleInputChange("femaleBonus", Math.max(0, rules.femaleBonus - 0.5))}
                    aria-label="Decrease Female Player Bonus"
                  >
                    −
                  </button>
                  <div className="stepper-value">{rules.femaleBonus.toFixed(1)}</div>
                  <button
                    type="button"
                    className="stepper-button increment"
                    onClick={() => handleInputChange("femaleBonus", rules.femaleBonus + 0.5)}
                    aria-label="Increase Female Player Bonus"
                  >
                    +
                  </button>
                </div>
                <div className="rule-help">Bonus points added per female player (up to the max)</div>
              </div>

              <div className="rule-item">
                <label htmlFor="maxJuniorFemales">Max Junior Female Players with Bonus:</label>
                <select
                  id="maxJuniorFemales"
                  value={rules.maxJuniorFemales === -1 ? "unlimited" : rules.maxJuniorFemales}
                  onChange={(e) => handleInputChange("maxJuniorFemales", e.target.value)}
                >
                  <option value="unlimited" className="unlimited-option">
                    Unlimited
                  </option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <div className="rule-help">Maximum number of junior female players that can receive bonus points</div>
              </div>

              <div className="rule-item">
                <label htmlFor="juniorFemaleBonus">Junior Female Player Bonus:</label>
                <div className="stepper-control">
                  <button
                    type="button"
                    className="stepper-button decrement"
                    onClick={() => handleInputChange("juniorFemaleBonus", Math.max(0, rules.juniorFemaleBonus - 0.5))}
                    aria-label="Decrease Junior Female Player Bonus"
                  >
                    −
                  </button>
                  <div className="stepper-value">{rules.juniorFemaleBonus.toFixed(1)}</div>
                  <button
                    type="button"
                    className="stepper-button increment"
                    onClick={() => handleInputChange("juniorFemaleBonus", rules.juniorFemaleBonus + 0.5)}
                    aria-label="Increase Junior Female Player Bonus"
                  >
                    +
                  </button>
                </div>
                <div className="rule-help">Bonus points added per junior female player (up to the max)</div>
              </div>
            </div>
          </div>

          <div className="rules-section">
            <h3 className="rules-section-title">Player Restrictions</h3>

            <div className="rules-grid">
              <div className="rule-item">
                <label htmlFor="maxForeignPlayers">Max Foreign Players:</label>
                <select
                  id="maxForeignPlayers"
                  value={rules.maxForeignPlayers === -1 ? "unlimited" : rules.maxForeignPlayers}
                  onChange={(e) => handleInputChange("maxForeignPlayers", e.target.value)}
                >
                  <option value="unlimited" className="unlimited-option">
                    Unlimited
                  </option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <div className="rule-help">Maximum number of foreign players allowed in a lineup</div>
              </div>

              <div className="rule-item">
                <label htmlFor="maxAbleBodyPlayers" className="required-field">
                  Max Able-Bodied Players:
                </label>
                <div className="stepper-control">
                  <button
                    type="button"
                    className="stepper-button decrement"
                    onClick={() => handleInputChange("maxAbleBodyPlayers", Math.max(1, rules.maxAbleBodyPlayers - 1))}
                    aria-label="Decrease Max Able-Bodied Players"
                  >
                    −
                  </button>
                  <div className="stepper-value">{rules.maxAbleBodyPlayers}</div>
                  <button
                    type="button"
                    className="stepper-button increment"
                    onClick={() => handleInputChange("maxAbleBodyPlayers", Math.min(5, rules.maxAbleBodyPlayers + 1))}
                    aria-label="Increase Max Able-Bodied Players"
                  >
                    +
                  </button>
                </div>
                <div className="rule-help">
                  Maximum number of able-bodied players (5.0) allowed in a lineup (required)
                </div>
                {rules.maxAbleBodyPlayers <= 0 && (
                  <div className="field-error">This field is required and must be at least 1</div>
                )}
              </div>

              <div className="rule-item">
                <label htmlFor="femaleAbleBodyBonus">Female Able-Bodied Bonus:</label>
                <div className="stepper-control">
                  <button
                    type="button"
                    className="stepper-button decrement"
                    onClick={() =>
                      handleInputChange("femaleAbleBodyBonus", Math.max(0, rules.femaleAbleBodyBonus - 0.5))
                    }
                    aria-label="Decrease Female Able-Bodied Bonus"
                  >
                    −
                  </button>
                  <div className="stepper-value">{rules.femaleAbleBodyBonus.toFixed(1)}</div>
                  <button
                    type="button"
                    className="stepper-button increment"
                    onClick={() => handleInputChange("femaleAbleBodyBonus", rules.femaleAbleBodyBonus + 0.5)}
                    aria-label="Increase Female Able-Bodied Bonus"
                  >
                    +
                  </button>
                </div>
                <div className="rule-help">Bonus points added per female able-bodied player (5.0)</div>
              </div>

              <div className="rule-item full-width">
                <label htmlFor="maxPointsAllowed">Maximum Points Allowed:</label>
                <div className="stepper-control">
                  <button
                    type="button"
                    className="stepper-button decrement"
                    onClick={() => handleInputChange("maxPointsAllowed", Math.max(14, rules.maxPointsAllowed - 0.5))}
                    aria-label="Decrease Maximum Points Allowed"
                  >
                    −
                  </button>
                  <div className="stepper-value">{rules.maxPointsAllowed.toFixed(1)}</div>
                  <button
                    type="button"
                    className="stepper-button increment"
                    onClick={() => handleInputChange("maxPointsAllowed", Math.min(20, rules.maxPointsAllowed + 0.5))}
                    aria-label="Increase Maximum Points Allowed"
                  >
                    +
                  </button>
                </div>
                <div className="rule-help">Maximum total classification points allowed (including bonuses)</div>
              </div>
            </div>
          </div>

          <div className="rules-summary">
            <h3>Rules Summary</h3>
            <ul>
              <li>
                {rules.maxJuniors === -1 ? (
                  <>
                    <span className="unlimited-badge">Unlimited</span> junior players can receive a{" "}
                  </>
                ) : (
                  `Up to ${rules.maxJuniors} junior players can receive a `
                )}
                +{rules.juniorBonus.toFixed(1)} bonus each
              </li>
              <li>
                {rules.maxFemales === -1 ? (
                  <>
                    <span className="unlimited-badge">Unlimited</span> female players can receive a{" "}
                  </>
                ) : (
                  `Up to ${rules.maxFemales} female players can receive a `
                )}
                +{rules.femaleBonus.toFixed(1)} bonus each
              </li>
              <li>
                {rules.maxJuniorFemales === -1 ? (
                  <>
                    <span className="unlimited-badge">Unlimited</span> junior female players can receive a{" "}
                  </>
                ) : (
                  `Up to ${rules.maxJuniorFemales} junior female players can receive a `
                )}
                +{rules.juniorFemaleBonus.toFixed(1)} bonus each
              </li>
              <li>
                {rules.maxForeignPlayers === -1 ? (
                  <>
                    <span className="unlimited-badge">Unlimited</span> foreign players allowed
                  </>
                ) : (
                  `Maximum ${rules.maxForeignPlayers} foreign players allowed`
                )}
              </li>
              <li>Maximum {rules.maxAbleBodyPlayers} able-bodied players allowed</li>
              <li>Female able-bodied players receive a +{rules.femaleAbleBodyBonus.toFixed(1)} bonus each</li>
              <li>Total classification points (including bonuses) cannot exceed {rules.maxPointsAllowed.toFixed(1)}</li>
            </ul>
          </div>

          <div className="form-actions">
            <button type="button" className="action-button secondary" onClick={handleReset}>
              Reset to Defaults
            </button>
            <button type="button" className="action-button" onClick={handleSave} disabled={!hasChanges}>
              Save Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RulesSetup

