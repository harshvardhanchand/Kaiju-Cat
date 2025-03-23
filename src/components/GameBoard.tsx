import React, { useEffect, useState, useRef } from 'react';
import GameService from '../services/GameService';
import './GameBoard.css';
import { BuildingType, CellType, Command, CommandType, Direction, KaijuType, ObstacleType, Position } from '../models/types';
import Building from '../models/Building';
import Kaiju from '../models/Kaiju';
import Obstacle from '../models/Obstacle';
import Bed from '../models/Bed';
import Entity from '../models/Entity';
import CommandPanel from './CommandPanel';
import GameStatus from './GameStatus';

// Cell size in pixels
const CELL_SIZE = 64;

// Move history item interface
interface TestPlanItem {
  moveNumber: number;
  commandsPlaced: {
    position: Position;
    floor: number;
    command: Command;
  }[];
  score: number;
  gridState: (Entity | null)[][];
}

const GameBoard: React.FC = () => {
  const [gameService] = useState(() => new GameService());
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [testPlans, setTestPlans] = useState<TestPlanItem[][]>([]);
  const [currentTestPlan, setCurrentTestPlan] = useState<TestPlanItem[]>([]);
  const [currentMoveCommands, setCurrentMoveCommands] = useState<{
    position: Position;
    floor: number;
    command: Command;
  }[]>([]);
  const [showPastTests, setShowPastTests] = useState(false);
  const [isTestPlanRunning, setIsTestPlanRunning] = useState(false);
  const testPlanTimerRef = useRef<number | null>(null);
  
  // Replay functionality
  const [selectedTestPlanIndex, setSelectedTestPlanIndex] = useState(0);
  const [currentReplayMove, setCurrentReplayMove] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayTimerRef = useRef<number | null>(null);

  // Force re-render when game state changes
  const refreshBoard = () => {
    // Using React's setState with function form on an existing state causes re-render
    setCurrentMoveCommands(prev => [...prev]);
  };

  useEffect(() => {
    // Initialize game
    gameService.initGame();
    refreshBoard();
    
    // Clear current test plan
    setCurrentTestPlan([]);
    setCurrentMoveCommands([]);
  }, [gameService]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (testPlanTimerRef.current !== null) {
        window.clearInterval(testPlanTimerRef.current);
      }
      if (replayTimerRef.current !== null) {
        window.clearInterval(replayTimerRef.current);
      }
    };
  }, []);

  const startGame = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }
  };

  const resetGame = () => {
    gameService.initGame();
    setGameStarted(false);
    setCurrentTestPlan([]);
    setCurrentMoveCommands([]);
    stopTestPlan();
    stopReplay();
    refreshBoard();
  };

  const captureCurrentState = (): TestPlanItem => {
    const gameBoard = gameService.getGameBoard();
    
    // Deep clone the grid to save the current state
    // We need to ensure we're getting a proper deep clone of entities
    const gridClone: (Entity | null)[][] = [];
    
    const originalGrid = gameBoard.getGrid();
    for (let i = 0; i < originalGrid.length; i++) {
      gridClone[i] = [];
      for (let j = 0; j < originalGrid[i].length; j++) {
        gridClone[i][j] = originalGrid[i][j];
      }
    }
    
    const state = {
      moveNumber: gameService.getCurrentMove(),
      commandsPlaced: [...currentMoveCommands],
      score: gameService.getScore(),
      gridState: gridClone
    };
    
    console.log(`CaptureCurrentState: Move ${state.moveNumber}, Score ${state.score}, Commands: ${state.commandsPlaced.length}`);
    return state;
  };

  const executeTurn = () => {
    if (gameStarted && !gameService.isGameOver()) {
      console.log(`ExecuteTurn: Current move before execution: ${gameService.getCurrentMove()}`);
      
      // Save the current state BEFORE execution to know the commands that led to the next state
      const currentState = captureCurrentState();
      console.log(`ExecuteTurn: Current State - Move ${currentState.moveNumber}, Score: ${currentState.score}`);
      
      // Execute the turn
      gameService.executeTurn();
      console.log(`ExecuteTurn: Executed turn, new move: ${gameService.getCurrentMove()}`);
      
      // Update test plan with the PREVIOUS state (before this turn)
      const updatedTestPlan = [...currentTestPlan, currentState];
      setCurrentTestPlan(updatedTestPlan);
      console.log(`ExecuteTurn: Updated currentTestPlan to length: ${updatedTestPlan.length}`);
      
      // Clear current move commands for next turn
      setCurrentMoveCommands([]);
      
      // Refresh the board
      refreshBoard();
      
      // If the game is over after this turn, capture the final state and save
      if (gameService.isGameOver()) {
        console.log("ExecuteTurn: Game is over, capturing final state");
        
        // Capture the final state
        const finalState = captureCurrentState();
        console.log(`ExecuteTurn: Final State - Move ${finalState.moveNumber}, Score: ${finalState.score}`);
        
        // Create a complete plan with both the previous states and the final state
        const completeTestPlan = [...updatedTestPlan, finalState];
        console.log(`ExecuteTurn: Complete test plan has ${completeTestPlan.length} states`);
        
        // Always save the complete test plan when game is over
        if (isTestPlanRunning) {
          console.log(`ExecuteTurn: Stopping test plan with ${completeTestPlan.length} states`);
          stopTestPlan(completeTestPlan);
        } else {
          console.log(`ExecuteTurn: Saving test plan with ${completeTestPlan.length} states`);
          saveCurrentTestPlan(completeTestPlan);
        }
      }
    }
  };

  const saveCurrentTestPlan = (planToSave = currentTestPlan) => {
    if (!planToSave || planToSave.length === 0) {
      console.log("SaveCurrentTestPlan: No moves to save in currentTestPlan");
      return;
    }
    
    console.log(`SaveCurrentTestPlan: Preparing to save plan with ${planToSave.length} states`);
    console.log(`SaveCurrentTestPlan: First state move: ${planToSave[0]?.moveNumber}, Last state move: ${planToSave[planToSave.length-1]?.moveNumber}`);
    
    try {
      // Create a simplified version of the plan that doesn't include full Entity instances
      const simplifiedPlan = planToSave.map(item => {
        // Create simplified grid without entity methods
        const simplifiedGrid = item.gridState.map(row => 
          row.map(cell => {
            if (!cell) return null;
            
            // Extract only the data we need based on entity type
            if (cell.type === CellType.KAIJU) {
              return {
                type: cell.type,
                position: { ...cell.position },
                id: cell.id,
                kaijuType: (cell as Kaiju).getKaijuType(),
                power: (cell as Kaiju).getPower(),
                direction: (cell as Kaiju).getDirection(),
              };
            } else if (cell.type === CellType.BUILDING) {
              return {
                type: cell.type,
                position: { ...cell.position },
                id: cell.id,
                buildingType: (cell as Building).getBuildingType(),
                intactFloors: (cell as Building).getIntactFloors(),
                // We don't save commands as they're not needed for replay
              };
            } else if (cell.type === CellType.OBSTACLE) {
              return {
                type: cell.type,
                position: { ...cell.position },
                id: cell.id,
                obstacleType: (cell as Obstacle).getObstacleType(),
              };
            } else if (cell.type === CellType.BED) {
              return {
                type: cell.type,
                position: { ...cell.position },
                id: cell.id,
                kaijuType: (cell as Bed).getKaijuType(),
                bedPosition: (cell as Bed).getBedPosition(),
              };
            } else {
              return {
                type: cell.type,
                position: { ...cell.position },
                id: cell.id,
              };
            }
          })
        );
        
        return {
          moveNumber: item.moveNumber,
          commandsPlaced: item.commandsPlaced.map(cmd => ({
            position: { ...cmd.position },
            floor: cmd.floor,
            command: { ...cmd.command }
          })),
          score: item.score,
          gridState: simplifiedGrid
        };
      });
      
      // Now we can safely JSON.stringify this simplified plan
      const planCopy = JSON.parse(JSON.stringify(simplifiedPlan));
      
      // Update the test plans state
      setTestPlans(prev => {
        const updatedPlans = [...prev, planCopy];
        console.log(`SaveCurrentTestPlan: Updated testPlans length: ${updatedPlans.length}`);
        
        // Log details about the newly saved plan
        const newPlanIndex = updatedPlans.length - 1;
        const newPlan = updatedPlans[newPlanIndex];
        console.log(`SaveCurrentTestPlan: Test plan ${newPlanIndex} saved with ${newPlan.length} states`);
        console.log(`SaveCurrentTestPlan: First state: Move ${newPlan[0]?.moveNumber}, Score ${newPlan[0]?.score}`);
        console.log(`SaveCurrentTestPlan: Last state: Move ${newPlan[newPlan.length-1]?.moveNumber}, Score ${newPlan[newPlan.length-1]?.score}`);
        
        return updatedPlans;
      });
      
      // Clear the current test plan after saving
      setCurrentTestPlan([]);
      
    } catch (error: any) {
      console.error("SaveCurrentTestPlan: Error saving test plan:", error);
      console.error("Error details:", error.message);
      alert("Failed to save test plan. See console for details.");
    }
  };

  // Add a debug function to show the current state
  const debugState = () => {
    console.log("DEBUG STATE:");
    console.log("- testPlans length:", testPlans.length);
    console.log("- currentTestPlan length:", currentTestPlan.length);
    console.log("- currentMoveCommands length:", currentMoveCommands.length);
    console.log("- gameStarted:", gameStarted);
    console.log("- isTestPlanRunning:", isTestPlanRunning);
    console.log("- showPastTests:", showPastTests);
  };

  const startTestPlan = () => {
    if (!isTestPlanRunning && gameStarted && !gameService.isGameOver()) {
      setIsTestPlanRunning(true);
      // Execute turn immediately and then start the interval
      executeTurn();
      testPlanTimerRef.current = window.setInterval(() => {
        if (!gameService.isGameOver()) {
          executeTurn();
        } else {
          // Get the current test plan state
          const currentPlan = [...currentTestPlan];
          saveCurrentTestPlan(currentPlan);
          stopTestPlan(currentPlan);
        }
      }, 1000); // 1 second interval
    }
  };

  const stopTestPlan = (planToSave = currentTestPlan) => {
    if (testPlanTimerRef.current !== null) {
      window.clearInterval(testPlanTimerRef.current);
      testPlanTimerRef.current = null;
      setIsTestPlanRunning(false);
      
      // Save the current test plan if it has any moves
      if (planToSave.length > 0) {
        saveCurrentTestPlan(planToSave);
      }
    }
  };

  const toggleTestPlan = () => {
    debugState();
    if (isTestPlanRunning) {
      stopTestPlan();
    } else {
      startTestPlan();
    }
  };

  // Add useEffect to properly update replay state when testPlans or selectedTestPlanIndex changes
  useEffect(() => {
    if (showPastTests && testPlans.length > 0 && selectedTestPlanIndex < testPlans.length) {
      console.log(`TestPlan selected: ${selectedTestPlanIndex}, with ${testPlans[selectedTestPlanIndex].length} moves`);
      // Reset the current replay move when changing test plans
      setCurrentReplayMove(0);
    }
  }, [showPastTests, selectedTestPlanIndex, testPlans]);

  // Replay functions
  const startReplay = () => {
    if (testPlans.length === 0 || selectedTestPlanIndex >= testPlans.length) {
      console.log("StartReplay: Cannot start replay - no valid test plan");
      return;
    }
    
    const selectedPlan = testPlans[selectedTestPlanIndex];
    if (!selectedPlan || selectedPlan.length <= 1) {
      console.log("StartReplay: Cannot start replay - test plan has insufficient states");
      return;
    }
    
    console.log(`StartReplay: Starting replay for test plan ${selectedTestPlanIndex} with ${selectedPlan.length} states`);
    
    // Make sure we have a safe current replay move
    const maxMoves = selectedPlan.length - 1;
    const safeCurrentMove = Math.min(currentReplayMove, maxMoves);
    
    // Start from beginning if at the end
    if (safeCurrentMove >= maxMoves) {
      console.log("StartReplay: Replay at end, restarting from beginning");
      setCurrentReplayMove(0);
    }
    
    setIsReplaying(true);
    
    // Clear any existing interval
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    
    // Set a new interval with a 1.5 second delay
    replayTimerRef.current = window.setInterval(() => {
      setCurrentReplayMove(prev => {
        const nextMove = prev + 1;
        console.log(`StartReplay: Moving from move ${prev} to ${nextMove}`);
        
        if (nextMove >= selectedPlan.length) {
          console.log('StartReplay: Reached the end, stopping replay');
          stopReplay();
          return prev; // Stay at the last move
        }
        return nextMove;
      });
    }, 1500); // 1.5 second interval for better visibility
  };

  const stopReplay = () => {
    console.log('StopReplay: Stopping replay');
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    setIsReplaying(false);
  };

  const restartReplay = () => {
    console.log('RestartReplay: Restarting replay from beginning');
    stopReplay();
    setCurrentReplayMove(0);
    // Small delay before starting to ensure state updates
    setTimeout(() => startReplay(), 200);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Stop any ongoing replay when manually adjusting the slider
    if (isReplaying) {
      stopReplay();
    }
    
    const newValue = parseInt(e.target.value);
    console.log(`HandleSliderChange: Slider moved to position ${newValue}`);
    
    // Ensure the value is valid
    const selectedPlan = testPlans[selectedTestPlanIndex];
    if (selectedPlan && newValue >= 0 && newValue < selectedPlan.length) {
      setCurrentReplayMove(newValue);
      console.log(`HandleSliderChange: Setting currentReplayMove to ${newValue}, showing state with score: ${selectedPlan[newValue]?.score}`);
    } else {
      console.log(`HandleSliderChange: Invalid slider value: ${newValue}`);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted || !selectedCommand || isTestPlanRunning || showPastTests) return;

    const position: Position = { row, col };
    const entity = gameService.getGameBoard().getEntityAt(position);

    if (entity && entity.getType() === CellType.BUILDING) {
      const success = gameService.placeCommand(position, selectedFloor, selectedCommand);
      if (success) {
        // Track command placement for test plan
        setCurrentMoveCommands(prev => [
          ...prev,
          {
            position,
            floor: selectedFloor,
            command: selectedCommand
          }
        ]);
        refreshBoard();
      }
    }
  };

  const handleCommandSelect = (command: Command) => {
    setSelectedCommand(command);
  };

  const handleFloorSelect = (floor: number) => {
    setSelectedFloor(floor);
  };

  // Add an effect to monitor showPastTests changes
  useEffect(() => {
    console.log(`ShowPastTests changed to: ${showPastTests}`);
    if (showPastTests) {
      console.log("Panel should now be visible");
      // Force refresh of the board when showing past tests
      setTimeout(() => {
        console.log("Forcing refresh after showPastTests change");
        refreshBoard();
      }, 50);
    }
  }, [showPastTests]);

  const togglePastTests = () => {
    debugState(); // Get full debug state when toggle is clicked
    
    console.log(`TogglePastTests: Button clicked - current state - showPastTests: ${showPastTests}, gameStarted: ${gameStarted}, testPlans: ${testPlans.length}`);
    
    if (showPastTests) {
      // We're closing the past tests panel
      console.log("TogglePastTests: Hiding past tests panel");
      stopReplay();
      setShowPastTests(false);
    } else {
      // We're opening the past tests panel
      console.log(`TogglePastTests: Attempting to show past tests panel with ${testPlans.length} plans`);
      
      // Check if we have test plans to show
      if (testPlans.length === 0) {
        console.log("TogglePastTests: No test plans available to show");
        alert("No test plans available to review. Complete a game to create a test plan.");
        return;
      }
      
      // If we have an active game with an unsaved test plan, save it first
      if (gameStarted && currentTestPlan.length > 0) {
        console.log(`TogglePastTests: Saving current test plan with ${currentTestPlan.length} states before showing history`);
        saveCurrentTestPlan(currentTestPlan);
      }
      
      try {
        // Initialize to the last test plan and the first move
        const lastPlanIndex = testPlans.length - 1;
        console.log(`TogglePastTests: Setting selected test plan to the most recent (index ${lastPlanIndex})`);
        setSelectedTestPlanIndex(lastPlanIndex);
        setCurrentReplayMove(0);
        
        // Show the past tests panel - IMPORTANT: This must be after setting up the test plan index
        console.log("TogglePastTests: Setting showPastTests to true");
        setShowPastTests(true);
        
        // Log test plans for debugging
        console.log("TogglePastTests: Test plans array structure:", JSON.stringify(testPlans));
        testPlans.forEach((plan, idx) => {
          console.log(`TogglePastTests: Plan ${idx}: ${plan.length} states, final score: ${plan[plan.length-1]?.score}`);
          console.log(`TogglePastTests: First item in plan:`, JSON.stringify(plan[0]));
        });
      } catch (error) {
        console.error("TogglePastTests: Error occurred:", error);
      }
    }
  };

  const handleTestPlanSelect = (index: number) => {
    stopReplay();
    setSelectedTestPlanIndex(index);
    setCurrentReplayMove(0);
  };

  // Verify test plans when they change
  useEffect(() => {
    if (testPlans.length > 0) {
      console.log(`TestPlans updated: ${testPlans.length} plans available`);
      testPlans.forEach((plan, idx) => {
        console.log(`Plan ${idx}: ${plan.length} moves, final score: ${plan[plan.length-1]?.score}`);
      });
    }
  }, [testPlans]);

  // Render grid cell
  const renderCell = (entity: Entity | null, row: number, col: number) => {
    if (!entity) {
      return (
        <div 
          key={`${row}-${col}`}
          className="grid-cell empty"
          onClick={() => handleCellClick(row, col)}
        />
      );
    }

    let cellClass = 'grid-cell';
    let content: React.ReactNode = null;
    
    // Get the entity type safely - handle both class instances and plain objects
    const entityType = typeof entity.getType === 'function' 
      ? entity.getType() 
      : (entity as any).type;
    
    console.log(`Rendering cell at (${row},${col}) with entity type: ${entityType}`);

    switch (entityType) {
      case CellType.KAIJU:
        let kaijuType;
        let power;
        
        // Handle both Kaiju class instance and plain object
        if (typeof (entity as Kaiju).getKaijuType === 'function') {
          kaijuType = (entity as Kaiju).getKaijuType();
          power = (entity as Kaiju).getPower();
        } else {
          kaijuType = (entity as any).kaijuType;
          power = (entity as any).power;
        }
        
        cellClass += ` kaiju ${kaijuType}`;
        content = (
          <>
            <div className="kaiju-icon" />
            <div className="kaiju-power">{power}</div>
          </>
        );
        break;

      case CellType.BUILDING:
        let buildingType;
        let floor1Command = null;
        let floor2Command = null;
        let intactFloors;
        
        // Handle both Building class instance and plain object
        if (typeof (entity as Building).getBuildingType === 'function') {
          const building = entity as Building;
          buildingType = building.getBuildingType();
          floor1Command = building.getCommand(0);
          floor2Command = building.getCommand(1);
          intactFloors = building.getIntactFloors();
        } else {
          buildingType = (entity as any).buildingType;
          intactFloors = (entity as any).intactFloors || 0;
          // Plain objects don't have command info, so leave floor1Command and floor2Command as null
        }
        
        cellClass += ` building ${buildingType}`;
        
        content = (
          <>
            <div className="building-icon" />
            <div className="building-floors">
              {intactFloors > 0 && (
                <div className={`floor ${floor1Command ? 'has-command' : ''}`}>
                  {floor1Command && renderCommandIcon(floor1Command)}
                </div>
              )}
              {intactFloors > 1 && (
                <div className={`floor ${floor2Command ? 'has-command' : ''}`}>
                  {floor2Command && renderCommandIcon(floor2Command)}
                </div>
              )}
            </div>
          </>
        );
        break;

      case CellType.OBSTACLE:
        let obstacleType;
        
        // Handle both Obstacle class instance and plain object
        if (typeof (entity as Obstacle).getObstacleType === 'function') {
          obstacleType = (entity as Obstacle).getObstacleType();
        } else {
          obstacleType = (entity as any).obstacleType;
        }
        
        cellClass += ` obstacle ${obstacleType}`;
        content = <div className="obstacle-icon" />;
        break;

      case CellType.BED:
        let bedKaijuType;
        
        // Handle both Bed class instance and plain object
        if (typeof (entity as Bed).getKaijuType === 'function') {
          bedKaijuType = (entity as Bed).getKaijuType();
        } else {
          bedKaijuType = (entity as any).kaijuType;
        }
        
        cellClass += ` bed ${bedKaijuType}`;
        content = <div className="bed-icon" />;
        break;
    }

    return (
      <div 
        key={`${row}-${col}`}
        className={cellClass}
        onClick={() => handleCellClick(row, col)}
      >
        {content}
      </div>
    );
  };

  // Render command icon
  const renderCommandIcon = (command: Command) => {
    switch (command.type) {
      case CommandType.DIRECTION:
        return <div className={`direction-icon ${command.direction}`} />;
      case CommandType.STOMP:
        return <div className="stomp-icon" />;
      case CommandType.POWER_UP:
        return <div className="power-up-icon" />;
      default:
        return null;
    }
  };

  // Render game grid
  const renderGrid = () => {
    console.log("RENDER GRID CALLED, showPastTests =", showPastTests);
    
    let grid;
    let rows;
    let cols;
    
    if (showPastTests && testPlans.length > 0 && selectedTestPlanIndex < testPlans.length) {
      console.log(`RenderGrid: Attempting to render grid for test plan review: selectedIndex=${selectedTestPlanIndex}, replayMove=${currentReplayMove}`);
      
      try {
        // Show replay state
        const selectedPlan = testPlans[selectedTestPlanIndex];
        if (selectedPlan && selectedPlan.length > 0) {
          const safeIndex = Math.min(currentReplayMove, selectedPlan.length - 1);
          console.log(`RenderGrid: Using replay state at index ${safeIndex}`);
          
          const moveState = selectedPlan[safeIndex];
          if (moveState && moveState.gridState && Array.isArray(moveState.gridState)) {
            grid = moveState.gridState;
            // Assuming all test plans use the same board size
            rows = grid.length;
            cols = grid[0].length;
            console.log(`RenderGrid: Test plan grid dimensions: ${rows}x${cols}`);
          } else {
            console.error(`RenderGrid: Invalid move state at index ${safeIndex} in plan ${selectedTestPlanIndex}`);
            // Fall back to current game state
            const gameBoard = gameService.getGameBoard();
            grid = gameBoard.getGrid();
            rows = gameBoard.getRows();
            cols = gameBoard.getCols();
          }
        } else {
          console.error(`RenderGrid: Selected plan ${selectedTestPlanIndex} is empty or invalid`);
          // Fall back to current game state
          const gameBoard = gameService.getGameBoard();
          grid = gameBoard.getGrid();
          rows = gameBoard.getRows();
          cols = gameBoard.getCols();
        }
      } catch (error) {
        console.error("RenderGrid: Error rendering test plan grid:", error);
        // Fall back to current game state
        const gameBoard = gameService.getGameBoard();
        grid = gameBoard.getGrid();
        rows = gameBoard.getRows();
        cols = gameBoard.getCols();
      }
    } else {
      // Show current game state
      console.log("RenderGrid: Using current game state");
      const gameBoard = gameService.getGameBoard();
      grid = gameBoard.getGrid();
      rows = gameBoard.getRows();
      cols = gameBoard.getCols();
    }

    console.log(`RenderGrid: Final grid dimensions: ${rows}x${cols}`);
    
    return (
      <div 
        className="game-grid"
        style={{
          gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
          gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
        }}
      >
        {Array.from({ length: rows }).map((_, row) => 
          Array.from({ length: cols }).map((_, col) => 
            renderCell(grid[row][col], row, col)
          )
        )}
      </div>
    );
  };

  // Render past tests panel
  const renderPastTestsPanel = () => {
    console.log("RENDER PAST TESTS PANEL CALLED, showPastTests =", showPastTests, "testPlans.length =", testPlans.length);
    
    // Check if there are no test plans or invalid index
    if (testPlans.length === 0 || selectedTestPlanIndex < 0 || selectedTestPlanIndex >= testPlans.length) {
      console.error(`RenderPastTestsPanel: No test plans available or invalid index: ${selectedTestPlanIndex}`);
      return (
        <div className="test-replay-panel">
          <div className="history-header">
            <h3>Test Plan Review</h3>
            <button className="close-history" onClick={togglePastTests}>×</button>
          </div>
          <div className="no-history">No test plans available to review</div>
        </div>
      );
    }
    
    // Check if selected plan is valid
    const selectedPlan = testPlans[selectedTestPlanIndex];
    if (!selectedPlan || !Array.isArray(selectedPlan) || selectedPlan.length === 0) {
      console.error(`RenderPastTestsPanel: Selected plan at index ${selectedTestPlanIndex} is invalid or empty`);
      console.log("Plan data:", selectedPlan);
      return (
        <div className="test-replay-panel">
          <div className="history-header">
            <h3>Test Plan Review</h3>
            <button className="close-history" onClick={togglePastTests}>×</button>
          </div>
          <div className="no-history">Selected test plan is invalid or empty</div>
        </div>
      );
    }
    
    console.log(`RenderPastTestsPanel: Rendering plan ${selectedTestPlanIndex} with ${selectedPlan.length} states`);
    console.log("First state in plan:", selectedPlan[0]);
    
    // Calculate max moves (0-indexed, so subtract 1)
    const maxMoves = Math.max(0, selectedPlan.length - 1);
    
    // Ensure current replay move is valid
    const safeCurrentMove = Math.min(currentReplayMove, maxMoves);
    if (safeCurrentMove !== currentReplayMove) {
      console.log(`RenderPastTestsPanel: Adjusting currentReplayMove from ${currentReplayMove} to safe value ${safeCurrentMove}`);
      setCurrentReplayMove(safeCurrentMove);
    }
    
    // Get the current state to display - with error checking
    let currentState = null;
    try {
      currentState = selectedPlan[safeCurrentMove];
      console.log(`RenderPastTestsPanel: Current state at move ${safeCurrentMove}:`, currentState);
    } catch (error) {
      console.error(`Error accessing state at index ${safeCurrentMove}:`, error);
    }
    
    if (!currentState) {
      console.error(`RenderPastTestsPanel: No valid state found at move ${safeCurrentMove}`);
    } else {
      console.log(`RenderPastTestsPanel: Displaying state for move ${currentState.moveNumber}, score ${currentState.score}`);
    }

    return (
      <div className="test-replay-panel">
        <div className="history-header">
          <h3>Test Plan Review</h3>
          <button className="close-history" onClick={togglePastTests}>×</button>
        </div>
        
        <div className="test-plan-controls">
          <div className="test-plan-selector">
            <label>Select Test Plan:</label>
            <select 
              value={selectedTestPlanIndex}
              onChange={(e) => handleTestPlanSelect(parseInt(e.target.value))}
            >
              {testPlans.map((plan, index) => (
                <option key={index} value={index}>
                  Plan {index + 1} ({plan?.length || 0} moves, Score: {plan && plan.length > 0 ? plan[plan.length-1]?.score || 0 : 0})
                </option>
              ))}
            </select>
          </div>
          
          <div className="replay-controls">
            <button 
              className="replay-button"
              onClick={restartReplay}
              disabled={maxMoves <= 0}
            >
              ⏮️ Restart
            </button>
            
            <button 
              className="replay-button"
              onClick={isReplaying ? stopReplay : startReplay}
              disabled={maxMoves <= 0}
            >
              {isReplaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
          </div>
        </div>
        
        <div className="move-slider-container">
          <span>Move: {safeCurrentMove}</span>
          <input
            type="range"
            min="0"
            max={maxMoves}
            value={safeCurrentMove}
            onChange={handleSliderChange}
            className="move-slider"
            disabled={maxMoves <= 0}
            step="1"
          />
          <span>Max: {maxMoves}</span>
        </div>
        
        <div className="history-content">
          {!currentState ? (
            <div className="no-history">No data available for this move</div>
          ) : (
            <div className="test-info">
              <h4>Move {safeCurrentMove} Details</h4>
              <div className="move-details">
                <div className="move-score">
                  Score: {currentState.score || 0}
                </div>
                <div className="move-commands">
                  <h5>Commands Placed:</h5>
                  {!currentState.commandsPlaced || currentState.commandsPlaced.length === 0 ? (
                    <div className="no-commands">No commands placed</div>
                  ) : (
                    currentState.commandsPlaced.map((cmd, cmdIndex) => (
                      <div key={cmdIndex} className="history-command">
                        <span>
                          ({cmd.position.row}, {cmd.position.col}) - Floor {cmd.floor + 1}: 
                          {cmd.command.type === CommandType.DIRECTION 
                            ? ` ${cmd.command.direction?.toUpperCase()}` 
                            : cmd.command.type === CommandType.STOMP 
                              ? ' STOMP' 
                              : ' POWER UP'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="game-board">
      <GameStatus 
        score={
          showPastTests && testPlans.length > 0 
            ? testPlans[selectedTestPlanIndex]?.[currentReplayMove]?.score || 0
            : gameService.getScore()
        }
        currentMove={
          showPastTests && testPlans.length > 0
            ? currentReplayMove
            : gameService.getCurrentMove()
        }
        moveLimit={gameService.getMoveLimit()}
        budget={gameService.getRemainingBudget()}
        initialBudget={gameService.getInitialBudget()}
        gameOver={
          showPastTests && testPlans.length > 0
            ? currentReplayMove >= (testPlans[selectedTestPlanIndex]?.length - 1)
            : gameService.isGameOver()
        }
      />
      
      <div className="board-container">
        {renderGrid()}
        {showPastTests && renderPastTestsPanel()}
      </div>
      
      {/* Debug button for testing */}
      <button 
        onClick={() => {
          debugState();
          console.log("Test plans:", testPlans);
          console.log("Show past tests:", showPastTests);
        }}
        style={{ marginBottom: '10px', padding: '5px', background: '#333', color: 'white', border: 'none' }}
      >
        Debug State
      </button>
      
      <div className="game-controls">
        {!gameStarted ? (
          <button className="start-button" onClick={startGame}>
            Start Game
          </button>
        ) : (
          <>
            <button 
              className="test-plan-button" 
              onClick={toggleTestPlan}
              disabled={gameService.isGameOver() || isTestPlanRunning || showPastTests}
            >
              {isTestPlanRunning ? 'Stop Test Plan' : 'Test Plan'}
            </button>
            <button 
              className="review-button" 
              onClick={togglePastTests}
              disabled={testPlans.length === 0}
            >
              {showPastTests ? 'Back to Game' : 'Review Past Tests'}
            </button>
            <button 
              className="reset-button" 
              onClick={resetGame}
              disabled={showPastTests && isReplaying}
            >
              Reset Game
            </button>
          </>
        )}
      </div>
      
      {!showPastTests && (
        <CommandPanel 
          commands={gameService.getAvailableCommands()}
          selectedCommand={selectedCommand}
          onCommandSelect={handleCommandSelect}
          selectedFloor={selectedFloor}
          onFloorSelect={handleFloorSelect}
          budget={gameService.getRemainingBudget()}
          disabled={!gameStarted || gameService.isGameOver() || isTestPlanRunning || showPastTests}
        />
      )}
    </div>
  );
};

export default GameBoard; 