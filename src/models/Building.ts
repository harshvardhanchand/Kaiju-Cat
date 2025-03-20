import Entity from './Entity';
import { BuildingType, CellType, Command, Position } from './types';

class Building extends Entity {
  private buildingType: BuildingType;
  private floorCommands: [Command | null, Command | null];
  private breakableFloors: number;

  constructor(position: Position, buildingType: BuildingType) {
    super(position, CellType.BUILDING);
    this.buildingType = buildingType;
    this.floorCommands = [null, null]; // Each building has two floors
    this.breakableFloors = 2; // Each building has two breakable floors
  }

  // Get building type
  getBuildingType(): BuildingType {
    return this.buildingType;
  }

  // Get command from a specific floor (0-indexed)
  getCommand(floor: number): Command | null {
    if (floor < 0 || floor > 1) {
      throw new Error('Invalid floor');
    }
    return this.floorCommands[floor];
  }

  // Set command on a specific floor (0-indexed)
  setCommand(floor: number, command: Command): boolean {
    if (floor < 0 || floor > 1 || this.floorCommands[floor] !== null) {
      return false;
    }
    this.floorCommands[floor] = command;
    return true;
  }

  // Get value per floor
  getValuePerFloor(): number {
    switch (this.buildingType) {
      case BuildingType.HIGH_VALUE:
        return 500;
      case BuildingType.LOW_VALUE:
        return 250;
      case BuildingType.POWER_PLANT:
        return 0; // Power plants double Kaiju power instead of giving points
      default:
        return 0;
    }
  }

  // Break a floor (Stomp command)
  breakFloor(): number {
    if (this.breakableFloors <= 0) {
      return 0;
    }

    // ONLY break one floor - the top one
    this.breakableFloors--;
    
    // Clear the command on the floor being broken
    // Get top floor index (0-indexed)
    const floorIndex = this.breakableFloors; 
    this.floorCommands[floorIndex] = null;
    
    console.log(`Break floor: floors remaining ${this.breakableFloors}`);
    
    return this.getValuePerFloor();
  }

  // Stomp (break two floors)
  stomp(): number {
    // This is intentionally separate from breakFloor and should only be used 
    // when the Stomp command is explicitly activated
    console.log('Stomp method called - should break up to 2 floors');
    const value1 = this.breakFloor();
    
    // Only try to break second floor if there's still a floor remaining
    const value2 = this.breakableFloors > 0 ? this.breakFloor() : 0;
    
    return value1 + value2;
  }

  // Check if building is completely destroyed
  isDestroyed(): boolean {
    return this.breakableFloors === 0;
  }

  // Get number of intact floors
  getIntactFloors(): number {
    return this.breakableFloors;
  }
}

export default Building; 