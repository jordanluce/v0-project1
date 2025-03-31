"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import "./HowItWorksModal.css"

interface HowItWorksModalProps {
  onClose: () => void
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ onClose }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [animationDirection, setAnimationDirection] = useState<"next" | "prev" | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const chapters = [
    {
      id: "index",
      title: "How I Work? - Table of Contents",
      content: (
        <div className="chapter-content index-chapter">
          <h2>Quick Guide to Court360</h2>
          <p className="chapter-intro">
            This guide will walk you through all the key features of Court360, your comprehensive wheelchair basketball
            coaching tool. Click any chapter to jump to that section, or use the navigation buttons to read through
            sequentially.
          </p>
          <div className="chapter-list">
            <div className="chapter-list-column">
              <button className="chapter-button" onClick={() => jumpToChapter(1)}>
                <span className="chapter-number">1</span>
                <div>
                  <h3>Team Setup</h3>
                  <p>Creating and managing your teams</p>
                </div>
              </button>
              <button className="chapter-button" onClick={() => jumpToChapter(2)}>
                <span className="chapter-number">2</span>
                <div>
                  <h3>Player Management</h3>
                  <p>Adding and editing your roster</p>
                </div>
              </button>
              <button className="chapter-button" onClick={() => jumpToChapter(3)}>
                <span className="chapter-number">3</span>
                <div>
                  <h3>Competition Rules</h3>
                  <p>Setting up classification limits</p>
                </div>
              </button>
            </div>
            <div className="chapter-list-column">
              <button className="chapter-button" onClick={() => jumpToChapter(4)}>
                <span className="chapter-number">4</span>
                <div>
                  <h3>Lineup Creation</h3>
                  <p>Creating valid team combinations</p>
                </div>
              </button>
              <button className="chapter-button" onClick={() => jumpToChapter(5)}>
                <span className="chapter-number">5</span>
                <div>
                  <h3>Court Visualization</h3>
                  <p>Using the interactive court board</p>
                </div>
              </button>
              <button className="chapter-button" onClick={() => jumpToChapter(6)}>
                <span className="chapter-number">6</span>
                <div>
                  <h3>Tactics & Plays</h3>
                  <p>Saving and managing systems</p>
                </div>
              </button>
              <button className="chapter-button" onClick={() => jumpToChapter(7)}>
                <span className="chapter-number">7</span>
                <div>
                  <h3>Sharing & Exporting</h3>
                  <p>Distributing your playbook</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "team-setup",
      title: "Chapter 1: Team Setup",
      content: (
        <div className="chapter-content">
          <div className="chapter-header">
            <h2>Team Setup</h2>
            <p className="chapter-description">The first required step to begin working with Court360</p>
          </div>

          <div className="info-card">
            <h3>Creating Your Team</h3>
            <p>
              When you first open Court360, you'll be prompted to create a team. This is a required first step - all
              other features are built around your team structure.
            </p>
            <ul>
              <li>
                <strong>Team Name:</strong> Enter your team's name (e.g., "Toronto Rollers")
              </li>
              <li>
                <strong>Competition Level:</strong> Select International, Eurocup, or National level - this affects
                player classification limits
              </li>
            </ul>
            <p className="tip">
              <strong>Tip:</strong> Each competition level has different classification limits:
              <br />• International: 14.0 points
              <br />• Eurocup: 14.5 points
              <br />• National: Custom (set in Rules section)
            </p>
          </div>

          <div className="info-card">
            <h3>Team Management</h3>
            <p>Once your team is created:</p>
            <ul>
              <li>Your team name appears in the header bar for easy reference</li>
              <li>The classification limit is displayed next to the team name</li>
              <li>You can create multiple teams and switch between them using the dropdown selector</li>
            </ul>
            <p>
              All player data, lineups, and systems are attached to a specific team. Switching teams lets you work with
              completely separate setups.
            </p>
          </div>

          <div className="info-card warning-card">
            <h3>Important Note</h3>
            <p>
              Until you create a team, other sections of the app will be locked or limited. The team setup is the
              foundation for all other functionality, ensuring your player lineups, classifications, and systems are
              properly organized.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "player-management",
      title: "Chapter 2: Player Management",
      content: (
        <div className="chapter-content">
          <div className="chapter-header">
            <h2>Player Management</h2>
            <p className="chapter-description">Building and maintaining your player roster</p>
          </div>

          <div className="info-card">
            <h3>Adding Players</h3>
            <p>
              After creating your team, the next step is to add your players. Each player requires the following
              information:
            </p>
            <ul>
              <li>
                <strong>Name:</strong> Player's full name
              </li>
              <li>
                <strong>Classification:</strong> The player's official classification value.
                <ul>
                  <li>International & EuroCup: 1.0–4.5 in 0.5 increments</li>
                  <li>National competitions: 1.0–5.0 in 0.5 increments</li>
                </ul>
                Classification values affect lineup validation based on competition rules.
              </li>
              <li>
                <strong>Category:</strong> Choose from available options like Junior, Female, Senior, or Female
                Able-Bodied. These are used for organizing your roster and validating lineups in competitions.
              </li>
              <li>
                <strong>Foreign Player:</strong> Toggle for non-local players (affects lineup validation in some
                competitions)
              </li>
              <li>
                <strong>Able-bodied:</strong> Toggle for able-bodied players (affects lineup validation in some
                competitions)
              </li>
            </ul>
          </div>

          <div className="info-card important-card">
            <h3>Understanding Classification</h3>
            <p>
              Player classification defines the level of functional ability and movement a player has. It ensures fair
              and balanced team play by limiting the total classification score of on-court players.
            </p>
            <ul>
              <li>
                <strong>1.0–1.5:</strong> Minimal trunk control, relies heavily on wheelchair for stability
              </li>
              <li>
                <strong>2.0–2.5:</strong> Partial trunk movement, mostly forward
              </li>
              <li>
                <strong>3.0–3.5:</strong> Good trunk movement forward and some sideways
              </li>
              <li>
                <strong>4.0–4.5:</strong> Full or near-full trunk movement in all directions
              </li>
              <li>
                <strong>5.0:</strong> (National competitions only) Maximum stability and control
              </li>
            </ul>
            <p className="warning-text">
              ⚠️ Total classification of all players on court must not exceed the limit defined by the competition.
            </p>
            <p>
              Examples:
              <br />• International: Max 14.0
              <br />• EuroCup: Max 14.5
              <br />• National: Set in the "Rules" step
            </p>
          </div>

          <div className="info-card">
            <h3>Managing Your Roster</h3>
            <p>The Player Management section allows you to:</p>
            <ul>
              <li>
                <strong>Edit players:</strong> Update any player information as needed
              </li>
              <li>
                <strong>Delete players:</strong> Remove players who are no longer on your team
              </li>
              <li>
                <strong>Filter players:</strong> Sort by name, classification, or category
              </li>
            </ul>
            <p>
              Your player list forms the foundation for creating lineups. Keep it accurate and up-to-date for valid
              lineup creation.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "competition-rules",
      title: "Chapter 3: Competition Rules",
      content: (
        <div className="chapter-content">
          <div className="chapter-header">
            <h2>Competition Rules</h2>
            <p className="chapter-description">Defining classification limits and special player restrictions</p>
          </div>

          <div className="info-card">
            <h3>Classification Limits</h3>
            <p>
              Different competitions have different rules regarding player classification. Court360 helps you manage
              these rules:
            </p>
            <ul>
              <li>
                <strong>International (Default: 14.0):</strong> IWBF international competitions typically use a 14.0
                point limit
              </li>
              <li>
                <strong>Eurocup (Default: 14.5):</strong> European competitions often use a 14.5 point limit
              </li>
              <li>
                <strong>National:</strong> For national leagues, you can set a custom point limit
              </li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Setting National Rules</h3>
            <p>If you selected "National" as your competition level, you'll need to define specific rules:</p>
            <ul>
              <li>
                <strong>Maximum Classification Points:</strong> Set the total classification limit for your league
                (e.g., 15.0, 16.5)
              </li>
              <li>
                <strong>Maximum Foreign Players:</strong> Define how many foreign players can be on court at once
              </li>
              <li>
                <strong>Maximum Able-bodied Players:</strong> Set how many able-bodied players are allowed on court
              </li>
            </ul>
            <p>
              These settings are crucial for lineup validation - the app will automatically check if your lineups comply
              with these rules.
            </p>
          </div>

          <div className="info-card example-card">
            <h3>Examples of Valid vs. Invalid Lineups</h3>
            <p>
              <strong>Example 1: International (14.0 limit)</strong>
            </p>
            <ul>
              <li>Valid: Players with classifications 1.0, 2.5, 3.0, 3.5, 4.0 = 14.0 points</li>
              <li>Invalid: Players with classifications 2.0, 3.0, 3.0, 3.0, 3.5 = 14.5 points</li>
            </ul>

            <p>
              <strong>Example 2: National with Special Rules</strong>
            </p>
            <ul>
              <li>Rules: 15.0 point limit, max 2 foreign players, max 1 able-bodied player</li>
              <li>Valid: 14.5 total points, 1 foreign player, 1 able-bodied player</li>
              <li>Invalid: 14.0 total points but 3 foreign players (exceeds the foreign player limit)</li>
            </ul>
          </div>

          <div className="info-card warning-card">
            <h3>Important Note</h3>
            <p>
              For National competitions, you must set up these rules before creating lineups. Without defined rules, the
              app cannot properly validate your lineup combinations.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "lineup-creation",
      title: "Chapter 4: Lineup Creation",
      content: (
        <div className="chapter-content">
          <div className="chapter-header">
            <h2>Lineup Creation</h2>
            <p className="chapter-description">Building valid player combinations for your games</p>
          </div>

          <div className="info-card">
            <h3>Creating a Lineup</h3>
            <p>
              Once you have your players and rules set up, you can create lineups - the player combinations you'll use
              during games:
            </p>
            <ol>
              <li>Open the Lineup section from the main menu</li>
              <li>Select players from your roster (you must select exactly 5 players for a valid lineup)</li>
              <li>The app automatically calculates the total classification points</li>
              <li>Give your lineup a descriptive name (e.g., "Starting Five," "Defensive Unit," "Fast Break")</li>
              <li>Save the lineup to use it on the coaching board</li>
            </ol>
          </div>

          <div className="info-card">
            <h3>Real-time Validation</h3>
            <p>As you select players, Court360 provides immediate feedback on lineup validity:</p>
            <ul>
              <li>
                <strong>Classification Total:</strong> Updates in real-time as you select/deselect players
              </li>
              <li>
                <strong>Warnings:</strong> Appears when you exceed classification limits
              </li>
              <li>
                <strong>Special Status Alerts:</strong> Notifies when you exceed foreign or able-bodied player limits
              </li>
            </ul>
            <p>This helps ensure you only create lineups that comply with your competition rules.</p>
          </div>

          <div className="info-card">
            <h3>Managing Multiple Lineups</h3>
            <p>You can create and save multiple lineups for different situations:</p>
            <ul>
              <li>Create specialized lineups for different game situations (offense, defense, end-game)</li>
              <li>Develop alternate lineups in case of player fouls or injuries</li>
              <li>Test different player combinations while staying within classification limits</li>
              <li>Edit or delete lineups as your team composition changes</li>
            </ul>
            <p>Saved lineups can be quickly loaded onto the coaching board for visualization and tactical planning.</p>
          </div>

          <div className="info-card tip-card">
            <h3>Strategic Tip</h3>
            <p>
              When creating lineups, consider not just the classification total, but the balance of player skills and
              positions:
            </p>
            <ul>
              <li>A lineup with all high-point players might limit your total player count</li>
              <li>Including some lower-point players can create space for more high-functioning players elsewhere</li>
              <li>Create specialized lineups for different opponents or game situations</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "court-visualization",
      title: "Chapter 5: Court Visualization",
      content: (
        <div className="chapter-content">
          <div className="chapter-header">
            <h2>Court Visualization</h2>
            <p className="chapter-description">Using the interactive court board to illustrate plays and positions</p>
          </div>

          <div className="info-card">
            <h3>The Coaching Board</h3>
            <p>The court visualization is the core of Court360, allowing you to:</p>
            <ul>
              <li>Position players from your active lineup on the court</li>
              <li>Draw plays, movements, and tactical instructions</li>
              <li>Illustrate offensive and defensive systems</li>
              <li>Create step-by-step play sequences</li>
            </ul>
            <p>The board displays a regulation wheelchair basketball court with all markings and dimensions.</p>
          </div>

          <div className="info-card">
            <h3>Drawing Tools</h3>
            <p>Multiple tools are available to illustrate your tactics:</p>
            <ul>
              <li>
                <strong>Player Positioning:</strong> Drag and drop players onto the court
              </li>
              <li>
                <strong>Line Tool:</strong> Draw straight lines for player movements or passing lanes
              </li>
              <li>
                <strong>Arrow Tool:</strong> Illustrate direction of movement or passes
              </li>
              <li>
                <strong>Pen Tool:</strong> Free-form drawing for custom instructions
              </li>
              <li>
                <strong>Ball Tool:</strong> Add a basketball to the diagram
              </li>
              <li>
                <strong>Opponent Tool:</strong> Add generic opponent players
              </li>
              <li>
                <strong>Eraser Tool:</strong> Remove specific elements
              </li>
              <li>
                <strong>Undo/Redo:</strong> Step backward or forward through changes
              </li>
              <li>
                <strong>Clear All:</strong> Reset the board completely
              </li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Using the Numbering System</h3>
            <p>For multi-step plays, use the numbering feature:</p>
            <ul>
              <li>Select the arrow or line tool</li>
              <li>Each new arrow or line is automatically numbered in sequence</li>
              <li>This helps illustrate the order of movements or passes</li>
              <li>Players can follow the numbered sequence to understand the play timing</li>
            </ul>
            <p>This is particularly useful for complex plays with multiple movements.</p>
          </div>

          <div className="info-card tip-card">
            <h3>Best Practices</h3>
            <p>For clear and effective court visualizations:</p>
            <ul>
              <li>Use consistent colors and symbols for different actions (passes vs. movements)</li>
              <li>Keep diagrams clean and avoid cluttering the court</li>
              <li>For complex plays, create multiple systems showing different phases</li>
              <li>Use the fullscreen option for presentations or team meetings</li>
              <li>Consider the viewing device when creating systems - ensure visibility on smaller screens</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "tactics-plays",
      title: "Chapter 6: Tactics & Plays",
      content: (
        <div className="chapter-content">
          <div className="chapter-header">
            <h2>Tactics & Plays (System Saving)</h2>
            <p className="chapter-description">Saving and managing your tactical systems</p>
          </div>

          <div className="info-card">
            <h3>Saving Systems</h3>
            <p>After creating a play or tactic on the court board, you can save it as a system:</p>
            <ol>
              <li>Position players and draw your play on the court</li>
              <li>Click the "Save System" button</li>
              <li>
                Enter a descriptive name for your tactic (e.g., "1-3-1 Zone Defense", "Pick and Roll Set", "Baseline
                Inbound")
              </li>
              <li>Optionally add notes about the system's purpose or execution</li>
              <li>Click "Save" to store your system</li>
            </ol>
            <p>
              Saved systems are specific to the current lineup and team. This ensures your tactics are always valid for
              the selected players.
            </p>
          </div>

          <div className="info-card">
            <h3>Managing Saved Systems</h3>
            <p>Court360 provides several ways to work with your saved systems:</p>
            <ul>
              <li>
                <strong>View Systems:</strong> Access your saved systems from the dropdown menu
              </li>
              <li>
                <strong>Edit Systems:</strong> Load a system, make changes, and save it again (either as new or
                overwrite)
              </li>
              <li>
                <strong>Delete Systems:</strong> Remove outdated or unused systems
              </li>
              <li>
                <strong>Organize Systems:</strong> Group tactics by type (offensive/defensive) or situation (inbounds,
                end-game)
              </li>
            </ul>
            <p>This system management helps you build a comprehensive playbook over time.</p>
          </div>

          <div className="info-card important-card">
            <h3>Static Systems</h3>
            <p>Court360 saves your systems as static snapshots:</p>
            <ul>
              <li>Each system captures the exact state of the court when saved</li>
              <li>Player positions, drawings, arrows, and numbering are all preserved</li>
              <li>Think of these as pages in your playbook - distinct tactical arrangements</li>
            </ul>
            <p>
              For multi-step plays, save each major phase as a separate system with a consistent naming convention
              (e.g., "Fast Break - Step 1", "Fast Break - Step 2").
            </p>
          </div>

          <div className="info-card tip-card">
            <h3>Organizing Your Playbook</h3>
            <p>For better system organization:</p>
            <ul>
              <li>Use consistent naming conventions (e.g., "DEF: 2-3 Zone", "OFF: Pick & Roll")</li>
              <li>Include the situation in the name when applicable (e.g., "INBOUND: Baseline", "EOG: Down 3")</li>
              <li>Add detailed notes about when to use each system and key execution points</li>
              <li>Regularly review and clean up unused systems</li>
            </ul>
            <p>A well-organized playbook makes it easier to find and use your tactics during practice or games.</p>
          </div>
        </div>
      ),
    },
    {
      id: "sharing-exporting",
      title: "Chapter 7: Sharing & Exporting",
      content: (
        <div className="chapter-content">
          <div className="chapter-header">
            <h2>Sharing & Exporting</h2>
            <p className="chapter-description">Distributing your playbook to players and staff</p>
          </div>

          <div className="info-card">
            <h3>Exporting Your Playbook</h3>
            <p>Court360 allows you to share your tactical systems with your team:</p>
            <ol>
              <li>Click the "Share Systems" button in the header</li>
              <li>Select which systems you want to include in the export</li>
              <li>Add coach notes or instructions for the team</li>
              <li>Generate a PDF containing all selected systems</li>
            </ol>
            <p>This feature creates a comprehensive playbook that can be distributed digitally or printed.</p>
          </div>

          <div className="info-card">
            <h3>PDF Content</h3>
            <p>The exported PDF includes:</p>
            <ul>
              <li>
                <strong>Team Information:</strong> Team name, competition level, and classification limit
              </li>
              <li>
                <strong>Player Roster:</strong> Complete list of players with their classifications
              </li>
              <li>
                <strong>Lineups:</strong> Your saved lineup combinations
              </li>
              <li>
                <strong>Coach Notes:</strong> Any text instructions you added during export
              </li>
              <li>
                <strong>Tactical Systems:</strong> Visual representations of all selected plays
              </li>
            </ul>
            <p>
              Each system is shown exactly as you created it on the court board, preserving all drawings, positions, and
              notations.
            </p>
          </div>

          <div className="info-card">
            <h3>Distribution Methods</h3>
            <p>Once generated, you can distribute your playbook in several ways:</p>
            <ul>
              <li>Download the PDF to your device</li>
              <li>Share digitally via email, messaging apps, or team management platforms</li>
              <li>Print physical copies for team meetings or locker room</li>
              <li>Project during team video sessions</li>
            </ul>
            <p>Digital distribution allows players to review plays on their own devices before practice or games.</p>
          </div>

          <div className="info-card tip-card">
            <h3>Best Practices</h3>
            <p>For effective playbook distribution:</p>
            <ul>
              <li>Export separate playbooks for different scenarios (e.g., one for offense, one for defense)</li>
              <li>Create role-specific playbooks highlighting individual responsibilities</li>
              <li>Update and redistribute after significant tactical changes</li>
              <li>Include clear implementation instructions in the coach notes</li>
              <li>Consider distribution timing - not too far before games to prevent information leakage</li>
            </ul>
            <p>
              Remember that the export shows exactly what you've drawn - ensure your systems are clear and complete
              before sharing.
            </p>
          </div>
        </div>
      ),
    },
  ]

  // Handle next/previous page navigation
  const goToNextPage = () => {
    if (currentPage < chapters.length - 1) {
      setAnimationDirection("next")
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1)
        setAnimationDirection(null)
      }, 300)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setAnimationDirection("prev")
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1)
        setAnimationDirection(null)
      }, 300)
    }
  }

  // Jump directly to a specific chapter
  const jumpToChapter = (chapterIndex: number) => {
    if (chapterIndex >= 0 && chapterIndex < chapters.length) {
      setAnimationDirection(chapterIndex > currentPage ? "next" : "prev")
      setTimeout(() => {
        setCurrentPage(chapterIndex)
        setAnimationDirection(null)
      }, 300)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goToNextPage()
      } else if (e.key === "ArrowLeft") {
        goToPrevPage()
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Get current chapter
  const currentChapter = chapters[currentPage]

  return (
    <div className="how-it-works-modal-overlay">
      <div
        className={`how-it-works-modal ${animationDirection ? `page-turn-${animationDirection}` : ""}`}
        ref={modalRef}
      >
        <button className="close-button" onClick={onClose} aria-label="Close">
          <span className="close-icon">×</span>
        </button>

        <div className="modal-content">
          <div className="page-header">
            <h1>{currentChapter.title}</h1>
          </div>

          {currentChapter.content}

          <div className="page-navigation">
            {currentPage > 0 && (
              <button className="nav-button prev-button" onClick={goToPrevPage} aria-label="Previous page">
                <span className="nav-arrow prev-arrow">‹</span>
                <span>Previous</span>
              </button>
            )}

            <div className="page-indicator">
              {currentPage === 0 ? "Index" : `${currentPage} of ${chapters.length - 1}`}
            </div>

            {currentPage < chapters.length - 1 && (
              <button className="nav-button next-button" onClick={goToNextPage} aria-label="Next page">
                <span>Next</span>
                <span className="nav-arrow next-arrow">›</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorksModal


