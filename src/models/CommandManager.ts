import Building from './Building';
import GameBoard from './GameBoard';
import { Command, CommandType, COMMAND_PRICES, Direction, Position } from './types';

class CommandManager {
  private gameBoard: GameBoard;
  
  constructor(gameBoard: GameBoard) {
    this.gameBoard = gameBoard;
  }
  
  // Create a directional command
  createDirectionCommand(direction: Direction): Command {
    return {
      type: CommandType.DIRECTION,
      cost: COMMAND_PRICES[CommandType.DIRECTION],
      direction,
    };
  }
  
  // Create a stomp command
  createStompCommand(): Command {
    return {
      type: CommandType.STOMP,
      cost: COMMAND_PRICES[CommandType.STOMP],
    };
  }
  
  // Create a power up command
  createPowerUpCommand(): Command {
    return {
      type: CommandType.POWER_UP,
      cost: COMMAND_PRICES[CommandType.POWER_UP],
    };
  }
  
  // Place command on building
  placeCommandOnBuilding(buildingId: string, floor: number, command: Command): boolean {
    const buildings = this.gameBoard.getBuildings();
    const building = buildings.find(b => b.getId() === buildingId);
    
    if (!building) {
      return false;
    }
    
    // Check if floor is valid (0 or 1)
    if (floor < 0 || floor > 1) {
      return false;
    }
    
    // Check if building already has a command on this floor
    if (building.getCommand(floor) !== null) {
      return false;
    }
    
    // Check if player has enough budget
    if (!this.gameBoard.spendBudget(command.cost)) {
      return false;
    }
    
    // Set command on building floor
    return building.setCommand(floor, command);
  }
  
  // Place command at position
  placeCommandAtPosition(position: Position, floor: number, command: Command): boolean {
    const entity = this.gameBoard.getEntityAt(position);
    
    if (!entity || entity.getType() !== 'building') {
      return false;
    }
    
    const building = entity as Building;
    return this.placeCommandOnBuilding(building.getId(), floor, command);
  }

  // Execute command on a building based on its position
  executeCommandAtPosition(position: Position): number {
    const entity = this.gameBoard.getEntityAt(position);
    
    if (!entity || entity.getType() !== 'building') {
      return 0;
    }
    
    const building = entity as Building;
    
    // Get the current top floor index (0-indexed)
    const currentFloor = building.getIntactFloors() - 1;
    if (currentFloor < 0) return 0; // No floors left
    
    // Get command from the current top floor
    const command = building.getCommand(currentFloor);
    
    if (!command) return 0; // No command on this floor
    
    // Execute the command based on its type
    switch (command.type) {
      case CommandType.STOMP:
        return this.executeStompAtPosition(position);
      // Other command types would be handled here
      default:
        return 0;
    }
  }

  // Execute stomp command at position
  executeStompAtPosition(position: Position): number {
    const entity = this.gameBoard.getEntityAt(position);
    
    if (!entity || entity.getType() !== 'building') {
      return 0;
    }
    
    const building = entity as Building;
    const value = building.stomp();
    
    if (building.isDestroyed()) {
      this.gameBoard.removeEntity(building);
    }
    
    return value;
  }
  
  // Get all available commands
  getAvailableCommands(): Command[] {
    return [
      this.createDirectionCommand(Direction.NORTH),
      this.createDirectionCommand(Direction.SOUTH),
      this.createDirectionCommand(Direction.EAST),
      this.createDirectionCommand(Direction.WEST),
      this.createStompCommand(),
      this.createPowerUpCommand(),
    ];
  }
  
  // Get command cost
  getCommandCost(commandType: CommandType): number {
    return COMMAND_PRICES[commandType];
  }
}

export default CommandManager; 