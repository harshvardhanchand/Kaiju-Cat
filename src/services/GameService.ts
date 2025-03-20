import CommandManager from '../models/CommandManager';
import GameBoard from '../models/GameBoard';
import { Command, GameConfig, Position } from '../models/types';
import MapGenerator, { MapData } from './MapGenerator';

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  rows: 5,
  cols: 5,
  moveLimit: 15,
  initialBudget: 110,
};

class GameService {
  private gameBoard: GameBoard;
  private commandManager: CommandManager;
  private mapGenerator: MapGenerator;
  private mapData: MapData | null = null;
  
  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.gameBoard = new GameBoard(config);
    this.commandManager = new CommandManager(this.gameBoard);
    this.mapGenerator = new MapGenerator(config.rows, config.cols);
  }
  
  // Initialize/Reset game
  initGame(): void {
    this.gameBoard.reset();
    this.mapData = this.mapGenerator.generateMap();
    this.gameBoard.loadMap(this.mapData);
  }
  
  // Get game board
  getGameBoard(): GameBoard {
    return this.gameBoard;
  }
  
  // Get command manager
  getCommandManager(): CommandManager {
    return this.commandManager;
  }
  
  // Place command on a building at specific position and floor
  placeCommand(position: Position, floor: number, command: Command): boolean {
    return this.commandManager.placeCommandAtPosition(position, floor, command);
  }
  
  // Execute game turn
  executeTurn(): boolean {
    return this.gameBoard.processTurn();
  }
  
  // Check if game is over
  isGameOver(): boolean {
    return this.gameBoard.isGameOver();
  }
  
  // Get current game score
  getScore(): number {
    return this.gameBoard.getScore();
  }
  
  // Get map data
  getMapData(): MapData | null {
    return this.mapData;
  }
  
  // Load a specific map
  loadMap(mapData: MapData): void {
    this.gameBoard.reset();
    this.mapData = mapData;
    this.gameBoard.loadMap(mapData);
  }
  
  // Get current move
  getCurrentMove(): number {
    return this.gameBoard.getCurrentMove();
  }
  
  // Get move limit
  getMoveLimit(): number {
    return this.gameBoard.getMoveLimit();
  }
  
  // Get remaining budget
  getRemainingBudget(): number {
    return this.gameBoard.getBudget();
  }
  
  // Get initial budget
  getInitialBudget(): number {
    return DEFAULT_CONFIG.initialBudget;
  }
  
  // Get available commands
  getAvailableCommands(): Command[] {
    return this.commandManager.getAvailableCommands();
  }
}

export default GameService; 