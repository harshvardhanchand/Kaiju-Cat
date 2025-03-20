import Bed from './Bed';
import Building from './Building';
import Entity from './Entity';
import Kaiju from './Kaiju';
import Obstacle from './Obstacle';
import {
  BuildingType,
  CellType,
  CommandType,
  Direction,
  GameConfig,
  KaijuType,
  ObstacleType,
  Position
} from './types';
import CommandManager from './CommandManager';

class GameBoard {
  private rows: number;
  private cols: number;
  private grid: (Entity | null)[][];
  private kaijus: Map<string, Kaiju>;
  private buildings: Map<string, Building>;
  private obstacles: Map<string, Obstacle>;
  private beds: Map<string, Bed>;
  private moveLimit: number;
  private currentMove: number;
  private budget: number;
  private initialBudget: number;
  private score: number;
  private commandManager: CommandManager;
  
  constructor(config: GameConfig) {
    this.rows = config.rows;
    this.cols = config.cols;
    this.moveLimit = config.moveLimit;
    this.currentMove = 0;
    this.budget = config.initialBudget;
    this.initialBudget = config.initialBudget;
    this.score = 0;
    
    // Initialize empty grid
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    
    // Initialize entity maps
    this.kaijus = new Map();
    this.buildings = new Map();
    this.obstacles = new Map();
    this.beds = new Map();
    
    // Initialize CommandManager
    this.commandManager = new CommandManager(this);
  }

  // Reset the game
  reset(): void {
    this.currentMove = 0;
    this.budget = this.initialBudget;
    this.score = 0;
    
    // Reset grid
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    
    // Clear entity maps
    this.kaijus.clear();
    this.buildings.clear();
    this.obstacles.clear();
    this.beds.clear();
  }

  // Load generated map data
  loadMap(mapData: any): void {
    if (!mapData) return;

    // Load buildings
    if (mapData.buildings) {
      mapData.buildings.forEach((buildingData: any) => {
        const building = new Building(buildingData.position, buildingData.type);
        this.placeEntity(building);
      });
    }

    // Load obstacles
    if (mapData.obstacles) {
      mapData.obstacles.forEach((obstacleData: any) => {
        const obstacle = new Obstacle(obstacleData.position, obstacleData.type);
        this.placeEntity(obstacle);
      });
    }

    // Load beds
    if (mapData.beds) {
      mapData.beds.forEach((bedData: any) => {
        const bed = new Bed(bedData.position, bedData.kaijuType, bedData.bedPosition);
        this.placeEntity(bed);
      });
    }

    // Load kaijus
    if (mapData.kaijus) {
      mapData.kaijus.forEach((kaijuData: any) => {
        const kaiju = new Kaiju(kaijuData.position, kaijuData.type, kaijuData.direction);
        this.placeEntity(kaiju);
      });
    }
  }

  // Generate a new map (placeholder for procedural generation)
  generateMap(): void {
    this.reset();

    // For now, create a simple map with three kaijus, beds, and some buildings/obstacles
    const blueKaiju = new Kaiju({ row: 0, col: 0 }, KaijuType.BLUE);
    const greenKaiju = new Kaiju({ row: 3, col: 0 }, KaijuType.GREEN);
    const redKaiju = new Kaiju({ row: 6, col: 0 }, KaijuType.RED);

    const blueBed = new Bed({ row: 0, col: this.cols - 1 }, KaijuType.BLUE, 'top');
    const greenBed = new Bed({ row: 3, col: this.cols - 1 }, KaijuType.GREEN, 'middle');
    const redBed = new Bed({ row: 6, col: this.cols - 1 }, KaijuType.RED, 'bottom');

    // Place buildings and obstacles randomly
    for (let i = 0; i < 5; i++) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * (this.cols - 2)) + 1; // Avoid first and last columns
      const type = Math.random() > 0.5 ? BuildingType.HIGH_VALUE : BuildingType.LOW_VALUE;
      
      if (!this.getEntityAt({ row, col })) {
        const building = new Building({ row, col }, type);
        this.placeEntity(building);
      }
    }

    // Add one power plant
    const powerPlantRow = Math.floor(Math.random() * this.rows);
    const powerPlantCol = Math.floor(Math.random() * (this.cols - 2)) + 1;
    if (!this.getEntityAt({ row: powerPlantRow, col: powerPlantCol })) {
      const powerPlant = new Building({ row: powerPlantRow, col: powerPlantCol }, BuildingType.POWER_PLANT);
      this.placeEntity(powerPlant);
    }

    // Place obstacles
    for (let i = 0; i < 3; i++) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * (this.cols - 2)) + 1; // Avoid first and last columns
      const types = [ObstacleType.MUD, ObstacleType.BOULDER, ObstacleType.SPIKE_TRAP];
      const type = types[i % 3];
      
      if (!this.getEntityAt({ row, col })) {
        const obstacle = new Obstacle({ row, col }, type);
        this.placeEntity(obstacle);
      }
    }

    // Place entities
    this.placeEntity(blueKaiju);
    this.placeEntity(greenKaiju);
    this.placeEntity(redKaiju);
    this.placeEntity(blueBed);
    this.placeEntity(greenBed);
    this.placeEntity(redBed);
  }

  // Place entity on the board
  placeEntity(entity: Entity): boolean {
    const { row, col } = entity.getPosition();
    
    // Check if position is valid
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    
    // Add entity to grid and maps
    this.grid[row][col] = entity;
    
    switch (entity.getType()) {
      case CellType.KAIJU:
        this.kaijus.set(entity.getId(), entity as Kaiju);
        break;
      case CellType.BUILDING:
        this.buildings.set(entity.getId(), entity as Building);
        break;
      case CellType.OBSTACLE:
        this.obstacles.set(entity.getId(), entity as Obstacle);
        break;
      case CellType.BED:
        this.beds.set(entity.getId(), entity as Bed);
        break;
    }
    
    return true;
  }

  // Move entity to new position
  moveEntity(entity: Entity, newPosition: Position): boolean {
    const { row, col } = entity.getPosition();
    const { row: newRow, col: newCol } = newPosition;
    
    // Check if new position is valid
    if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) {
      return false;
    }
    
    // Remove entity from old position
    this.grid[row][col] = null;
    
    // Update entity position
    entity.setPosition(newPosition);
    
    // Place entity at new position
    this.grid[newRow][newCol] = entity;
    
    return true;
  }

  // Remove entity from board
  removeEntity(entity: Entity): boolean {
    const { row, col } = entity.getPosition();
    
    // Check if position is valid
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    
    // Remove entity from grid
    this.grid[row][col] = null;
    
    // Remove entity from maps
    switch (entity.getType()) {
      case CellType.KAIJU:
        this.kaijus.delete(entity.getId());
        break;
      case CellType.BUILDING:
        this.buildings.delete(entity.getId());
        break;
      case CellType.OBSTACLE:
        this.obstacles.delete(entity.getId());
        break;
      case CellType.BED:
        this.beds.delete(entity.getId());
        break;
    }
    
    return true;
  }

  // Get entity at position
  getEntityAt(position: Position): Entity | null {
    const { row, col } = position;
    
    // Check if position is valid
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    
    return this.grid[row][col];
  }

  // Check if position is valid
  isValidPosition(position: Position): boolean {
    const { row, col } = position;
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  // Process one game turn (move all kaijus)
  processTurn(): boolean {
    if (this.currentMove >= this.moveLimit) {
      return false;
    }

    // Increment move counter
    this.currentMove++;

    // Sort kaijus by power to handle combat correctly (lowest power first)
    const sortedKaijus = Array.from(this.kaijus.values())
      .filter(kaiju => kaiju.isKaijuAlive() && !kaiju.hasReachedBed())
      .sort((a, b) => a.getPower() - b.getPower());

    for (const kaiju of sortedKaijus) {
      if (!kaiju.isKaijuAlive() || kaiju.hasReachedBed()) continue;

      // Get new position based on kaiju direction
      const newPosition = kaiju.move();

      // Check if new position is valid
      if (!this.isValidPosition(newPosition)) {
        continue;
      }

      // Check for entities at new position
      const entityAtNewPosition = this.getEntityAt(newPosition);

      if (entityAtNewPosition) {
        switch (entityAtNewPosition.getType()) {
          case CellType.KAIJU:
            // Combat between kaijus
            const opponent = entityAtNewPosition as Kaiju;
            if (kaiju.combat(opponent)) {
              // Kaiju won, move to new position
              this.removeEntity(opponent);
              this.moveEntity(kaiju, newPosition);
            }
            break;

          case CellType.BUILDING:
            // Break building - ONE FLOOR AT A TIME
            const building = entityAtNewPosition as Building;
            
            // Check for commands on the building first
            let value = 0;
            
            // Get the top floor index (0-indexed)
            const currentFloor = building.getIntactFloors() - 1;
            
            console.log(`Building at (${newPosition.row}, ${newPosition.col}), intact floors: ${building.getIntactFloors()}, current top floor: ${currentFloor}`);
            
            // Check if there's a command on the top floor
            if (currentFloor >= 0) {
              const command = building.getCommand(currentFloor);
              
              console.log(`Command on top floor: ${command ? command.type : 'none'}`);
              
              // If there's a STOMP command, use it
              if (command && command.type === CommandType.STOMP) {
                console.log('Using STOMP command');
                // Execute STOMP command - breaks both floors
                value = building.stomp();
              } else {
                console.log('Using regular breakFloor');
                // No STOMP, only break one floor
                value = building.breakFloor();
              }
            } else {
              console.log('No floors remaining or invalid floor index');
            }
            
            this.score += value;

            // Special case for power plants - double Kaiju power
            if (building.getBuildingType() === BuildingType.POWER_PLANT) {
              kaiju.doublePower();
            }
            
            // Allow Kaiju to move past after breaking just one floor
            // Only remove the building from the board if it's completely destroyed
            if (building.isDestroyed()) {
              this.removeEntity(building);
            }
            
            // Always move the Kaiju after interacting with a building
            this.moveEntity(kaiju, newPosition);
            break;

          case CellType.OBSTACLE:
            // Handle obstacles
            const obstacle = entityAtNewPosition as Obstacle;
            switch (obstacle.getObstacleType()) {
              case ObstacleType.MUD:
                kaiju.immobilize();
                this.moveEntity(kaiju, newPosition);
                break;

              case ObstacleType.SPIKE_TRAP:
                kaiju.halfPower();
                if (kaiju.isKaijuAlive()) {
                  this.moveEntity(kaiju, newPosition);
                } else {
                  this.removeEntity(kaiju);
                }
                break;

              case ObstacleType.BOULDER:
                kaiju.reverseDirection();
                break;
            }
            break;

          case CellType.BED:
            // Check if kaiju reached its bed
            const bed = entityAtNewPosition as Bed;
            if (bed.isForKaiju(kaiju.getKaijuType())) {
              // Apply bonus based on arrival order
              const arrivedKaijuCount = Array.from(this.kaijus.values())
                .filter(k => k.hasReachedBed()).length;

              switch (arrivedKaijuCount) {
                case 0:
                  kaiju.addPower(2000); // First +2000
                  break;
                case 1:
                  kaiju.addPower(kaiju.getPower() * 2); // Second x3
                  break;
                case 2:
                  kaiju.addPower(kaiju.getPower() * 4); // Third x5
                  break;
              }

              // Mark kaiju as reached bed
              kaiju.markReachedBed();
              this.score += kaiju.getPower();
              
              // Actually move the kaiju to the bed position visually
              this.moveEntity(kaiju, newPosition);
            }
            break;
        }
      } else {
        // Empty cell, just move
        this.moveEntity(kaiju, newPosition);
      }
    }

    return true;
  }

  // Check if game is over
  isGameOver(): boolean {
    return this.currentMove >= this.moveLimit || 
      (Array.from(this.kaijus.values()).every(kaiju => 
        !kaiju.isKaijuAlive() || kaiju.hasReachedBed()
      ));
  }

  // Get current score
  getScore(): number {
    return this.score;
  }

  // Get current move
  getCurrentMove(): number {
    return this.currentMove;
  }

  // Get move limit
  getMoveLimit(): number {
    return this.moveLimit;
  }

  // Get remaining budget
  getBudget(): number {
    return this.budget;
  }

  // Spend budget
  spendBudget(amount: number): boolean {
    if (amount > this.budget) {
      return false;
    }
    
    this.budget -= amount;
    return true;
  }

  // Get all kaijus
  getKaijus(): Kaiju[] {
    return Array.from(this.kaijus.values());
  }

  // Get all buildings
  getBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  // Get all obstacles
  getObstacles(): Obstacle[] {
    return Array.from(this.obstacles.values());
  }

  // Get all beds
  getBeds(): Bed[] {
    return Array.from(this.beds.values());
  }

  // Get grid
  getGrid(): (Entity | null)[][] {
    return this.grid;
  }

  // Get rows
  getRows(): number {
    return this.rows;
  }

  // Get columns
  getCols(): number {
    return this.cols;
  }
}

export default GameBoard; 