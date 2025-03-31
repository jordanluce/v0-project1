"use client"

// Make sure CSS import is at the top of the file
import "./CoachingBoard.css"

import { useState, useRef, useEffect, useContext, useCallback } from "react"
import { AppContext } from "./App"
import BasketballCourt from "./BasketballCourt"
import TacticDisplayModal from "./TacticDisplayModal"
import ShareSystemsModal from "./ShareSystemsModal" // Add this import

// Update the CoachingBoard component to include tactics dropdown
const CoachingBoard = ({
  players = [],
  currentLineup = null,
  lineupTactics = [],
  disabled = false,
  activeTeamId,
  openPlayerStatsModal,
}) => {
  const { lineups, activeTeam, tactics, setCurrentTactic } = useContext(AppContext)
  const [drawMode, setDrawMode] = useState("line")
  const [drawings, setDrawings] = useState([])
  const [currentDrawing, setCurrentDrawing] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [courtSize, setCourtSize] = useState({ width: 0, height: 0 })
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  const [playerPositions, setPlayerPositions] = useState({})
  const [systemName, setSystemName] = useState("")
  const [savedSystems, setSavedSystems] = useState([])
  const [startPoint, setStartPoint] = useState(null)

  // Add new state variables for the dropdowns and notifications
  // Add these after the other state declarations (around line 40-50)
  const [showSavedSystemsDropdown, setShowSavedSystemsDropdown] = useState(false)
  const [staticSystemName, setStaticSystemName] = useState("")
  const [showStaticNamePrompt, setShowStaticNamePrompt] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "" })

  // Add this to the existing state variables near the other state declarations
  const [showShareModal, setShowShareModal] = useState(false)

  // Add state for tactics dropdown
  const [showTacticsDropdown, setShowTacticsDropdown] = useState(false)
  const tacticsDropdownRef = useRef(null)

  // Add new state variables after the existing state declarations (around line 40-50)
  const [selectedCourtPlayer, setSelectedCourtPlayer] = useState(null)
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState(null)

  // Add state for swap error message
  const [swapErrorMessage, setSwapErrorMessage] = useState("")

  // Add a new state to track available classification space after a player is removed
  const [availableClassificationSpace, setAvailableClassificationSpace] = useState(0)
  const [showEligibleIndicators, setShowEligibleIndicators] = useState(false)

  // Add action history tracking for undo functionality
  const [actionHistory, setActionHistory] = useState([])
  const [eraserMode, setEraserMode] = useState(false)

  // Add state for curve control point
  // We don't need the isPlacingBasketball state anymore
  // Add state for basketball
  const [basketballs, setBasketballs] = useState([])
  const [draggedBasketball, setDraggedBasketball] = useState(null)

  // Add a new state for the selected tactic to display in the modal
  const [tacticToDisplay, setTacticToDisplay] = useState(null)

  // Add undeclared variables
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isPlaying, setIsPlaying] = useState(false)

  // Add a new state for tracking arrow count
  const [arrowCount, setArrowCount] = useState(0)

  // Add a state to capture the current system state when opening the form
  // This will be used to restore the state if needed
  const [savedSystemState, setSavedSystemState] = useState(null)

  // Mock functions to resolve undeclared variables
  const saveSystem = (name) => {
    if (!name.trim() || !savedSystemState) {
      return false
    }

    console.log("saveSystem called with name:", name)
    const system = {
      id: Date.now().toString(),
      name: name,
      drawings: savedSystemState.drawings,
      playerPositions: savedSystemState.playerPositions,
      opponentPositions: savedSystemState.opponentPositions,
      opponents: savedSystemState.opponents,
      basketballs: savedSystemState.basketballs,
      isStatic: true,
      createdAt: new Date().toISOString(),
    }
    setSavedSystems((prevSystems) => [...prevSystems, system])

    // Show success notification
    setNotification({
      show: true,
      message: `System "${name}" saved successfully!`,
    })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)

    // Clear the system name and close the form
    setStaticSystemName("")
    setShowStaticNamePrompt(false)
    setSavedSystemState(null) // Clear saved state after successful save

    return true
  }

  const doPathsIntersect = (path1, path2) => {
    console.log("doPathsIntersect called with path1:", path1, "path2:", path2)
    return false
  }

  // Replace the mock calculateArrowhead function with a proper implementation
  const calculateArrowhead = (start, end) => {
    // Calculate the angle of the line
    const angle = Math.atan2(end.y - start.y, end.x - start.x)

    // Length of the arrowhead lines
    const arrowLength = 15

    // Angle of the arrowhead lines (in radians)
    const arrowAngle = Math.PI / 6 // 30 degrees

    // Calculate the points for the arrowhead
    const point1 = {
      x: end.x - arrowLength * Math.cos(angle - arrowAngle),
      y: end.y - arrowLength * Math.sin(angle - arrowAngle),
    }

    const point2 = {
      x: end.x - arrowLength * Math.cos(angle + arrowAngle),
      y: end.y - arrowLength * Math.sin(angle + arrowAngle),
    }

    // Return the points for the arrowhead
    return [point1, end, point2]
  }

  const toggleEraserMode = () => {
    console.log("toggleEraserMode called")
    setEraserMode(!eraserMode)
    setDrawMode(eraserMode ? "none" : "erase")
  }

  const clearDrawings = () => {
    console.log("clearDrawings called")
    setDrawings([])
  }

  const handleMouseMove = (e) => {
    handleMouseMoveDrawing(e)
  }

  const handleEraserTap = (e) => {
    console.log("handleEraserTap called")
  }

  const handleLineupChange = (e) => {
    setSelectedLineupId(e.target.value)
  }

  const loadTactic = (tactic) => {
    console.log("loadTactic called with tactic:", tactic)
  }

  // Also update the deleteSystem function to properly remove systems
  const deleteSystem = (systemId) => {
    if (!systemId) return

    // Filter out the system with the given ID
    setSavedSystems((prev) => prev.filter((system) => system.id !== systemId))

    // Show notification
    setNotification({
      show: true,
      message: "System deleted",
    })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  // Replace the mock loadSystem function with a proper implementation that actually loads the saved system
  const loadSystem = (system) => {
    if (!system) return

    // Clear current state first
    setDrawings([])
    setOpponents([])
    setOpponentPositions({})
    setBasketballs([])

    // Load all the system data
    setDrawings(system.drawings || [])

    // Load player positions
    if (system.playerPositions) {
      setPlayerPositions(system.playerPositions)
    }

    // Load opponents and their positions
    if (system.opponents && system.opponents.length > 0) {
      setOpponents(system.opponents)
    }

    if (system.opponentPositions) {
      setOpponentPositions(system.opponentPositions)
    }

    // Load basketballs
    if (system.basketballs && system.basketballs.length > 0) {
      setBasketballs(system.basketballs)
    }

    // Close the dropdown
    setShowSavedSystemsDropdown(false)

    // Show notification
    setNotification({
      show: true,
      message: `Loaded system: ${system.name}`,
    })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  // Add a function to track actions for the undo feature
  const trackAction = (actionType, data) => {
    setActionHistory((prev) => [...prev, { type: actionType, data }])
  }

  // Enhance the undoLastAction function to handle arrow numbering
  const undoLastAction = () => {
    if (actionHistory.length === 0) return

    const lastAction = actionHistory[actionHistory.length - 1]

    switch (lastAction.type) {
      case "drawing":
        // Check if the last drawing was an arrow
        const lastDrawing = drawings[drawings.length - 1]
        if (lastDrawing && lastDrawing.type === "arrow" && lastDrawing.arrowNumber) {
          // Decrement arrow count when removing an arrow
          setArrowCount((prev) => Math.max(0, prev - 1))
        }

        // Remove the last drawing
        setDrawings((prev) => prev.slice(0, -1))
        break
      // Other cases remain unchanged
      case "opponent":
        // Remove the last opponent
        if (lastAction.data.action === "add") {
          setOpponents((prev) => prev.filter((o) => o.id !== lastAction.data.id))
          // Also remove position data
          setOpponentPositions((prev) => {
            const newPositions = { ...prev }
            delete newPositions[lastAction.data.id]
            return newPositions
          })
        }
        break
      case "player-move":
        // Restore previous player position
        setPlayerPositions((prev) => ({
          ...prev,
          [lastAction.data.id]: lastAction.data.prevPosition,
        }))
        break
      case "basketball-add":
        // Remove the last basketball
        setBasketballs((prev) => prev.slice(0, -1))
        break
      case "basketball-move":
        // Restore previous basketball position
        setBasketballs((prev) => {
          const newBasketballs = [...prev]
          const index = newBasketballs.findIndex((b) => b.id === lastAction.data.id)
          if (index !== -1) {
            newBasketballs[index] = {
              ...newBasketballs[index],
              position: lastAction.data.prevPosition,
            }
          }
          return newBasketballs
        })
        break
      default:
        break
    }

    // Remove the action from history
    setActionHistory((prev) => prev.slice(0, -1))
  }

  // Add the player swapping functions - add this after the setStartPoint state declaration
  // Modify the handleSwapPlayer function to calculate and show eligible replacements
  const handleSwapPlayer = (player, destination) => {
    // Clear any previous error messages
    setSwapErrorMessage("")

    if (destination === "court") {
      // Check if we already have 5 players on court
      if (playersOnCourt.length >= 5) {
        setSwapErrorMessage("Cannot add player: Maximum 5 players allowed on court. Remove a player first.")
        return
      }

      // Calculate what the new classification total would be
      const currentClassification = currentLineup
        ? calculateLineupClassification([...playersOnCourt])
        : calculateLineupClassification([...playersOnCourt])

      const newTotal = currentClassification + Number.parseFloat(player.classification)
      const maxClassification = activeTeam?.competitionLevel === "International" ? 14.0 : 14.5

      // Check if adding would exceed the limit
      if (newTotal > maxClassification) {
        setSwapErrorMessage(
          `Cannot add player: Total classification would exceed the ${maxClassification.toFixed(1)} limit (${newTotal.toFixed(1)})`,
        )
        return
      }

      // Move player from bench to court
      setPlayersOnCourt((prev) => [...prev, player])
      setPlayersOnBench((prev) => prev.filter((p) => p.id !== player.id))

      // Reset eligible indicators since we've added a player
      setShowEligibleIndicators(false)
      setAvailableClassificationSpace(0)
    } else {
      // Player is being moved from court to bench

      // Calculate the new classification total without this player
      const remainingPlayers = playersOnCourt.filter((p) => p.id !== player.id)
      const remainingClassification = calculateLineupClassification(remainingPlayers)

      // Calculate available space for a replacement
      const maxClassification = activeTeam?.competitionLevel === "International" ? 14.0 : 14.5
      const availableSpace = maxClassification - remainingClassification

      // Set the available space to highlight eligible bench players
      setAvailableClassificationSpace(availableSpace)
      setShowEligibleIndicators(true)

      // Move player from court to bench
      setPlayersOnBench((prev) => [...prev, player])
      setPlayersOnCourt((prev) => prev.filter((p) => p.id !== player.id))
    }
  }

  // Add competition level detection variables
  const isInternational = activeTeam?.competitionLevel === "International"
  const isNational = activeTeam?.competitionLevel === "National"
  const isEuroCup = activeTeam?.competitionLevel === "Eurocup"

  // Update the wouldExceedLimit function to implement the new validation logic
  const wouldExceedLimit = (benchPlayer) => {
    if (!selectedCourtPlayer) return false

    // Get the current total without the selected court player
    const remainingPlayers = playersOnCourt.filter((p) => p.id !== selectedCourtPlayer.id)

    // Add the bench player to create the simulated lineup
    const simulatedLineup = [...remainingPlayers, benchPlayer]

    // Calculate the total classification of the simulated lineup
    const totalClassification = simulatedLineup.reduce(
      (sum, player) => sum + Number.parseFloat(player.classification),
      0,
    )

    // For International competition, just check against 14.0
    if (isInternational) {
      return totalClassification > 14.0
    }

    // For Eurocup and National, apply the new validation logic
    if (isEuroCup || isNational) {
      // Calculate bonuses for the simulated lineup
      const bonuses = calculateBonuses(simulatedLineup)
      const bonusPoints = bonuses.totalBonus

      // NEW VALIDATION LOGIC: Check if (Total Classification - Total Bonus) exceeds 14.5
      if (totalClassification - bonusPoints > 14.5) {
        return true
      }

      // For Eurocup, also check against the 17.0 cap
      if (isEuroCup && totalClassification > 17.0) {
        return true
      }

      // For National, check against the team's custom rules
      if (isNational && activeTeam?.rules) {
        // Check if total classification exceeds the maximum allowed
        if (totalClassification > activeTeam.rules.maxPointsAllowed) {
          return true
        }

        // Check foreign players limit
        const foreignPlayers = simulatedLineup.filter((p) => p.isForeign)
        if (activeTeam.rules.maxForeignPlayers !== -1 && foreignPlayers.length > activeTeam.rules.maxForeignPlayers) {
          return true
        }

        // Check able-bodied players limit
        const ableBodyPlayers = simulatedLineup.filter((p) => p.isAbleBody)
        if (ableBodyPlayers.length > activeTeam.rules.maxAbleBodyPlayers) {
          return true
        }
      }
    }

    return false
  }

  // Add a function to calculate bonuses based on player categories and competition level
  const calculateBonuses = (selectedPlayers) => {
    // Ensure selectedPlayers is an array
    if (!Array.isArray(selectedPlayers) || selectedPlayers.length === 0) {
      return {
        totalBonus: 0,
        details: [],
      }
    }

    // For International teams, no bonuses
    if (isInternational) {
      return {
        totalBonus: 0,
        details: [],
      }
    }

    // For EuroCup, use standard EuroCup rules
    if (isEuroCup) {
      let totalBonus = 0
      let femaleCount = 0
      let juniorMaleCount = 0
      let juniorFemaleCount = 0

      selectedPlayers.forEach((player) => {
        if (!player) return // Skip null/undefined players

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

      // Count players by category
      selectedPlayers.forEach((player) => {
        if (!player) return // Skip null/undefined players

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
      })

      // Apply bonuses based on team rules and limits
      // If max value is -1 (unlimited), apply bonus to all players of that category
      const femaleBonusCount = rules.maxFemales === -1 ? femaleCount : Math.min(femaleCount, rules.maxFemales)
      const juniorBonusCount = rules.maxJuniors === -1 ? juniorMaleCount : Math.min(juniorMaleCount, rules.maxJuniors)
      const juniorFemaleBonusCount =
        rules.maxJuniorFemales === -1 ? juniorFemaleCount : Math.min(juniorFemaleCount, rules.maxJuniorFemales)

      const femaleBonus = femaleBonusCount * (rules.femaleBonus || 0)
      const juniorBonus = juniorBonusCount * (rules.juniorBonus || 0)
      const juniorFemaleBonus = juniorFemaleBonusCount * (rules.juniorFemaleBonus || 0)
      const femaleAbleBodyBonus = femaleAbleBodyCount * (rules.femaleAbleBodyBonus || 0)

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
            bonusPerPlayer: rules.femaleBonus || 0,
            bonus: femaleBonus,
          },
          {
            type: "Junior Male",
            count: juniorMaleCount,
            bonusCount: juniorBonusCount,
            bonusPerPlayer: rules.juniorBonus || 0,
            bonus: juniorBonus,
          },
          {
            type: "Junior Female",
            count: juniorFemaleCount,
            bonusCount: juniorFemaleBonusCount,
            bonusPerPlayer: rules.juniorFemaleBonus || 0,
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

  // Update the handlePlayerSelection function to use the new validation logic
  const handlePlayerSelection = (player, location) => {
    // If clicking on a court player
    if (location === "court") {
      // If this court player is already selected, deselect it
      if (selectedCourtPlayer && selectedCourtPlayer.id === player.id) {
        setSelectedCourtPlayer(null)
        return
      }

      // Otherwise, select this court player and clear any bench selection
      setSelectedCourtPlayer(player)
      setSelectedBenchPlayer(null)

      // Clear any previous error messages
      setSwapErrorMessage("")
      return
    }

    // If clicking on a bench player
    if (location === "bench") {
      // If no court player is selected yet, select this bench player
      if (!selectedCourtPlayer) {
        // If this bench player is already selected, deselect it
        if (selectedBenchPlayer && selectedBenchPlayer.id === player.id) {
          setSelectedBenchPlayer(null)
          return
        }

        // Otherwise, select this bench player
        setSelectedBenchPlayer(player)
        return
      }

      // If a court player is already selected, attempt to swap
      // Check if the swap would exceed the limit using our updated validation logic
      if (wouldExceedLimit(player)) {
        // Get the current total without the selected court player
        const remainingPlayers = playersOnCourt.filter((p) => p.id !== selectedCourtPlayer.id)
        const simulatedLineup = [...remainingPlayers, player]
        const totalClassification = simulatedLineup.reduce((sum, p) => sum + Number.parseFloat(p.classification), 0)

        // Calculate bonuses
        const bonuses = calculateBonuses(simulatedLineup)
        const bonusPoints = bonuses.totalBonus

        // Determine the appropriate error message based on the validation failure
        if (isInternational && totalClassification > 14.0) {
          setSwapErrorMessage(
            `Cannot swap players: Total classification would exceed the 14.0 limit (${totalClassification.toFixed(1)})`,
          )
        } else if ((isEuroCup || isNational) && totalClassification - bonusPoints > 14.5) {
          setSwapErrorMessage(
            `Cannot swap players: Base classification minus bonuses (${(totalClassification - bonusPoints).toFixed(1)}) exceeds the limit of 14.5`,
          )
        } else if (isEuroCup && totalClassification > 17.0) {
          setSwapErrorMessage(
            `Cannot swap players: Total classification (${totalClassification.toFixed(1)}) exceeds the maximum allowed (17.0) for EuroCup`,
          )
        } else if (isNational && activeTeam?.rules && totalClassification > activeTeam.rules.maxPointsAllowed) {
          setSwapErrorMessage(
            `Cannot swap players: Total classification (${totalClassification.toFixed(1)}) exceeds the maximum allowed (${activeTeam.rules.maxPointsAllowed.toFixed(1)}) for National`,
          )
        } else if (isNational && activeTeam?.rules) {
          // Check for other rule violations
          const foreignPlayers = simulatedLineup.filter((p) => p.isForeign)
          if (activeTeam.rules.maxForeignPlayers !== -1 && foreignPlayers.length > activeTeam.rules.maxForeignPlayers) {
            setSwapErrorMessage(
              `Cannot swap players: Maximum ${activeTeam.rules.maxForeignPlayers} foreign players allowed`,
            )
          } else {
            const ableBodyPlayers = simulatedLineup.filter((p) => p.isAbleBody)
            if (ableBodyPlayers.length > activeTeam.rules.maxAbleBodyPlayers) {
              setSwapErrorMessage(
                `Cannot swap players: Maximum ${activeTeam.rules.maxAbleBodyPlayers} able-bodied players allowed`,
              )
            }
          }
        }

        // Mark the bench player as exceeding limit but don't clear selections yet
        setSelectedBenchPlayer(player)

        // Clear selections after 3 seconds
        setTimeout(() => {
          setSelectedCourtPlayer(null)
          setSelectedBenchPlayer(null)
          setSwapErrorMessage("")
        }, 3000)

        return
      }

      // Add swapping animation classes
      const courtPlayerElement = document.querySelector(
        `.player-card.on-court[data-player-id="${selectedCourtPlayer.id}"]`,
      )
      const benchPlayerElement = document.querySelector(`.player-card.on-bench[data-player-id="${player.id}"]`)

      if (courtPlayerElement) courtPlayerElement.classList.add("swapping-out")
      if (benchPlayerElement) benchPlayerElement.classList.add("swapping-in")

      // Perform the swap after a short delay to allow animation to play
      setTimeout(() => {
        // Move court player to bench
        setPlayersOnBench((prev) => [...prev, selectedCourtPlayer])
        setPlayersOnCourt((prev) => prev.filter((p) => p.id !== selectedCourtPlayer.id))

        // Move bench player to court
        setPlayersOnCourt((prev) => [...prev, player])
        setPlayersOnBench((prev) => prev.filter((p) => p.id !== player.id))

        // Clear selections
        setSelectedCourtPlayer(null)
        setSelectedBenchPlayer(null)

        // Show success notification
        setNotification({
          show: true,
          message: `Swapped ${selectedCourtPlayer.name} with ${player.name}`,
        })
        setTimeout(() => setNotification({ show: false, message: "" }), 3000)
      }, 300)
    }
  }

  // Update the isPlayerEligibleForCourt function to use the new validation logic
  const isPlayerEligibleForCourt = (player) => {
    if (!selectedCourtPlayer) return false

    // A player is eligible if swapping wouldn't exceed the limit
    return !wouldExceedLimit(player)
  }

  // Add this function to check if a player is selected
  const isPlayerSelected = (player) => {
    return (
      (selectedCourtPlayer && selectedCourtPlayer.id === player.id) ||
      (selectedBenchPlayer && selectedBenchPlayer.id === player.id)
    )
  }

  // Add a function to handle sharing systems - place this near other handler functions
  const handleShareSystems = () => {
    setShowShareModal(true)
  }

  // Add a function to check if a bench player is eligible for swapping onto the court

  // Helper function to calculate lineup classification total
  const calculateLineupClassification = (players) => {
    return players.reduce((sum, player) => sum + Number.parseFloat(player.classification), 0)
  }

  // Opponent markers state
  const [opponents, setOpponents] = useState([])
  const [draggedOpponent, setDraggedOpponent] = useState(null)
  const [opponentPositions, setOpponentPositions] = useState({})

  // Recording feature states
  // New states for On Court and On Bench sections
  const [selectedLineupId, setSelectedLineupId] = useState("")
  const [playersOnCourt, setPlayersOnCourt] = useState([])
  const [playersOnBench, setPlayersOnBench] = useState([])
  const [playerStats, setPlayerStats] = useState({})

  // Update the teamLineups definition to use the activeTeamId prop
  const teamLineups = lineups.filter((lineup) => lineup.teamId === activeTeamId)

  // Get tactics for the selected lineup
  const getLineupTactics = useCallback(() => {
    if (!selectedLineupId) return []
    return tactics.filter((tactic) => tactic.lineupId === selectedLineupId && tactic.teamId === activeTeamId)
  }, [selectedLineupId, tactics, activeTeamId])

  // Get the current lineup's tactics
  const currentLineupTactics = getLineupTactics()

  const courtRef = useRef(null)

  // Filtered systems based on category
  const filteredSystems = savedSystems.filter((system) => {
    if (categoryFilter === "all") return true
    return system.category === categoryFilter
  })

  // Add event listener to close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (tacticsDropdownRef.current && !tacticsDropdownRef.current.contains(event.target)) {
        setShowTacticsDropdown(false)
      }

      // Check for clicks outside the systems dropdown
      const dropdownButton = document.querySelector(".dropdown-button")
      const systemsDropdown = document.querySelector(".systems-dropdown")

      if (
        showSavedSystemsDropdown &&
        systemsDropdown &&
        dropdownButton &&
        !systemsDropdown.contains(event.target) &&
        !dropdownButton.contains(event.target) &&
        !dropdownButton.contains(event.target)
      ) {
        setShowSavedSystemsDropdown(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowTacticsDropdown(false)
        setShowSavedSystemsDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }
  }, [showSavedSystemsDropdown])

  // Clear court when team changes
  useEffect(() => {
    // Only clear drawings and reset player positions when team changes
    // but preserve opponents and their positions
    setDrawings([])
    setPlayerPositions({})
    setSelectedLineupId("")
    setPlayersOnCourt([])
    setPlayersOnBench([...players])
    setBasketballs([])

    // Don't reset opponents when team changes
    // setOpponents([]);
    // setOpponentPositions({});
  }, [activeTeamId, players])

  // Update court size on window resize
  useEffect(() => {
    const updateCourtSize = () => {
      if (courtRef.current) {
        const { width, height } = courtRef.current.getBoundingClientRect()
        setCourtSize({ width: width, height: height })
      }
    }

    updateCourtSize()
    window.addEventListener("resize", updateCourtSize)

    return () => {
      window.removeEventListener("resize", updateCourtSize)
    }
  }, [])

  // Initialize player positions when players change
  useEffect(() => {
    if (courtSize.width === 0 || courtSize.height === 0) return

    setPlayerPositions((prevPositions) => {
      const newPositions = { ...prevPositions }
      players.forEach((player, index) => {
        if (!newPositions[player.id]) {
          // Position players in a line at the bottom of the court
          const x = (courtSize.width * (index + 1)) / (players.length + 1)
          const y = courtSize.height * 0.8
          newPositions[player.id] = { x, y }
        }
      })
      return newPositions
    })

    // By default, all players should be on bench
    setPlayersOnBench([...players])
    setPlayersOnCourt([])
  }, [players, courtSize.width, courtSize.height])

  // Update players on court and bench when lineup selection changes
  useEffect(() => {
    if (selectedLineupId) {
      const selectedLineup = lineups.find((lineup) => lineup.id === selectedLineupId)
      if (selectedLineup) {
        // Find players in the selected lineup
        const onCourtPlayers = players.filter((player) => selectedLineup.playerIds.includes(player.id))

        // Find players not in the selected lineup
        const onBenchPlayers = players.filter((player) => !selectedLineup.playerIds.includes(player.id))

        setPlayersOnCourt(onCourtPlayers)
        setPlayersOnBench(onBenchPlayers)
      }
    } else {
      // If no lineup is selected, all players are on bench
      setPlayersOnCourt([])
      setPlayersOnBench([...players])
    }
  }, [selectedLineupId, lineups, players])

  const saveRecording = (name) => {
    // This function is no longer needed, redirect to saveSystem
    return saveSystem(name)
  }

  const handlePlayerDragStart = (playerId) => {
    // Store the initial position for undo
    const initialPosition = playerPositions[playerId]
    if (initialPosition) {
      // Track this as the start of a drag operation
      setDraggedPlayer(playerId)
      // We'll track the complete action when the drag ends
    }
  }

  const handlePlayerDragEnd = () => {
    if (draggedPlayer && playerPositions[draggedPlayer]) {
      // Track the completed drag action for undo
      trackAction("player-move", {
        id: draggedPlayer,
        prevPosition: playerPositions[draggedPlayer],
      })
    }
    setDraggedPlayer(null)
  }

  // Add opponent marker
  const addOpponent = () => {
    const newOpponentId = `opponent-${Date.now()}`

    // Position the new opponent in the center of the court
    const newPosition = {
      x: courtSize.width / 2,
      y: courtSize.height / 2,
    }

    setOpponents([...opponents, { id: newOpponentId }])
    setOpponentPositions({
      ...opponentPositions,
      [newOpponentId]: newPosition,
    })

    // Track this action for undo
    trackAction("opponent", {
      action: "add",
      id: newOpponentId,
    })
  }

  // Remove opponent marker
  const removeOpponent = (id) => {
    setOpponents(opponents.filter((opponent) => opponent.id !== id))

    // Remove the position data for this opponent
    const newPositions = { ...opponentPositions }
    delete newPositions[id]
    setOpponentPositions(newPositions)
  }

  // Add a separate function to handle opponent dragging
  const handleOpponentDrag = (e, opponentId) => {
    if (!opponentId || isPlaying) return

    const courtRect = courtRef.current.getBoundingClientRect()
    const x = e.clientX - courtRect.left
    const y = e.clientY - courtRect.top

    // Keep opponent within court bounds
    const clampedX = Math.max(15, Math.min(courtSize.width - 15, x))
    const clampedY = Math.max(15, Math.min(courtSize.height - 15, y))

    setOpponentPositions((prev) => ({
      ...prev,
      [opponentId]: { x: clampedX, y: clampedY },
    }))
  }

  // Add basketball to the court
  const addBasketball = (x, y) => {
    const newBasketball = {
      id: `ball-${Date.now()}`,
      position: { x, y },
    }

    setBasketballs((prev) => [...prev, newBasketball])

    // Track this action for undo
    trackAction("basketball-add", { ball: newBasketball })
  }

  // Handle basketball drag start
  const handleBasketballDragStart = (ballId) => {
    if (isPlaying) return

    // Find the ball
    const ball = basketballs.find((b) => b.id === ballId)
    if (ball) {
      // Store initial position for undo
      setDraggedBasketball({
        id: ballId,
        initialPosition: { ...ball.position },
      })
    }
  }

  // Handle basketball drag end
  const handleBasketballDragEnd = () => {
    if (draggedBasketball) {
      // Find the current position
      const ball = basketballs.find((b) => b.id === draggedBasketball.id)
      if (ball) {
        // Track the move for undo
        trackAction("basketball-move", {
          id: draggedBasketball.id,
          prevPosition: draggedBasketball.initialPosition,
        })
      }
      setDraggedBasketball(null)
    }
  }

  // Handle mouse down for drawing
  const handleMouseDown = (e) => {
    if (disabled || drawMode === "none" || isPlaying) return

    const courtRect = courtRef.current.getBoundingClientRect()
    const x = e.clientX - courtRect.left
    const y = e.clientY - courtRect.top

    setIsDrawing(true)
    setStartPoint({ x, y })

    if (drawMode === "line" || drawMode === "arrow") {
      // For line and arrow, we'll just set the start point and wait for mouse up
      setCurrentDrawing({
        type: drawMode,
        points: [
          { x, y },
          { x, y },
        ], // Start and end at the same point initially
        color: "#ff0000",
        width: 2,
      })
    } else if (drawMode === "pen") {
      // For pen, we'll create a path that will be updated as the mouse moves
      setCurrentDrawing({
        type: drawMode,
        points: [{ x, y }],
        color: "#ff0000",
        width: 2,
      })
    } else if (drawMode === "erase") {
      // For eraser, we'll create a path as the user moves
      setCurrentDrawing({
        type: drawMode,
        points: [{ x, y }],
        color: "#ff0000",
        width: 20,
      })
    }
  }

  // Handle mouse move for drawing
  const handleMouseMoveDrawing = (e) => {
    if (isPlaying) return

    const courtRect = courtRef.current.getBoundingClientRect()
    const x = e.clientX - courtRect.left
    const y = e.clientY - courtRect.top

    if (!isDrawing || !currentDrawing) return

    if (drawMode === "line" || drawMode === "arrow") {
      // For line and arrow, we update the end point as the mouse moves
      setCurrentDrawing((prev) => ({
        ...prev,
        points: [prev.points[0], { x, y }],
      }))
    } else if (drawMode === "pen" || drawMode === "erase") {
      // For pen and eraser, we add points to the path
      // Use point thinning algorithm to avoid too many points
      const lastPoint = currentDrawing.points[currentDrawing.points.length - 1]
      const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2))

      // Only add points if they're far enough apart (prevents too many points)
      if (distance > 1) {
        const updatedDrawing = {
          ...currentDrawing,
          points: [...currentDrawing.points, { x, y }],
        }

        setCurrentDrawing(updatedDrawing)
      }
    }
  }

  // Enhance the handleMouseUp function to track arrow count
  const handleMouseUp = () => {
    if (isDrawing && currentDrawing && !isPlaying) {
      if (drawMode === "erase") {
        // For eraser, remove drawings that intersect with the eraser path
        const eraserPath = currentDrawing.points

        // Remove drawings that intersect with the eraser path
        const updatedDrawings = drawings.filter((drawing) => !doPathsIntersect(drawing.points, eraserPath))
        setDrawings(updatedDrawings)

        // Also check if the eraser path intersects with any opponent markers
        // and remove those opponents
        const opponentsToRemove = []

        opponents.forEach((opponent) => {
          const opponentPos = opponentPositions[opponent.id]
          if (opponentPos) {
            for (const point of eraserPath) {
              const distance = Math.sqrt(Math.pow(point.x - opponentPos.x, 2) + Math.pow(point.y - opponentPos.y, 2))
              if (distance < 15) {
                opponentsToRemove.push(opponent.id)
                break
              }
            }
          }
        })

        if (opponentsToRemove.length > 0) {
          const updatedOpponents = opponents.filter((opponent) => !opponentsToRemove.includes(opponent.id))
          setOpponents(updatedOpponents)

          // Also remove the positions of the removed opponents
          const newOpponentPositions = { ...opponentPositions }
          opponentsToRemove.forEach((id) => {
            delete newOpponentPositions[id]
          })
          setOpponentPositions(newOpponentPositions)
        }

        // Check if the eraser path intersects with any basketballs
        const basketballsToRemove = []

        basketballs.forEach((ball) => {
          for (const point of eraserPath) {
            const distance = Math.sqrt(Math.pow(point.x - ball.position.x, 2) + Math.pow(point.y - ball.position.y, 2))
            if (distance < 15) {
              basketballsToRemove.push(ball.id)
              break
            }
          }
        })

        if (basketballsToRemove.length > 0) {
          setBasketballs((prev) => prev.filter((ball) => !basketballsToRemove.includes(ball.id)))
        }

        // Automatically deactivate eraser after use
        setDrawMode("none")
        setEraserMode(false)
      } else {
        // For drawing tools, add the current drawing
        let finalDrawing = currentDrawing

        // If this is an arrow, add number and increment count
        if (drawMode === "arrow") {
          // Increment arrow count
          const newArrowCount = arrowCount + 1

          // Add arrow number to the drawing data
          finalDrawing = {
            ...currentDrawing,
            arrowNumber: newArrowCount,
          }

          setArrowCount(newArrowCount)
        }

        const updatedDrawings = [...drawings, finalDrawing]
        setDrawings(updatedDrawings)

        // Track this action for undo
        trackAction("drawing", { drawing: finalDrawing })
      }

      setCurrentDrawing(null)
      setIsDrawing(false)
      setStartPoint(null)
    }
  }

  // Update the renderArrowhead function to properly render the arrowhead
  const renderArrowhead = (drawing) => {
    if (drawing.type !== "arrow" || drawing.points.length < 2) return null

    const start = drawing.points[0]
    const end = drawing.points[1]
    const arrowheadPoints = calculateArrowhead(start, end)

    return (
      <polyline
        points={arrowheadPoints.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={drawing.color}
        strokeWidth={drawing.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  // Capture system state when opening the save form
  const handleOpenSaveForm = () => {
    // Store current system state
    setSavedSystemState({
      drawings: [...drawings],
      opponents: [...opponents],
      opponentPositions: { ...opponentPositions },
      basketballs: [...basketballs],
      playerPositions: { ...playerPositions },
    })

    // Set a flag to show the form
    setShowStaticNamePrompt(true)
  }

  return (
    <div className="coaching-board-container">
      <div className="section court-visualization">
        <h2 className="section-title">Court Visualization</h2>

        {/* Unified control bar */}
        <div className="control-bar">
          {/* Drawing tools group */}
          <div className="tool-group">
            <div className="tool-button-container">
              <button
                className={`tool-button ${drawMode === "line" ? "active" : ""}`}
                onClick={() => {
                  setDrawMode("line")
                  setEraserMode(false)
                }}
                title="Line"
                disabled={disabled || isPlaying}
              >
                <span className="icon-line">—</span>
              </button>
              <span className="tool-label">Line</span>
            </div>

            <div className="tool-button-container">
              <button
                className={`tool-button ${drawMode === "pen" ? "active" : ""}`}
                onClick={() => {
                  setDrawMode("pen")
                  setEraserMode(false)
                }}
                title="Pen"
                disabled={disabled || isPlaying}
              >
                <span className="icon-pen">✎</span>
              </button>
              <span className="tool-label">Pen</span>
            </div>

            <div className="tool-button-container">
              <button
                className={`tool-button ${drawMode === "arrow" ? "active" : ""}`}
                onClick={() => {
                  setDrawMode("arrow")
                  setEraserMode(false)
                }}
                title="Arrow"
                disabled={disabled || isPlaying}
              >
                <span className="icon-arrow">→</span>
              </button>
              <span className="tool-label">Arrow</span>
            </div>

            <div className="tool-button-container">
              <button
                className={`tool-button ${eraserMode ? "active" : ""}`}
                onClick={toggleEraserMode}
                title="Eraser (tap to toggle)"
                disabled={disabled || isPlaying}
              >
                <span className="icon-eraser">⌫</span>
              </button>
              <span className="tool-label">Erase</span>
            </div>

            <div className="tool-button-container">
              <button
                className="tool-button"
                onClick={undoLastAction}
                title="Undo Last Action"
                disabled={disabled || isPlaying || actionHistory.length === 0}
              >
                <span className="icon-undo">↩</span>
              </button>
              <span className="tool-label">Undo</span>
            </div>

            <div className="tool-button-container">
              <button
                className="tool-button"
                onClick={clearDrawings}
                title="Clear Drawings"
                disabled={disabled || isPlaying}
              >
                <span className="icon-trash">🗑</span>
              </button>
              <span className="tool-label">Clear</span>
            </div>

            <div className="tool-button-container">
              <button
                className="tool-button"
                onClick={() => {
                  // Add a basketball directly at the center of the court
                  const x = courtSize.width / 2
                  const y = courtSize.height / 2
                  addBasketball(x, y)
                }}
                title="Add Basketball"
                disabled={disabled || isPlaying}
              >
                <span className="icon-basketball">🏀</span>
              </button>
              <span className="tool-label">Ball</span>
            </div>

            <div className="tool-button-container">
              <button
                className="tool-button"
                onClick={() => {
                  const courtElement = courtRef.current
                  if (courtElement?.requestFullscreen) {
                    courtElement.requestFullscreen()
                  }
                }}
                title="Full Screen"
                disabled={disabled}
              >
                <span className="icon-fullscreen">⛶</span>
              </button>
              <span className="tool-label">Fullscreen</span>
            </div>
          </div>

          {/* Opponent tools group */}
          <div className="tool-group">
            <button className="opponent-button" onClick={addOpponent} disabled={disabled || isPlaying}>
              Add Opponent
              <span className="opponent-count">{opponents.length}</span>
            </button>
          </div>

          {/* Recording and Systems tools group */}
          <div className="tool-group">
            {/* Save System Button */}
            <button className="opponent-button" onClick={handleOpenSaveForm} disabled={disabled}>
              Save System
            </button>

            {/* Add the Share Systems Button here */}
            <button className="opponent-button share-button" onClick={handleShareSystems} disabled={disabled}>
              Share Systems
            </button>

            {/* Saved Systems Dropdown */}
            <div className="dropdown-container">
              <button
                className="dropdown-button"
                onClick={() => {
                  setShowSavedSystemsDropdown(!showSavedSystemsDropdown)
                }}
                disabled={disabled || savedSystems.filter((s) => s.isStatic).length === 0}
              >
                {savedSystems.filter((s) => s.isStatic).length > 0
                  ? `Saved Systems (${savedSystems.filter((s) => s.isStatic).length})`
                  : "Saved Systems"}
                <span className="dropdown-arrow">▼</span>
              </button>

              {showSavedSystemsDropdown && (
                <div className="dropdown-menu systems-dropdown">
                  {/* Static Systems */}
                  <div className="systems-section">
                    <div className="systems-section-header">Static Systems</div>
                    <div className="systems-list">
                      {savedSystems.filter((s) => s.isStatic).length > 0 ? (
                        savedSystems
                          .filter((s) => s.isStatic)
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((system) => (
                            <div key={system.id} className="system-item">
                              <span className="system-name">{system.name}</span>
                              <div className="system-actions">
                                <button
                                  className="system-action-button"
                                  onClick={() => {
                                    loadSystem(system)
                                    setShowSavedSystemsDropdown(false)
                                  }}
                                >
                                  Load
                                </button>
                                <button
                                  className="system-action-button delete"
                                  onClick={() => {
                                    deleteSystem(system.id)
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="empty-systems-message">No static systems saved</div>
                      )}
                    </div>
                  </div>

                  {/* No Dynamic Systems Section */}
                </div>
              )}
            </div>
          </div>
        </div>

        {showStaticNamePrompt && (
          <div className="system-save-overlay">
            <div className="system-save-form">
              <h3>Save Static System</h3>
              <div className="form-group">
                <label htmlFor="staticSystemName">System Name</label>
                <input
                  id="staticSystemName"
                  type="text"
                  value={staticSystemName}
                  onChange={(e) => setStaticSystemName(e.target.value)}
                  placeholder="Enter a name for this system"
                  autoComplete="off"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => {
                    // Restore original state if canceling
                    if (savedSystemState) {
                      setDrawings(savedSystemState.drawings)
                      setOpponents(savedSystemState.opponents)
                      setOpponentPositions(savedSystemState.opponentPositions)
                      setBasketballs(savedSystemState.basketballs)
                      setPlayerPositions(savedSystemState.playerPositions)
                    }
                    setStaticSystemName("")
                    setShowStaticNamePrompt(false)
                    setSavedSystemState(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => {
                    // Use the saved state for the system, not the current state which might be affected by the bug
                    if (savedSystemState && staticSystemName.trim()) {
                      // Create a system object using the saved state
                      const system = {
                        id: Date.now().toString(),
                        name: staticSystemName,
                        drawings: savedSystemState.drawings,
                        playerPositions: savedSystemState.playerPositions,
                        opponentPositions: savedSystemState.opponentPositions,
                        opponents: savedSystemState.opponents,
                        basketballs: savedSystemState.basketballs,
                        isStatic: true,
                        createdAt: new Date().toISOString(),
                      }

                      // Add to saved systems
                      setSavedSystems((prevSystems) => [...prevSystems, system])

                      // Show success notification
                      setNotification({
                        show: true,
                        message: `System "${staticSystemName}" saved successfully!`,
                      })
                      setTimeout(() => setNotification({ show: false, message: "" }), 3000)

                      // Clear the system name and close the form
                      setStaticSystemName("")
                      setShowStaticNamePrompt(false)
                      setSavedSystemState(null)
                    } else {
                      // Show error if no name provided
                      setNotification({
                        show: true,
                        message: "Please enter a name for your system",
                      })
                      setTimeout(() => setNotification({ show: false, message: "" }), 3000)
                    }
                  }}
                >
                  Save System
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className={`court-container ${eraserMode ? "eraser-mode" : ""}`}
          ref={courtRef}
          onMouseDown={handleMouseDown}
          onClick={eraserMode ? handleEraserTap : undefined}
          onMouseMove={(e) => {
            // Handle drawing
            if (isDrawing && !isPlaying) {
              handleMouseMove(e)
            }

            // Handle opponent dragging - optimized for responsiveness
            if (draggedOpponent && !isPlaying) {
              handleOpponentDrag(e, draggedOpponent)
            }

            // Handle player dragging - optimized for responsiveness
            if (draggedPlayer && !isPlaying) {
              const courtRect = courtRef.current.getBoundingClientRect()
              const x = e.clientX - courtRect.left
              const y = e.clientY - courtRect.top

              // Keep player within court bounds with improved responsiveness
              const clampedX = Math.max(15, Math.min(courtSize.width - 15, x))
              const clampedY = Math.max(15, Math.min(courtSize.height - 15, y))

              // Update position immediately without additional checks
              setPlayerPositions((prev) => ({
                ...prev,
                [draggedPlayer]: { x: clampedX, y: clampedY },
              }))
            }

            // Handle basketball dragging with improved recording
            if (draggedBasketball && !isPlaying) {
              const courtRect = courtRef.current.getBoundingClientRect()
              const x = e.clientX - courtRect.left
              const y = e.clientY - courtRect.top

              // Keep ball within court bounds
              const clampedX = Math.max(15, Math.min(courtSize.width - 15, x))
              const clampedY = Math.max(15, Math.min(courtSize.height - 15, y))

              // Update basketball position
              setBasketballs((prev) => {
                return prev.map((ball) => {
                  if (ball.id === draggedBasketball.id) {
                    return {
                      ...ball,
                      position: { x: clampedX, y: clampedY },
                    }
                  }
                  return ball
                })
              })
            }
          }}
          onMouseUp={(e) => {
            // Handle drawing end
            handleMouseUp()

            // Release any dragged opponent
            if (draggedOpponent) {
              setDraggedOpponent(null)
            }

            // Release any dragged player
            if (draggedPlayer) {
              handlePlayerDragEnd()
            }

            // Release any dragged basketball
            if (draggedBasketball) {
              handleBasketballDragEnd()
            }
          }}
          onMouseLeave={(e) => {
            // Handle mouse leaving the court
            handleMouseUp()

            // Release any dragged opponent
            if (draggedOpponent) {
              setDraggedOpponent(null)
            }

            // Release any dragged player
            if (draggedPlayer) {
              handlePlayerDragEnd()
            }

            // Release any dragged basketball
            if (draggedBasketball) {
              handleBasketballDragEnd()
            }
          }}
          // Add touch event handlers for mobile/tablet support
          onTouchStart={(e) => {
            // Convert touch event to mouse event format
            const touch = e.touches[0]
            const mouseEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
              stopPropagation: () => e.stopPropagation(),
            }

            // Call the mouse event handler with our converted event
            handleMouseDown(mouseEvent)

            // Handle eraser tap if in eraser mode
            if (eraserMode) {
              handleEraserTap(mouseEvent)
            }
          }}
          onTouchMove={(e) => {
            if (!e.touches[0]) return

            const touch = e.touches[0]
            const mouseEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
              stopPropagation: () => e.stopPropagation(),
            }

            // Handle drawing
            if (isDrawing && !isPlaying) {
              handleMouseMove(mouseEvent)
            }

            // Handle opponent dragging
            if (draggedOpponent && !isPlaying) {
              handleOpponentDrag(mouseEvent, draggedOpponent)
            }

            // Handle player dragging
            if (draggedPlayer && !isPlaying) {
              const courtRect = courtRef.current.getBoundingClientRect()
              const x = touch.clientX - courtRect.left
              const y = touch.clientY - courtRect.top

              // Keep player within court bounds
              const clampedX = Math.max(15, Math.min(courtSize.width - 15, x))
              const clampedY = Math.max(15, Math.min(courtSize.height - 15, y))

              // Update position
              setPlayerPositions((prev) => ({
                ...prev,
                [draggedPlayer]: { x: clampedX, y: clampedY },
              }))
            }

            // Handle basketball dragging
            if (draggedBasketball && !isPlaying) {
              const courtRect = courtRef.current.getBoundingClientRect()
              const x = touch.clientX - courtRect.left
              const y = touch.clientY - courtRect.top

              // Keep ball within court bounds
              const clampedX = Math.max(15, Math.min(courtSize.width - 15, x))
              const clampedY = Math.max(15, Math.min(courtSize.height - 15, y))

              // Update basketball position
              setBasketballs((prev) => {
                return prev.map((ball) => {
                  if (ball.id === draggedBasketball.id) {
                    return {
                      ...ball,
                      position: { x: clampedX, y: clampedY },
                    }
                  }
                  return ball
                })
              })
            }
          }}
          onTouchEnd={(e) => {
            // Handle drawing end
            handleMouseUp()

            // Release any dragged opponent
            if (draggedOpponent) {
              setDraggedOpponent(null)
            }

            // Release any dragged player
            if (draggedPlayer) {
              handlePlayerDragEnd()
            }

            // Release any dragged basketball
            if (draggedBasketball) {
              handleBasketballDragEnd()
            }
          }}
        >
          <BasketballCourt />

          {/* Render drawings */}
          <svg className="drawings-layer">
            {drawings.map((drawing, index) => (
              <g key={index}>
                <polyline
                  points={drawing.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={drawing.color}
                  strokeWidth={drawing.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {drawing.type === "arrow" && renderArrowhead(drawing)}
                {/* Add arrow number text */}
                {drawing.type === "arrow" && drawing.arrowNumber && drawing.points.length >= 1 && (
                  <text
                    x={drawing.points[0].x - 8}
                    y={drawing.points[0].y - 8}
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="0.5"
                    fontSize="12px"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {drawing.arrowNumber}
                  </text>
                )}
              </g>
            ))}

            {currentDrawing && (
              <g>
                <polyline
                  points={currentDrawing.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={currentDrawing.color}
                  strokeWidth={currentDrawing.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {currentDrawing.type === "arrow" && renderArrowhead(currentDrawing)}
              </g>
            )}
          </svg>

          {/* Render basketballs */}
          <div className="basketballs-layer">
            {basketballs.map((ball) => (
              <div
                key={ball.id}
                className="basketball-marker"
                style={{
                  left: `${ball.position.x}px`,
                  top: `${ball.position.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
                onMouseDown={(e) => {
                  if (isPlaying) return
                  e.stopPropagation()
                  handleBasketballDragStart(ball.id)
                }}
                onTouchStart={(e) => {
                  if (isPlaying) return
                  e.stopPropagation()
                  handleBasketballDragStart(ball.id)
                }}
              />
            ))}
          </div>

          {/* Render opponent markers */}
          <div className="opponents-layer">
            {opponents.map((opponent) => (
              <div
                key={opponent.id}
                className="opponent-marker"
                style={{
                  left: `${opponentPositions[opponent.id]?.x || 0}px`,
                  top: `${opponentPositions[opponent.id]?.y || 0}px`,
                  backgroundColor: draggedOpponent === opponent.id ? "#ff6666" : "#ff0000",
                }}
                onMouseDown={(e) => {
                  if (isPlaying) return
                  e.stopPropagation()
                  setDraggedOpponent(opponent.id)
                }}
                onMouseUp={(e) => {
                  // Just release the drag without removing the opponent
                  setDraggedOpponent(null)
                  e.stopPropagation()
                }}
                // Separate click handler for removal - only triggered on actual clicks, not drags
                onDoubleClick={(e) => {
                  removeOpponent(opponent.id)
                  e.stopPropagation()
                }}
                onTouchStart={(e) => {
                  if (isPlaying) return
                  e.stopPropagation()
                  setDraggedOpponent(opponent.id)
                }}
                onTouchEnd={(e) => {
                  // Just release the drag without removing the opponent
                  setDraggedOpponent(null)
                  e.stopPropagation()
                }}
                title="Drag to move, double-click to remove"
              >
                <span className="opponent-x">×</span>
              </div>
            ))}
          </div>

          {/* Render players - Only show players that are on court */}
          <div className="players-layer">
            {playersOnCourt.map((player) => (
              <div
                key={player.id}
                className={`player-marker ${isPlayerSelected(player) ? "selected" : ""}`}
                style={{
                  left: `${playerPositions[player.id]?.x || 0}px`,
                  top: `${playerPositions[player.id]?.y || 0}px`,
                  backgroundColor: draggedPlayer === player.id ? "#ff9800" : "#4caf50",
                }}
                onMouseDown={(e) => {
                  if (isPlaying) return
                  e.stopPropagation()
                  handlePlayerDragStart(player.id)
                }}
                onTouchStart={(e) => {
                  if (isPlaying) return
                  e.stopPropagation()
                  handlePlayerDragStart(player.id)
                }}
              >
                <span className="player-initials">{player.name.substring(0, 2).toUpperCase()}</span>
                <span className="player-classification">{player.classification}</span>
                {activeTeam?.competitionLevel === "Eurocup" && player.category !== "Senior" && (
                  <span className={`player-category ${player.category.toLowerCase().replace(" ", "-")}`}>
                    {player.category === "Female" ? "F" : player.category === "Junior" ? "J" : "JF"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tactics Section */}
      {currentLineup && lineupTactics.length > 0 && (
        <div className="section tactics-section">
          <h2 className="section-title">Lineup Tactics</h2>
          <div className="tactics-list-container">
            <div className="tactics-list-grid">
              {lineupTactics.map((tactic) => (
                <div key={tactic.id} className="tactic-card">
                  <div className="tactic-card-header">
                    <h3 className="tactic-card-title">{tactic.name}</h3>
                  </div>
                  {tactic.description && <div className="tactic-card-description">{tactic.description}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* On Court Section */}
      <div className="section on-court-section">
        <h2 className="section-title">On Court</h2>
        <div className="lineup-selector">
          <div className="lineup-selector-controls">
            <label htmlFor="lineup-select">Select Lineup:</label>
            <select
              id="lineup-select"
              value={selectedLineupId}
              onChange={handleLineupChange}
              className="lineup-dropdown"
            >
              <option value="">No Lineup Selected</option>
              {teamLineups.map((lineup) => (
                <option key={lineup.id} value={lineup.id}>
                  {lineup.name} ({lineup.totalClassification.toFixed(1)})
                </option>
              ))}
            </select>
          </div>

          {/* Add tactics button and dropdown */}
          {selectedLineupId && (
            <div style={{ position: "relative" }} ref={tacticsDropdownRef}>
              <button
                className="lineup-tactics-button"
                onClick={() => setShowTacticsDropdown(!showTacticsDropdown)}
                disabled={currentLineupTactics.length === 0}
              >
                View Tactics ({currentLineupTactics.length})
              </button>

              {showTacticsDropdown && currentLineupTactics.length > 0 && (
                <div className="tactics-dropdown">
                  {currentLineupTactics.map((tactic) => (
                    <button key={tactic.id} className="tactics-dropdown-item" onClick={() => loadTactic(tactic)}>
                      {tactic.name}
                    </button>
                  ))}
                </div>
              )}

              {showTacticsDropdown && currentLineupTactics.length === 0 && (
                <div className="tactics-dropdown">
                  <div className="tactics-dropdown-empty">No tactics available</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="players-list-grid">
          {playersOnCourt.length === 0 ? (
            <p className="empty-message">No players on court</p>
          ) : (
            playersOnCourt.map((player) => (
              <div
                key={player.id}
                data-player-id={player.id}
                className={`player-card on-court ${isPlayerSelected(player) ? "selected" : ""}`}
                onClick={() => handlePlayerSelection(player, "court")}
              >
                <div className="player-content">
                  <h3 className="player-name">{player.name}</h3>
                  <div className="player-classification">{player.classification}</div>
                  {activeTeam?.competitionLevel === "Eurocup" && player.category !== "Senior" && (
                    <div className="player-category-indicator">
                      {player.category === "Female"
                        ? "Female"
                        : player.category === "Junior"
                          ? "Junior"
                          : "Junior Female"}
                    </div>
                  )}
                  {!selectedCourtPlayer && <div className="player-instruction">Click to select</div>}
                  {selectedCourtPlayer && selectedCourtPlayer.id === player.id && (
                    <div className="player-instruction">Click again to deselect</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* On Bench Section */}
      <div className="section on-bench-section">
        <h2 className="section-title">On Bench</h2>

        <div className="players-list-container">
          {playersOnBench.length === 0 ? (
            <p className="empty-message">No players on bench</p>
          ) : (
            <div className="players-list-grid">
              {playersOnBench.map((player) => {
                const exceedsLimit = selectedCourtPlayer && wouldExceedLimit(player)

                return (
                  <div
                    key={player.id}
                    data-player-id={player.id}
                    className={`player-card on-bench ${isPlayerSelected(player) ? "selected" : ""} ${
                      selectedCourtPlayer ? "swap-ready" : ""
                    }`}
                    onClick={() => handlePlayerSelection(player, "bench")}
                  >
                    <div className="player-content">
                      <h3 className="player-name">{player.name}</h3>
                      <div className="player-classification">{player.classification}</div>
                      {activeTeam?.competitionLevel === "Eurocup" && player.category !== "Senior" && (
                        <div className="player-category-indicator">
                          {player.category === "Female"
                            ? "Female"
                            : player.category === "Junior"
                              ? "Junior"
                              : "Junior Female"}
                        </div>
                      )}
                      {exceedsLimit && <div className="classification-warning">Exceeds Limit</div>}

                      {selectedCourtPlayer ? (
                        <div className="player-instruction">Click to swap</div>
                      ) : selectedBenchPlayer && selectedBenchPlayer.id === player.id ? (
                        <div className="player-instruction">Click again to deselect</div>
                      ) : (
                        <div className="player-instruction">Click to select</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {swapErrorMessage && (
        <div className="swap-error-message">
          {swapErrorMessage}
          <button className="close-error-button" onClick={() => setSwapErrorMessage("")}>
            ×
          </button>
        </div>
      )}
      {notification.show && <div className="notification">{notification.message}</div>}
      {tacticToDisplay && <TacticDisplayModal tactic={tacticToDisplay} onClose={() => setTacticToDisplay(null)} />}
      {showShareModal && (
        <ShareSystemsModal
          onClose={() => setShowShareModal(false)}
          savedSystems={savedSystems.filter((s) => s.isStatic)}
          players={players}
          teamName={activeTeam?.name || ""}
          activeTeamId={activeTeamId}
          courtRef={courtRef}
        />
      )}
    </div>
  )
}

export default CoachingBoard


