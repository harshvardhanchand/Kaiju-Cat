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
      // Capture current state before executing the turn
      const currentState = captureCurrentState();
      
      console.log(`ExecuteTurn: Capturing state for move ${currentState.moveNumber}`);
      
      // Execute the turn first to capture changes
      gameService.executeTurn();
      
      // Then add previous state to the test plan
      const updatedTestPlan = [...currentTestPlan, currentState];
      setCurrentTestPlan(updatedTestPlan);
      console.log(`ExecuteTurn: Updated currentTestPlan length: ${updatedTestPlan.length}`);
      
      // Clear current move commands for next turn
      setCurrentMoveCommands([]);
      
      // Trigger UI refresh
      refreshBoard();
      
      // If the game is over after this turn, save the test plan immediately 
      // Include the final state in the save
      if (gameService.isGameOver()) {
        console.log("ExecuteTurn: Game is over, capturing final state and saving");
        
        // Capture the final state after the turn executed
        const finalState = captureCurrentState();
        const completeTestPlan = [...updatedTestPlan, finalState];
        console.log(`ExecuteTurn: Added final state with score ${finalState.score}`);
        
        if (isTestPlanRunning) {
          stopTestPlan(completeTestPlan);
        } else {
          // Always save the test plan when game is over
          saveCurrentTestPlan(completeTestPlan);
        }
      }
    }
  };

  const saveCurrentTestPlan = (planToSave = currentTestPlan) => {
    if (planToSave.length > 0) {
      // Add final state - only if not already added
      const finalState = captureCurrentState();
      
      // Check if we need to add the final state
      let completePlan = [...planToSave];
      const lastState = planToSave[planToSave.length - 1];
      
      if (!lastState || lastState.moveNumber !== finalState.moveNumber) {
        completePlan = [...planToSave, finalState];
        console.log(`SaveCurrentTestPlan: Added final state for move ${finalState.moveNumber}`);
      } else {
        console.log(`SaveCurrentTestPlan: Final state already exists for move ${lastState.moveNumber}`);
      }
      
      console.log(`SaveCurrentTestPlan: Saving test plan with ${completePlan.length} moves`);
      console.log(`SaveCurrentTestPlan: First move: ${completePlan[0]?.moveNumber}, Last move: ${completePlan[completePlan.length-1]?.moveNumber}`);
      
      setTestPlans(prev => {
        const updated = [...prev, completePlan];
        console.log(`SaveCurrentTestPlan: Updated testPlans length: ${updated.length}`);
        return updated;
      });
      
      // Clear the current test plan after saving
      setCurrentTestPlan([]);
    } else {
      console.log("SaveCurrentTestPlan: No moves to save in currentTestPlan");
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
      console.log("Cannot start replay - no valid test plan");
      return;
    }
    
    const selectedPlan = testPlans[selectedTestPlanIndex];
    if (!selectedPlan || selectedPlan.length <= 1) {
      console.log("Cannot start replay - test plan has insufficient moves");
      return;
    }
    
    console.log(`Starting replay for test plan ${selectedTestPlanIndex} with ${selectedPlan.length} moves`);
    
    // Make sure we have a safe current replay move
    const maxMoves = selectedPlan.length - 1;
    const safeCurrentMove = Math.min(currentReplayMove, maxMoves);
    
    // Start from beginning if at the end
    if (safeCurrentMove >= maxMoves) {
      console.log("Replay at end, restarting from beginning");
      setCurrentReplayMove(0);
    }
    
    setIsReplaying(true);
    
    // Clear any existing interval
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
    }
    
    // Set a new interval with a longer delay (2 seconds instead of 1)
    replayTimerRef.current = window.setInterval(() => {
      setCurrentReplayMove(prev => {
        const nextMove = prev + 1;
        console.log(`Replay: Moving from move ${prev} to ${nextMove}`);
        
        if (nextMove >= selectedPlan.length) {
          console.log('Replay: Reached the end, stopping');
          stopReplay();
          return prev; // Stay at the last move
        }
        return nextMove;
      });
    }, 2000); // 2 second interval for better visibility
  };

  const stopReplay = () => {
    console.log('Stopping replay');
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
      setIsReplaying(false);
    }
  };

  const restartReplay = () => {
    console.log('Restarting replay');
    stopReplay();
    setCurrentReplayMove(0);
    setTimeout(() => startReplay(), 300); // Small delay before starting
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopReplay();
    const newValue = parseInt(e.target.value);
    console.log(`Slider changed to: ${newValue}`);
    setCurrentReplayMove(newValue);
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

  const togglePastTests = () => {
    console.log(`TogglePastTests: Current state - showPastTests: ${showPastTests}, gameStarted: ${gameStarted}, testPlans: ${testPlans.length}`);
    
    if (showPastTests) {
      // We're closing the past tests panel
      console.log("Hiding past tests panel");
      setShowPastTests(false);
      stopReplay();
    } else {
      // We're opening the past tests panel
      console.log(`Attempting to show past tests panel with ${testPlans.length} test plans`);
      
      // If we have an active test that hasn't been saved yet, save it first
      if (gameStarted && currentTestPlan.length > 0) {
        console.log(`Saving current test plan with ${currentTestPlan.length} moves before showing history`);
        saveCurrentTestPlan(currentTestPlan);
      }
      
      // Then show the past tests
      if (testPlans.length > 0) {
        setShowPastTests(true);
        
        // Initialize to the last test plan and the first move
        const lastPlanIndex = testPlans.length - 1;
        console.log(`Setting selected test plan to the most recent (index ${lastPlanIndex})`);
        setSelectedTestPlanIndex(lastPlanIndex);
        setCurrentReplayMove(0);
        
        // Log available test plans for debugging
        testPlans.forEach((plan, idx) => {
          console.log(`Plan ${idx}: ${plan.length} moves, final move: ${plan[plan.length-1]?.moveNumber}, final score: ${plan[plan.length-1]?.score}`);
        });
      } else {
        console.log("No test plans available to show - check if plans are being saved correctly");
        alert("No test plans available to review. Try completing a game first.");
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

    switch (entity.getType()) {
      case CellType.KAIJU:
        const kaiju = entity as Kaiju;
        const kaijuType = kaiju.getKaijuType();
        cellClass += ` kaiju ${kaijuType}`;
        content = (
          <>
            <div className="kaiju-icon" />
            <div className="kaiju-power">{kaiju.getPower()}</div>
          </>
        );
        break;

      case CellType.BUILDING:
        const building = entity as Building;
        const buildingType = building.getBuildingType();
        cellClass += ` building ${buildingType}`;
        
        const floor1Command = building.getCommand(0);
        const floor2Command = building.getCommand(1);
        const intactFloors = building.getIntactFloors();

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
        const obstacle = entity as Obstacle;
        const obstacleType = obstacle.getObstacleType();
        cellClass += ` obstacle ${obstacleType}`;
        content = <div className="obstacle-icon" />;
        break;

      case CellType.BED:
        const bed = entity as Bed;
        const bedKaijuType = bed.getKaijuType();
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
    let grid;
    let rows;
    let cols;
    
    if (showPastTests && testPlans.length > 0 && selectedTestPlanIndex < testPlans.length) {
      // Show replay state
      const selectedPlan = testPlans[selectedTestPlanIndex];
      if (selectedPlan && selectedPlan.length > 0) {
        const safeIndex = Math.min(currentReplayMove, selectedPlan.length - 1);
        console.log(`Rendering replay grid: plan ${selectedTestPlanIndex}, move ${safeIndex}`);
        
        const moveState = selectedPlan[safeIndex];
        if (moveState && moveState.gridState) {
          grid = moveState.gridState;
          // Assuming all test plans use the same board size
          rows = grid.length;
          cols = grid[0].length;
        } else {
          console.error(`Invalid move state at index ${safeIndex} in plan ${selectedTestPlanIndex}`);
          // Fall back to current game state
          const gameBoard = gameService.getGameBoard();
          grid = gameBoard.getGrid();
          rows = gameBoard.getRows();
          cols = gameBoard.getCols();
        }
      } else {
        console.error(`Selected plan ${selectedTestPlanIndex} is empty or invalid`);
        // Fall back to current game state
        const gameBoard = gameService.getGameBoard();
        grid = gameBoard.getGrid();
        rows = gameBoard.getRows();
        cols = gameBoard.getCols();
      }
    } else {
      // Show current game state
      const gameBoard = gameService.getGameBoard();
      grid = gameBoard.getGrid();
      rows = gameBoard.getRows();
      cols = gameBoard.getCols();
    }

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
    // Make sure we have a valid selected plan
    if (!testPlans[selectedTestPlanIndex] || testPlans[selectedTestPlanIndex].length === 0) {
      console.error(`Selected plan ${selectedTestPlanIndex} is invalid or empty`);
      return (
        <div className="test-replay-panel">
          <div className="history-header">
            <h3>Test Plan Review</h3>
            <button className="close-history" onClick={togglePastTests}>×</button>
          </div>
          <div className="no-history">No valid test data available</div>
        </div>
      );
    }
    
    const selectedPlan = testPlans[selectedTestPlanIndex];
    const maxMoves = Math.max(0, selectedPlan.length - 1);
    const safeCurrentMove = Math.min(currentReplayMove, maxMoves);
    
    console.log(`Rendering test panel: plan ${selectedTestPlanIndex}, currentMove: ${safeCurrentMove}, maxMoves: ${maxMoves}`);

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
                  Test Plan {index + 1} ({plan.length} moves)
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
          <span>{maxMoves}</span>
        </div>
        
        <div className="history-content">
          {selectedPlan.length === 0 ? (
            <div className="no-history">No test data available</div>
          ) : (
            <div className="test-info">
              <h4>Move {safeCurrentMove} Details</h4>
              <div className="move-details">
                <div className="move-score">
                  Score: {selectedPlan[safeCurrentMove]?.score || 0}
                </div>
                <div className="move-commands">
                  <h5>Commands Placed:</h5>
                  {!selectedPlan[safeCurrentMove] || (selectedPlan[safeCurrentMove]?.commandsPlaced || []).length === 0 ? (
                    <div className="no-commands">No commands placed</div>
                  ) : (
                    selectedPlan[safeCurrentMove]?.commandsPlaced.map((cmd, cmdIndex) => (
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