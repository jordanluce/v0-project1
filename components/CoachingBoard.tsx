"use client"

// Make sure CSS import is at the top of the file
import "./CoachingBoard.css"

import { useState, useRef, useEffect, useContext, useCallback } from "react"
import { AppContext } from "./App"
import BasketballCourt from "./BasketballCourt"
import TacticDisplayModal from "./TacticDisplayModal"

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
  const [showRecordDropdown, setShowRecordDropdown] = useState(false)
  const [showSavedSystemsDropdown, setShowSavedSystemsDropdown] = useState(false)
  const [staticSystemName, setStaticSystemName] = useState("")
  const [showStaticNamePrompt, setShowStaticNamePrompt] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(0.75) // 0.5 = slow, 0.75 = normal, 2 = fast
  const [notification, setNotification] = useState({ show: false, message: "" })

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

  // Add these new state variables after the existing state declarations
  const [recordingPrimed, setRecordingPrimed] = useState(false)
  const [recordingActive, setRecordingActive] = useState(false)
  const [lastActionTimestamp, setLastActionTimestamp] = useState(null)
  const [previousFrameState, setPreviousFrameState] = useState(null)
  const [significantChangeThreshold] = useState(2) // Minimum pixel change to consider recording a new frame

  // Add a new useRef to track the last selected lineup ID
  // Add this after the other useRef declarations (around line 70-80)
  const lastSelectedLineupIdRef = useRef("")

  // Add a function to track actions for the undo feature
  const trackAction = (actionType, data) => {
    setActionHistory((prev) => [...prev, { type: actionType, data }])
  }

  // Add a function to undo the last action
  const undoLastAction = () => {
    if (actionHistory.length === 0) return

    const lastAction = actionHistory[actionHistory.length - 1]

    switch (lastAction.type) {
      case "drawing":
        // Remove the last drawing
        setDrawings((prev) => prev.slice(0, -1))
        break
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
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordedFrames, setRecordedFrames] = useState([])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [newSystemName, setNewSystemName] = useState("")
  const [newSystemCategory, setNewSystemCategory] = useState("offense")
  const [categoryFilter, setCategoryFilter] = useState("all")

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

  const playbackRef = useRef(null)
  const courtRef = useRef(null)
  const recordingIntervalRef = useRef(null)

  // Filtered systems based on category
  const filteredSystems = savedSystems.filter((system) => {
    if (categoryFilter === "all") return true
    return system.category === categoryFilter
  })

  // Handle click outside tactics dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (tacticsDropdownRef.current && !tacticsDropdownRef.current.contains(event.target)) {
        setShowTacticsDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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

  // Replace the startRecording function with this improved version
  const startRecording = () => {
    // Instead of starting recording immediately, we prime it to start on first action
    setRecordingPrimed(true)
    setRecordingActive(false)
    setRecordedFrames([])
    setNotification({ show: true, message: "Recording primed - perform an action to start" })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  // Add this new function to actually start the recording when an action is detected
  const activateRecording = () => {
    if (!recordingPrimed) return

    setRecordingActive(true)
    setIsRecording(true)
    setRecordingStartTime(Date.now())

    // Store initial state as first frame
    const initialFrame = {
      timestamp: 0,
      playerPositions: { ...playerPositions },
      opponentPositions: { ...opponentPositions },
      opponents: [...opponents],
      drawings: [...drawings],
      basketballs: [...basketballs],
    }

    setRecordedFrames([initialFrame])
    setPreviousFrameState(initialFrame)
    setLastActionTimestamp(Date.now())

    // Show notification that recording has started
    setNotification({ show: true, message: "Recording started!" })
    setTimeout(() => setNotification({ show: false, message: "" }), 2000)
  }

  // Replace the stopRecording function with this improved version
  const stopRecording = () => {
    setIsRecording(false)
    setRecordingPrimed(false)
    setRecordingActive(false)

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    // Only show save form if we have meaningful frames (more than just the initial state)
    if (recordedFrames.length > 1) {
      // Preserve the current lineup selection when showing the save form
      const currentLineupSelection = selectedLineupId

      setShowSaveForm(true)

      // Ensure the lineup selection is maintained
      if (currentLineupSelection) {
        setSelectedLineupId(currentLineupSelection)
      }
    } else {
      setNotification({ show: true, message: "No actions recorded. Try again." })
      setTimeout(() => setNotification({ show: false, message: "" }), 3000)
    }
  }

  // Remove the original captureFrameIfNeeded function (around line 300-330)
  // and keep only the optimized version that's defined later in the code.
  // Delete this function:

  // Also remove the original hasSignificantChanges function (around line 250-300)
  // and keep only the optimized version that's defined later in the code.
  // Delete this function:

  // Modify the recording useEffect to use our improved logic
  // Replace the existing recording useEffect with this one

  // Define captureFrameIfNeeded here
  const captureFrameIfNeeded = () => {
    if (!recordingActive || !isRecording) return

    const currentTime = Date.now()
    const elapsedTime = currentTime - recordingStartTime

    // Check if enough time has passed since the last frame
    if (lastActionTimestamp && currentTime - lastActionTimestamp < 23) {
      // 100ms = ~10fps - don't capture too frequently
      return
    }

    // Check if there are significant changes since the last frame
    if (previousFrameState && !hasSignificantChanges(previousFrameState)) {
      return
    }

    // Capture the current state
    const newFrame = {
      timestamp: elapsedTime,
      playerPositions: { ...playerPositions },
      opponentPositions: { ...opponentPositions },
      opponents: [...opponents],
      drawings: [...drawings],
      basketballs: [...basketballs],
    }

    // Update recorded frames and last action timestamp
    setRecordedFrames((prev) => [...prev, newFrame])
    setPreviousFrameState(newFrame)
    setLastActionTimestamp(currentTime)
  }

  // Define hasSignificantChanges here
  const hasSignificantChanges = (previousFrame) => {
    // Check player positions
    for (const playerId in playerPositions) {
      if (!previousFrame.playerPositions[playerId]) return true // New player
      const dx = playerPositions[playerId].x - previousFrame.playerPositions[playerId].x
      const dy = playerPositions[playerId].y - previousFrame.playerPositions[playerId].y
      if (Math.abs(dx) > significantChangeThreshold || Math.abs(dy) > significantChangeThreshold) return true
    }

    // Check opponent positions
    for (const opponentId in opponentPositions) {
      if (!previousFrame.opponentPositions[opponentId]) return true // New opponent
      const dx = opponentPositions[opponentId].x - previousFrame.opponentPositions[opponentId].x
      const dy = opponentPositions[opponentId].y - previousFrame.opponentPositions[opponentId].y
      if (Math.abs(dx) > significantChangeThreshold || Math.abs(dy) > significantChangeThreshold) return true
    }

    // Check for new opponents
    if (opponents.length !== previousFrame.opponents.length) return true

    // Check for new drawings
    if (drawings.length !== previousFrame.drawings.length) return true

    // Check for new basketballs
    if (basketballs.length !== previousFrame.basketballs.length) return true

    return false
  }

  useEffect(() => {
    if (recordingActive && isRecording) {
      // Use requestAnimationFrame for smoother recording
      let animationFrameId

      const recordFrame = () => {
        captureFrameIfNeeded() // This should now refer to the optimized version
        animationFrameId = requestAnimationFrame(recordFrame)
      }

      animationFrameId = requestAnimationFrame(recordFrame)

      return () => {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [recordingActive, isRecording, playerPositions, opponentPositions, opponents, drawings, basketballs])

  // Playback functionality
  useEffect(() => {
    if (isPlaying && recordedFrames.length > 0) {
      // Calculate the actual interval based on playback speed
      const interval = 1000 / (30 * playbackSpeed) // Base on 30fps, adjusted by speed

      playbackRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= recordedFrames.length - 1) {
            clearInterval(playbackRef.current)
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, interval)

      return () => {
        if (playbackRef.current) {
          clearInterval(playbackRef.current)
        }
      }
    }
  }, [isPlaying, recordedFrames, playbackSpeed])

  // Update positions and drawings during playback
  useEffect(() => {
    if (isPlaying && recordedFrames.length > 0) {
      const frame = recordedFrames[currentFrame]

      // If we're not at the last frame, we can interpolate
      if (currentFrame < recordedFrames.length - 1) {
        const nextFrame = recordedFrames[currentFrame + 1]
        const frameDuration = nextFrame.timestamp - frame.timestamp

        // Create a smooth animation between frames using requestAnimationFrame
        let startTime
        let animationFrameId

        let lastRenderTime = 0

        const animate = (timestamp) => { 
          if (!startTime) startTime = timestamp

            // Throttle to ~60fps for smoother rendering on tablets
            if (timestamp - lastRenderTime < 1000 / 60) {
              animationFrameId = requestAnimationFrame(animate)
              return
            }
            lastRenderTime = timestamp

            const elapsed = Math.min(timestamp - startTime, normalizedFrames[normalizedFrames.length - 1].timestamp)
            const progress = Math.min(elapsed / frameDuration, 1)

          // Get interpolated frame
          const interpolatedFrame = getInterpolatedFrame(frame, nextFrame, progress)

          // Update positions
          setPlayerPositions(interpolatedFrame.playerPositions)
          setOpponentPositions(interpolatedFrame.opponentPositions)
          setOpponents(interpolatedFrame.opponents)
          setDrawings(interpolatedFrame.drawings)
          setBasketballs(interpolatedFrame.basketballs)

          // Continue animation if not complete
          if (progress < 1 && isPlaying) {
            animationFrameId = requestAnimationFrame(animate)
          }
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
          }
        }
      } else {
        // For the last frame, just set the positions directly
        setPlayerPositions(frame.playerPositions)
        setOpponentPositions(frame.opponentPositions || {})
        setOpponents(frame.opponents || [])
        setDrawings(frame.drawings)
        setBasketballs(frame.basketballs || [])
      }
    }
  }, [isPlaying, currentFrame, recordedFrames])

  // Start recording
  // Stop recording

  const handlePlayerDragStart = (playerId) => {
    if (isPlaying) return

    // Activate recording if primed
    if (recordingPrimed && !recordingActive) {
      activateRecording()
    }

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
    // Activate recording if primed
    if (recordingPrimed && !recordingActive) {
      activateRecording()
    }

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

    // If recording is active, capture this frame
    if (recordingActive && isRecording) {
      captureFrameIfNeeded() // This should now refer to the optimized version
    }
  }

  // Add basketball to the court
  const addBasketball = (x, y) => {
    // Activate recording if primed
    if (recordingPrimed && !recordingActive) {
      activateRecording()
    }

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

    // Activate recording if primed
    if (recordingPrimed && !recordingActive) {
      activateRecording()
    }

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

    // Activate recording if primed
    if (recordingPrimed && !recordingActive) {
      activateRecording()
    }

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

      // If recording, capture intermediate states more frequently
      if (isRecording && recordingStartTime) {
        // Record every small movement to ensure smooth line drawing
        const lastFrame = recordedFrames[recordedFrames.length - 1]
        const lastPoint =
          lastFrame?.drawings?.length > 0 ? lastFrame.drawings[lastFrame.drawings.length - 1]?.points?.[1] : null

        if (lastPoint) {
          const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2))
          if (distance > 1) {
            // Reduced from 2px to 1px to capture more points
            const elapsedTime = Date.now() - recordingStartTime
            const updatedDrawing = {
              ...currentDrawing,
              points: [currentDrawing.points[0], { x, y }],
            }

            setRecordedFrames((prev) => [
              ...prev,
              {
                timestamp: elapsedTime,
                playerPositions: { ...playerPositions },
                opponentPositions: { ...opponentPositions },
                opponents: [...opponents],
                drawings: [...drawings, updatedDrawing],
                basketballs: [...basketballs],
              },
            ])
          }
        }
      }
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

        // If recording, capture intermediate states more frequently
        if (isRecording && recordingStartTime) {
          // Record every point for pen/eraser to ensure smooth drawing
          const elapsedTime = Date.now() - recordingStartTime

          // Capture frame at a controlled rate to prevent overwhelming state updates
          if (elapsedTime % 16 === 0) {
            // Approximately 60fps
            setRecordedFrames((prev) => [
              ...prev,
              {
                timestamp: elapsedTime,
                playerPositions: { ...playerPositions },
                opponentPositions: { ...opponentPositions },
                opponents: [...opponents],
                drawings: [...drawings, updatedDrawing],
                basketballs: [...basketballs],
                currentDrawing: updatedDrawing,
              },
            ])
          }
        }
      }
    }
  }

  // Handle mouse up for drawing
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

        // If recording, capture this state
        if (isRecording) {
          const elapsedTime = Date.now() - recordingStartTime
          setRecordedFrames((prev) => [
            ...prev,
            {
              timestamp: elapsedTime,
              playerPositions: { ...playerPositions },
              opponentPositions: { ...opponentPositions },
              opponents: [...opponents.filter((opponent) => !opponentsToRemove.includes(opponent.id))],
              drawings: [...updatedDrawings],
              basketballs: [...basketballs.filter((ball) => !basketballsToRemove.includes(ball.id))],
            },
          ])
        }

        // Automatically deactivate eraser after use
        setDrawMode("none")
        setEraserMode(false)
      } else {
        // For drawing tools, add the current drawing
        const updatedDrawings = [...drawings, currentDrawing]
        setDrawings(updatedDrawings)

        // Track this action for undo
        trackAction("drawing", { drawing: currentDrawing })

        // If recording, capture this state with the new drawing
        if (isRecording) {
          const elapsedTime = Date.now() - recordingStartTime
          setRecordedFrames((prev) => [
            ...prev,
            {
              timestamp: elapsedTime,
              playerPositions: { ...playerPositions },
              opponentPositions: { ...opponentPositions },
              opponents: [...opponents],
              drawings: [...updatedDrawings],
              basketballs: [...basketballs],
            },
          ])
        }
      }

      setCurrentDrawing(null)
      setIsDrawing(false)
      setStartPoint(null)
    }
  }

  // Improve the eraser functionality
  // Update the drawMode state handling to toggle eraser mode
  const toggleEraserMode = () => {
    if (drawMode === "erase") {
      // If already in eraser mode, turn it off
      setDrawMode("none")
      setEraserMode(false)
    } else {
      // Turn on eraser mode
      setDrawMode("erase")
      setEraserMode(true)
    }
  }

  // Add a single-tap erase function
  const handleEraserTap = (e) => {
    if (!eraserMode || isPlaying) return

    const courtRect = courtRef.current.getBoundingClientRect()
    const x = e.clientX - courtRect.left
    const y = e.clientY - courtRect.top

    // Check for drawings to erase
    let erasedDrawing = false
    const updatedDrawings = drawings.filter((drawing) => {
      // For each drawing, check if any point is close to the tap
      for (const point of drawing.points) {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
        if (distance < 20) {
          erasedDrawing = true
          return false // Remove this drawing
        }
      }
      return true // Keep this drawing
    })

    if (erasedDrawing) {
      setDrawings(updatedDrawings)
      // Automatically deactivate eraser after successful erase
      setDrawMode("none")
      setEraserMode(false)
      return // If we erased a drawing, don't check for opponents
    }

    // Check for opponents to erase
    const opponentToRemove = opponents.find((opponent) => {
      const opponentPos = opponentPositions[opponent.id]
      if (opponentPos) {
        const distance = Math.sqrt(Math.pow(opponentPos.x - x, 2) + Math.pow(opponentPos.y - y, 2))
        return distance < 20
      }
      return false
    })

    if (opponentToRemove) {
      setOpponents(opponents.filter((o) => o.id !== opponentToRemove.id))
      const newPositions = { ...opponentPositions }
      delete newPositions[opponentToRemove.id]
      setOpponentPositions(newPositions)
      // Automatically deactivate eraser after successful erase
      setDrawMode("none")
      setEraserMode(false)
      return
    }

    // Check for basketballs to erase
    const basketballToRemove = basketballs.find((ball) => {
      const distance = Math.sqrt(Math.pow(ball.position.x - x, 2) + Math.pow(ball.position.y - y, 2))
      return distance < 20
    })

    if (basketballToRemove) {
      setBasketballs((prev) => prev.filter((ball) => ball.id !== basketballToRemove.id))
      // Automatically deactivate eraser after successful erase
      setDrawMode("none")
      setEraserMode(false)
    }
  }

  // Simple path intersection check
  const doPathsIntersect = (path1, path2) => {
    for (const point1 of path1) {
      for (const point2 of path2) {
        const distance = Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2))
        if (distance < 15) return true
      }
    }
    return false
  }

  // Clear all drawings
  const clearDrawings = () => {
    setDrawings([])
  }

  // Update the saveSystem function to show notification
  // Replace the saveSystem function with this:
  const saveSystem = (name) => {
    if (!name.trim()) {
      alert("Please enter a system name")
      return false
    }

    const system = {
      id: Date.now().toString(),
      name: name,
      drawings,
      playerPositions,
      opponentPositions,
      opponents,
      basketballs,
      isStatic: true,
      createdAt: new Date().toISOString(),
      // Store the current lineup ID with the system
      lineupId: selectedLineupId || lastSelectedLineupIdRef.current,
    }

    setSavedSystems((prev) => [...prev, system])

    // Show notification
    setNotification({ show: true, message: "Static System Saved Successfully" })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)

    return true
  }

  // Update the saveRecording function to show notification
  // Replace the saveRecording function with this:
  const saveRecording = (name) => {
    if (!name.trim()) {
      alert("Please enter a name for this system")
      return false
    }

    const newSystem = {
      id: Date.now().toString(),
      name: name,
      frames: recordedFrames,
      createdAt: new Date().toISOString(),
      isDynamic: true,
      // Store the lineup ID with the system to maintain context
      lineupId: selectedLineupId || lastSelectedLineupIdRef.current,
    }

    setSavedSystems((prev) => [...prev, newSystem])

    // Show notification
    setNotification({ show: true, message: "Dynamic System Saved Successfully" })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)

    // Don't reset the lineup selection after saving
    // The key is to NOT modify selectedLineupId here
    return true
  }

  // Load a saved system
  const loadSystem = (system) => {
    setDrawings(system.drawings || [])
    setPlayerPositions(system.playerPositions || {})
    setOpponentPositions(system.opponentPositions || {})
    setOpponents(system.opponents || [])
    setBasketballs(system.basketballs || [])
  }

  // Delete a saved system
  const deleteSystem = (systemId) => {
    if (window.confirm("Are you sure you want to delete this system?")) {
      setSavedSystems((prev) => prev.filter((system) => system.id !== systemId))
    }
  }

  // Fix the playRecording function to properly play the recording
  const playRecording = (system) => {
    if (isPlaying) {
      setIsPlaying(false)
      if (playbackRef.current) {
        clearInterval(playbackRef.current)
      }
      return
    }

    // Process the frames to ensure they have all required properties
    const processedFrames = system.frames.map((frame) => ({
      ...frame,
      playerPositions: frame.playerPositions || {},
      opponentPositions: frame.opponentPositions || {},
      opponents: frame.opponents || [],
      drawings: frame.drawings || [],
      basketballs: frame.basketballs || [],
    }))

    // If the system has a stored lineup ID and no lineup is currently selected,
    // restore that lineup selection
    if (system.lineupId && !selectedLineupId) {
      setSelectedLineupId(system.lineupId)
    }

    setRecordedFrames(processedFrames)
    setCurrentFrame(0)
    setIsPlaying(true)
  }

  // Handle lineup selection change
  const handleLineupChange = (e) => {
    setSelectedLineupId(e.target.value)
    // Close tactics dropdown when lineup changes
    setShowTacticsDropdown(false)
  }

  // Update the loadTactic function to show the modal instead of just setting the current tactic
  const loadTactic = (tactic) => {
    setTacticToDisplay(tactic)
    setShowTacticsDropdown(false)
  }

  // Calculate arrowhead points
  const calculateArrowhead = (start, end) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const length = 15 // Length of the arrowhead
    const angle1 = angle - Math.PI / 6
    const angle2 = angle + Math.PI / 6

    const point1 = {
      x: end.x - length * Math.cos(angle1),
      y: end.y - length * Math.sin(angle1),
    }

    const point2 = {
      x: end.x - length * Math.cos(angle2),
      y: end.y - length * Math.sin(angle2),
    }

    return [point1, end, point2]
  }

  // Render arrowhead for arrow drawings
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

  // Initialize selected lineup when currentLineup changes
  useEffect(() => {
    if (currentLineup) {
      setSelectedLineupId(currentLineup.id)
    }
  }, [currentLineup])

  // Add a new function to implement frame interpolation for smoother playback
  // Add this function before the return statement
  // Improve the getInterpolatedFrame function for smoother playback
  // Replace the existing getInterpolatedFrame function with this enhanced version

  // Modify the action handlers to trigger recording start when an action is performed
  // Update the handleMouseDown function to activate recording when drawing starts
  // Update the handlePlayerDragStart function to activate recording
  // Update the addOpponent function to activate recording
  // Update the addBasketball function to activate recording
  // Update the handleBasketballDragStart function to activate recording
  // Update the handleOpponentDrag function to capture frames during dragging

  // Helper function to normalize frame timing to ensure consistent playback
  const normalizeFrameTimingFunc = (frames) => {
    if (frames.length <= 1) return frames

    // Create a copy of the frames
    const normalizedFrames = [...frames]

    // Calculate the average time between frames
    const totalDuration = normalizedFrames[normalizedFrames.length - 1].timestamp - normalizedFrames[0].timestamp

    // Target a consistent frame rate of 60fps
    const targetFrameDuration = 20 // ~50fps in ms

    // Identify and fix large gaps or bunched frames
    for (let i = 1; i < normalizedFrames.length; i++) {
      const prevFrame = normalizedFrames[i - 1]
      const currentFrame = normalizedFrames[i]
      const timeDiff = currentFrame.timestamp - prevFrame.timestamp

      // If the time difference is too large (more than 2x target) or too small (less than 0.5x target)
      // adjust the timestamp to be more consistent
      if (timeDiff > targetFrameDuration * 2 || timeDiff < targetFrameDuration * 0.5) {
        // Adjust the timestamp to be more consistent
        currentFrame.timestamp = prevFrame.timestamp + targetFrameDuration
      }
    }

    return normalizedFrames
  }

  // Binary search to find the frame index by timestamp - much faster than linear search
  const findFrameIndexByTimeFunc = (frames, targetTime) => {
    if (frames.length === 0) return 0
    if (targetTime <= frames[0].timestamp) return 0
    if (targetTime >= frames[frames.length - 1].timestamp) return frames.length - 1

    let low = 0
    let high = frames.length - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)

      if (
        frames[mid].timestamp <= targetTime &&
        (mid === frames.length - 1 || frames[mid + 1].timestamp > targetTime)
      ) {
        return mid
      } else if (frames[mid].timestamp > targetTime) {
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    return low
  }

  // Improve the getInterpolatedFrame function for smoother transitions
  const getInterpolatedFrameFunc = (frame1, frame2, progress) => {
    // If we only have one frame or they're the same, just return it
    if (!frame2 || frame1 === frame2) return frame1

    // Create a new interpolated frame
    const interpolatedFrame = {
      timestamp: frame1.timestamp + (frame2.timestamp - frame1.timestamp) * progress,
      playerPositions: {},
      opponentPositions: {},
      opponents: frame1.opponents, // Keep the same opponents
      drawings: [], // We'll handle drawings specially
      basketballs: [],
    }

    // Apply improved cubic easing function for smoother motion
    // This creates a more natural ease-in/ease-out effect
    const easedProgress = progress < 0.5 ? 4 * Math.pow(progress, 3) : 1 - Math.pow(-2 * progress + 2, 3) / 2

    // Interpolate player positions with easing
    Object.keys(frame1.playerPositions).forEach((playerId) => {
      if (frame2.playerPositions[playerId]) {
        interpolatedFrame.playerPositions[playerId] = {
          x:
            frame1.playerPositions[playerId].x +
            (frame2.playerPositions[playerId].x - frame1.playerPositions[playerId].x) * easedProgress,
          y:
            frame1.playerPositions[playerId].y +
            (frame2.playerPositions[playerId].y - frame1.playerPositions[playerId].y) * easedProgress,
        }
      } else {
        interpolatedFrame.playerPositions[playerId] = frame1.playerPositions[playerId]
      }
    })

    // Interpolate opponent positions with easing
    Object.keys(frame1.opponentPositions).forEach((opponentId) => {
      if (frame2.opponentPositions[opponentId]) {
        interpolatedFrame.opponentPositions[opponentId] = {
          x:
            frame1.opponentPositions[opponentId].x +
            (frame2.opponentPositions[opponentId].x - frame1.opponentPositions[opponentId].x) * easedProgress,
          y:
            frame1.opponentPositions[opponentId].y +
            (frame2.opponentPositions[opponentId].y - frame1.opponentPositions[opponentId].y) * easedProgress,
        }
      } else {
        interpolatedFrame.opponentPositions[opponentId] = frame1.opponentPositions[opponentId]
      }
    })

    // Interpolate basketball positions with easing
    frame1.basketballs.forEach((ball1) => {
      const ball2 = frame2.basketballs.find((b) => b.id === ball1.id)
      if (ball2) {
        interpolatedFrame.basketballs.push({
          id: ball1.id,
          position: {
            x: ball1.position.x + (ball2.position.x - ball1.position.x) * easedProgress,
            y: ball1.position.y + (ball2.position.y - ball1.position.y) * easedProgress,
          },
        })
      } else {
        interpolatedFrame.basketballs.push(ball1)
      }
    })

    // Add any basketballs that are in frame2 but not in frame1
    frame2.basketballs.forEach((ball2) => {
      if (!frame1.basketballs.some((b) => b.id === ball2.id)) {
        interpolatedFrame.basketballs.push(ball2)
      }
    })

    // Special handling for drawings to prevent flickering
    // For drawings, we want to ensure a smooth transition
    // If we're in the first half of the transition, use frame1's drawings
    // If we're in the second half, use frame2's drawings
    // This prevents the flickering effect when drawings change
    interpolatedFrame.drawings = [...frame2.drawings]

    return interpolatedFrame
  }

  // Replace the playback useEffect with this optimized version
  useEffect(() => {
    if (isPlaying && recordedFrames.length > 0) {
      let animationFrameId
      let startTime = null
      let lastFrameIndex = 0

      // Track last applied values to avoid unnecessary state updates
      let lastAppliedPlayerPositions = null
      let lastAppliedOpponentPositions = null
      let lastAppliedOpponents = null
      let lastAppliedDrawings = null
      let lastAppliedBasketballs = null

      // Pre-process frames to normalize time gaps
      const normalizedFrames = normalizeFrameTimingFunc(recordedFrames)

      let lastRenderTime = 0

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp

          // Throttle to ~60fps for smoother rendering on tablets
          if (timestamp - lastRenderTime < 1000 / 60) {
            animationFrameId = requestAnimationFrame(animate)
            return
          }
          lastRenderTime = timestamp

          const elapsed = Math.min(timestamp - startTime, normalizedFrames[normalizedFrames.length - 1].timestamp)

        // Calculate which frame we should be at based on elapsed time and playback speed
        const targetTime = elapsed * playbackSpeed

        // Find the appropriate frame based on timestamp using binary search for better performance
        const frameIndex = findFrameIndexByTimeFunc(normalizedFrames, targetTime)

        // If we've reached the end of the recording
        if (
          frameIndex >= normalizedFrames.length - 1 &&
          targetTime >= normalizedFrames[normalizedFrames.length - 1].timestamp
        ) {
          setIsPlaying(false)
          setCurrentFrame(0)

          // Reset to initial state
          if (normalizedFrames.length > 0) {
            setPlayerPositions(normalizedFrames[0].playerPositions)
            setOpponentPositions(normalizedFrames[0].opponentPositions)
            setOpponents(normalizedFrames[0].opponents)
            setDrawings(normalizedFrames[0].drawings)
            setBasketballs(normalizedFrames[0].basketballs)
          }
          return
        }

        // Set the current frame index for UI purposes
        setCurrentFrame(frameIndex)

        // Get the current frame and the next frame for interpolation
        const currentKeyframe = normalizedFrames[frameIndex]
        const nextKeyframe = normalizedFrames[frameIndex + 1]

        if (nextKeyframe) {
          // Calculate progress between the two keyframes
          const frameDuration = nextKeyframe.timestamp - currentKeyframe.timestamp
          const frameProgress = frameDuration > 0 ? (targetTime - currentKeyframe.timestamp) / frameDuration : 0

          // Get interpolated frame with clamped progress
          const interpolatedFrame = getInterpolatedFrame(
            currentKeyframe,
            nextKeyframe,
            Math.min(1, Math.max(0, frameProgress)),
          )

          // Only update state if values have changed (shallow equality check)
          // This prevents unnecessary re-renders and improves performance

          // Update player positions only if they've changed
          if (!shallowEqual(interpolatedFrame.playerPositions, lastAppliedPlayerPositions)) {
            setPlayerPositions(interpolatedFrame.playerPositions)
            lastAppliedPlayerPositions = interpolatedFrame.playerPositions
          }

          // Update opponent positions only if they've changed
          if (!shallowEqual(interpolatedFrame.opponentPositions, lastAppliedOpponentPositions)) {
            setOpponentPositions(interpolatedFrame.opponentPositions)
            lastAppliedOpponentPositions = interpolatedFrame.opponentPositions
          }

          // Update opponents only if they've changed
          if (!shallowEqual(interpolatedFrame.opponents, lastAppliedOpponents)) {
            setOpponents(interpolatedFrame.opponents)
            lastAppliedOpponents = interpolatedFrame.opponents
          }

          // Update drawings only if they've changed or at key points to ensure smooth transitions
          if (
            !shallowEqual(interpolatedFrame.drawings, lastAppliedDrawings) ||
            frameIndex !== lastFrameIndex ||
            Math.abs(lastAppliedDrawings) ||
            frameIndex !== lastFrameIndex ||
            Math.abs(frameProgress - 0.5) < 0.05
          ) {
            setDrawings(interpolatedFrame.drawings)
            lastAppliedDrawings = interpolatedFrame.drawings
          }

          // Update basketballs only if they've changed
          if (!shallowEqual(interpolatedFrame.basketballs, lastAppliedBasketballs)) {
            setBasketballs(interpolatedFrame.basketballs)
            lastAppliedBasketballs = interpolatedFrame.basketballs
          }

          // Track the last frame we rendered
          lastFrameIndex = frameIndex
        } else {
          // If there's no next frame, just use the current frame
          // Only update if values have changed
          if (!shallowEqual(currentKeyframe.playerPositions, lastAppliedPlayerPositions)) {
            setPlayerPositions(currentKeyframe.playerPositions)
            lastAppliedPlayerPositions = currentKeyframe.playerPositions
          }

          if (!shallowEqual(currentKeyframe.opponentPositions, lastAppliedOpponentPositions)) {
            setOpponentPositions(currentKeyframe.opponentPositions)
            lastAppliedOpponentPositions = currentKeyframe.opponentPositions
          }

          if (!shallowEqual(currentKeyframe.opponents, lastAppliedOpponents)) {
            setOpponents(currentKeyframe.opponents)
            lastAppliedOpponents = currentKeyframe.opponents
          }

          if (!shallowEqual(currentKeyframe.drawings, lastAppliedDrawings)) {
            setDrawings(currentKeyframe.drawings)
            lastAppliedDrawings = currentKeyframe.drawings
          }

          if (!shallowEqual(currentKeyframe.basketballs, lastAppliedBasketballs)) {
            setBasketballs(currentKeyframe.basketballs)
            lastAppliedBasketballs = currentKeyframe.basketballs
          }
        }

        // Continue animation if still playing
        if (isPlaying) {
          animationFrameId = requestAnimationFrame(animate)
        }
      }

      animationFrameId = requestAnimationFrame(animate)

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }
  }, [isPlaying, recordedFrames, playbackSpeed])

  // Add a helper function for shallow equality checks
  const shallowEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true
    if (!obj1 || !obj2) return false

    // For arrays, check length first
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false
      // For arrays of objects (like opponents), we'll do a simple length check
      // A more thorough check would compare each item, but that might be too expensive
      return true
    }

    // For objects like positions, check if keys and values match
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    // For position objects, we'll do a quick check of a few keys
    // This is faster than checking every key but still catches most changes
    const sampleSize = Math.min(5, keys1.length)
    for (let i = 0; i < sampleSize; i++) {
      const key = keys1[i]
      // For nested objects like positions with x,y coordinates
      if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
        if (obj1[key].x !== obj2[key].x || obj1[key].y !== obj2[key].y) {
          return false
        }
      } else if (obj1[key] !== obj2[key]) {
        return false
      }
    }

    return true
  }

  const handleMouseMove = (e) => {
    handleMouseMoveDrawing(e)
  }

  const getInterpolatedFrame = getInterpolatedFrameFunc

  // Add a touch-specific effect to ensure lineup selection persists
  // This will run when the save form is shown/hidden
  // Update the useEffect that handles lineup selection persistence
  // Replace the existing useEffect that runs when showSaveForm changes with this improved version:
  useEffect(() => {
    // This effect specifically targets the issue on touch devices
    // by ensuring the lineup selection is preserved when the save form
    // appears and disappears
    if (!showSaveForm && lastSelectedLineupIdRef.current) {
      // Small delay to ensure the lineup is still selected after form closes
      const timeoutId = setTimeout(() => {
        // Re-select the lineup if it was somehow deselected
        const lineupExists = teamLineups.some((lineup) => lineup.id === lastSelectedLineupIdRef.current)
        if (lineupExists) {
          // Force a re-selection of the lineup to ensure it's properly applied
          setSelectedLineupId(lastSelectedLineupIdRef.current)
        }
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [showSaveForm, teamLineups])

  // Add an effect to update the ref whenever selectedLineupId changes
  // Add this new useEffect after the other useEffects
  useEffect(() => {
    if (selectedLineupId) {
      lastSelectedLineupIdRef.current = selectedLineupId
    }
  }, [selectedLineupId])

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
            {/* Record System Dropdown */}
            <div className="dropdown-container">
              <button
                className={`dropdown-button ${isRecording ? "recording" : ""}`}
                onClick={() => {
                  setShowRecordDropdown(!showRecordDropdown)
                  setShowSavedSystemsDropdown(false)
                }}
                disabled={disabled || isPlaying}
              >
                {isRecording ? (
                  <>
                    <span className="recording-indicator">●</span> Recording...
                  </>
                ) : (
                  <>Record System</>
                )}
                <span className="dropdown-arrow">▼</span>
              </button>

              {showRecordDropdown && !isRecording && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowStaticNamePrompt(true)
                      setShowRecordDropdown(false)
                    }}
                  >
                    Record Static System
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      startRecording()
                      setShowRecordDropdown(false)
                    }}
                  >
                    Record Dynamic System
                  </button>
                </div>
              )}

              {isRecording && (
                <button className="stop-recording-button" onClick={stopRecording}>
                  Stop Recording
                </button>
              )}
            </div>

            {/* Saved Systems Dropdown */}
            <div className="dropdown-container">
              <button
                className="dropdown-button"
                onClick={() => {
                  setShowSavedSystemsDropdown(!showSavedSystemsDropdown)
                  setShowRecordDropdown(false)
                }}
                disabled={disabled || savedSystems.length === 0}
              >
                Saved Systems
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

                  {/* Dynamic Systems */}
                  <div className="systems-section">
                    <div className="systems-section-header">Dynamic Systems</div>
                    <div className="systems-list">
                      {savedSystems.filter((s) => s.isDynamic).length > 0 ? (
                        savedSystems
                          .filter((s) => s.isDynamic)
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((system) => (
                            <div key={system.id} className="system-item">
                              <span className="system-name">{system.name}</span>
                              <div className="system-actions">
                                <div className="playback-speed-control">
                                  <label>Speed:</label>
                                  <select
                                    value={playbackSpeed}
                                    onChange={(e) => setPlaybackSpeed(Number.parseFloat(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="0.5">Slow</option>
                                    <option value="0.75">Normal</option>
                                    <option value="2">Fast</option>
                                  </select>
                                </div>
                                <button
                                  className={`system-action-button ${isPlaying && recordedFrames === system.frames ? "playing" : ""}`}
                                  onClick={() => {
                                    playRecording(system)
                                    if (!isPlaying) {
                                      setShowSavedSystemsDropdown(false)
                                    }
                                  }}
                                >
                                  {isPlaying && recordedFrames === system.frames ? "Stop" : "Play"}
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
                        <div className="empty-systems-message">No dynamic systems saved</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showSaveForm && (
          <div className="system-save-form">
            <h3>Save Recorded System</h3>
            <div className="form-group">
              <label htmlFor="newSystemName">System Name</label>
              <input
                id="newSystemName"
                type="text"
                value={newSystemName}
                onChange={(e) => setNewSystemName(e.target.value)}
                placeholder="Enter a name for this system"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="action-button" onClick={() => setShowSaveForm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  const saved = saveRecording(newSystemName)
                  if (saved) {
                    setShowSaveForm(false)
                  }
                }}
              >
                Save System
              </button>
            </div>
          </div>
        )}

        {showStaticNamePrompt && (
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
              />
            </div>
            <div className="form-actions">
              <button type="button" className="action-button" onClick={() => setShowStaticNamePrompt(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  const success = saveSystem(staticSystemName)
                  if (success) {
                    setStaticSystemName("")
                    setShowStaticNamePrompt(false)
                  }
                }}
              >
                Save System
              </button>
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

              // Record intermediate states during dragging if recording
              if (isRecording && recordingStartTime) {
                const elapsedTime = Date.now() - recordingStartTime
                // Only record every few frames to avoid too many frames
                if (elapsedTime % 32 === 0) {
                  // Record at ~30fps
                  setRecordedFrames((prev) => [
                    ...prev,
                    {
                      timestamp: elapsedTime,
                      playerPositions: { ...playerPositions },
                      opponentPositions: { ...opponentPositions },
                      opponents: [...opponents],
                      drawings: [...drawings],
                      basketballs: [...basketballs],
                    },
                  ])
                }
              }
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

              // Record intermediate states during dragging if recording
              if (isRecording && recordingStartTime) {
                const elapsedTime = Date.now() - recordingStartTime
                // Only record every few frames to avoid too many frames
                if (elapsedTime % 32 === 0) {
                  // Record at ~30fps
                  setRecordedFrames((prev) => [
                    ...prev,
                    {
                      timestamp: elapsedTime,
                      playerPositions: { ...playerPositions },
                      opponentPositions: { ...opponentPositions },
                      opponents: [...opponents],
                      drawings: [...drawings],
                      basketballs: [...basketballs],
                    },
                  ])
                }
              }
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

              // Record intermediate states during dragging if recording
              if (isRecording && recordingStartTime) {
                const elapsedTime = Date.now() - recordingStartTime
                // Only record every few frames to avoid too many frames
                if (elapsedTime % 32 === 0) {
                  // Record at ~30fps
                  setRecordedFrames((prev) => [
                    ...prev,
                    {
                      timestamp: elapsedTime,
                      playerPositions: { ...playerPositions },
                      opponentPositions: { ...opponentPositions },
                      opponents: [...opponents],
                      drawings: [...drawings],
                      basketballs: [...basketballs],
                    },
                  ])
                }
              }
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

              // Record intermediate states during dragging if recording
              if (isRecording && recordingStartTime) {
                const elapsedTime = Date.now() - recordingStartTime
                if (elapsedTime % 32 === 0) {
                  setRecordedFrames((prev) => [
                    ...prev,
                    {
                      timestamp: elapsedTime,
                      playerPositions: { ...playerPositions },
                      opponentPositions: { ...opponentPositions },
                      opponents: [...opponents],
                      drawings: [...drawings],
                      basketballs: [...basketballs],
                    },
                  ])
                }
              }
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

              // Record intermediate states during dragging if recording
              if (isRecording && recordingStartTime) {
                const elapsedTime = Date.now() - recordingStartTime
                if (elapsedTime % 32 === 0) {
                  setRecordedFrames((prev) => [
                    ...prev,
                    {
                      timestamp: elapsedTime,
                      playerPositions: { ...playerPositions },
                      opponentPositions: { ...opponentPositions },
                      opponents: [...opponents],
                      drawings: [...drawings],
                      basketballs: [...basketballs],
                    },
                  ])
                }
              }
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

              // Record intermediate states during dragging if recording
              if (isRecording && recordingStartTime) {
                const elapsedTime = Date.now() - recordingStartTime
                if (elapsedTime % 32 === 0) {
                  setRecordedFrames((prev) => [
                    ...prev,
                    {
                      timestamp: elapsedTime,
                      playerPositions: { ...playerPositions },
                      opponentPositions: { ...opponentPositions },
                      opponents: [...opponents],
                      drawings: [...drawings],
                      basketballs: [...basketballs],
                    },
                  ])
                }
              }
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
              value={selectedLineupId || lastSelectedLineupIdRef.current || ""}
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
    </div>
  )
}

export default CoachingBoard


