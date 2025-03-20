import { BuildingType, KaijuType, ObstacleType } from '../models/types';

export interface MapData {
  buildings: {
    position: { row: number; col: number };
    type: BuildingType;
  }[];
  obstacles: {
    position: { row: number; col: number };
    type: ObstacleType;
  }[];
  beds: {
    position: { row: number; col: number };
    kaijuType: KaijuType;
    bedPosition: 'top' | 'middle' | 'bottom';
  }[];
  kaijus: {
    position: { row: number; col: number };
    type: KaijuType;
    direction: string;
  }[];
}

class MapGenerator {
  private rows: number;
  private cols: number;

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
  }

  // Generate a procedural map
  generateMap(): MapData {
    // Create empty map data
    const mapData: MapData = {
      buildings: [],
      obstacles: [],
      beds: [],
      kaijus: [],
    };

    // Create Kaijus at the left-most column
    mapData.kaijus.push({
      position: { row: 0, col: 0 },
      type: KaijuType.BLUE,
      direction: 'east',
    });

    mapData.kaijus.push({
      position: { row: Math.floor(this.rows / 2), col: 0 },
      type: KaijuType.GREEN,
      direction: 'east',
    });

    mapData.kaijus.push({
      position: { row: this.rows - 1, col: 0 },
      type: KaijuType.RED,
      direction: 'east',
    });

    // Create beds at the right-most column
    mapData.beds.push({
      position: { row: 0, col: this.cols - 1 },
      kaijuType: KaijuType.BLUE,
      bedPosition: 'top',
    });

    mapData.beds.push({
      position: { row: Math.floor(this.rows / 2), col: this.cols - 1 },
      kaijuType: KaijuType.GREEN,
      bedPosition: 'middle',
    });

    mapData.beds.push({
      position: { row: this.rows - 1, col: this.cols - 1 },
      kaijuType: KaijuType.RED,
      bedPosition: 'bottom',
    });

    // Generate obstacles first (fewer of these)
    this.generateObstacles(mapData);

    // Generate buildings to fill remaining spaces
    this.fillRemainingSpacesWithBuildings(mapData);

    return mapData;
  }

  // Fill all remaining empty spaces with buildings
  private fillRemainingSpacesWithBuildings(mapData: MapData): void {
    // First, create a grid to track which positions are already filled
    const occupiedPositions: boolean[][] = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(false));
    
    // Mark positions of existing entities as occupied
    this.markOccupiedPositions(mapData, occupiedPositions);
    
    // Fill in remaining positions with buildings
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!occupiedPositions[row][col]) {
          // Randomly choose a building type
          const buildingTypes = [
            BuildingType.HIGH_VALUE, 
            BuildingType.LOW_VALUE,
            BuildingType.POWER_PLANT
          ];
          const randomIndex = Math.floor(Math.random() * buildingTypes.length);
          // Add a building here
          mapData.buildings.push({
            position: { row, col },
            type: buildingTypes[randomIndex]
          });
          
          occupiedPositions[row][col] = true;
        }
      }
    }
  }

  // Mark positions that already have entities
  private markOccupiedPositions(mapData: MapData, occupiedPositions: boolean[][]): void {
    // Mark kaiju positions
    for (const kaiju of mapData.kaijus) {
      const { row, col } = kaiju.position;
      if (this.isValidPosition(row, col)) {
        occupiedPositions[row][col] = true;
      }
    }
    
    // Mark bed positions
    for (const bed of mapData.beds) {
      const { row, col } = bed.position;
      if (this.isValidPosition(row, col)) {
        occupiedPositions[row][col] = true;
      }
    }
    
    // Mark obstacle positions
    for (const obstacle of mapData.obstacles) {
      const { row, col } = obstacle.position;
      if (this.isValidPosition(row, col)) {
        occupiedPositions[row][col] = true;
      }
    }
    
    // Mark building positions
    for (const building of mapData.buildings) {
      const { row, col } = building.position;
      if (this.isValidPosition(row, col)) {
        occupiedPositions[row][col] = true;
      }
    }
  }

  // Helper to check valid position
  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  // Generate obstacles
  private generateObstacles(mapData: MapData): void {
    // Use a fixed pattern for obstacles to ensure good distribution
    const obstacleTypes = [
      ObstacleType.MUD,
      ObstacleType.SPIKE_TRAP,
      ObstacleType.BOULDER
    ];
    
    // Place obstacles in middle areas, avoiding first and last columns
    const centerCol = Math.floor(this.cols / 2);
    
    // Try to place a reasonable number of obstacles (more for larger boards)
    const numObstacles = Math.min(3, Math.floor((this.rows * this.cols) / 10));
    
    for (let i = 0; i < numObstacles; i++) {
      // Choose positions that avoid kaijus and beds
      const row = (i % this.rows);
      const col = centerCol;
      
      // Check if position is already occupied
      if (!this.isPositionOccupied(mapData, row, col)) {
        mapData.obstacles.push({
          position: { row, col },
          type: obstacleTypes[i % obstacleTypes.length]
        });
      }
    }
  }

  // Check if a position is already occupied
  private isPositionOccupied(mapData: MapData, row: number, col: number): boolean {
    // Check kaijus
    for (const kaiju of mapData.kaijus) {
      if (kaiju.position.row === row && kaiju.position.col === col) {
        return true;
      }
    }

    // Check beds
    for (const bed of mapData.beds) {
      if (bed.position.row === row && bed.position.col === col) {
        return true;
      }
    }

    // Check obstacles
    for (const obstacle of mapData.obstacles) {
      if (obstacle.position.row === row && obstacle.position.col === col) {
        return true;
      }
    }

    // Check buildings
    for (const building of mapData.buildings) {
      if (building.position.row === row && building.position.col === col) {
        return true;
      }
    }

    return false;
  }
}

export default MapGenerator; 