import Entity from './Entity';
import { CellType, Direction, KaijuType, KAIJU_INITIAL_POWER, Position } from './types';

class Kaiju extends Entity {
  private kaijuType: KaijuType;
  private power: number;
  private direction: Direction;
  private isImmobilized: boolean;
  private isAlive: boolean;
  private reachedBed: boolean;

  constructor(position: Position, kaijuType: KaijuType, direction: Direction = Direction.EAST) {
    super(position, CellType.KAIJU);
    this.kaijuType = kaijuType;
    this.power = KAIJU_INITIAL_POWER[kaijuType];
    this.direction = direction;
    this.isImmobilized = false;
    this.isAlive = true;
    this.reachedBed = false;
  }

  // Get kaiju type
  getKaijuType(): KaijuType {
    return this.kaijuType;
  }

  // Get current power
  getPower(): number {
    return this.power;
  }

  // Get current direction
  getDirection(): Direction {
    return this.direction;
  }

  // Set direction
  setDirection(direction: Direction): void {
    this.direction = direction;
  }

  // Add power
  addPower(amount: number): void {
    this.power += amount;
  }

  // Reduce power
  reducePower(amount: number): void {
    this.power = Math.max(0, this.power - amount);
    if (this.power === 0) {
      this.isAlive = false;
    }
  }

  // Double power (for power plants)
  doublePower(): void {
    this.power *= 2;
  }

  // Half power (for spike traps)
  halfPower(): void {
    this.power = Math.floor(this.power / 2);
    if (this.power === 0) {
      this.isAlive = false;
    }
  }

  // Immobilize for one turn (for mud)
  immobilize(): void {
    this.isImmobilized = true;
  }

  // Check if immobilized
  isKaijuImmobilized(): boolean {
    return this.isImmobilized;
  }

  // Reset immobilized status for next turn
  resetImmobilized(): void {
    this.isImmobilized = false;
  }

  // Reverse direction (for boulders)
  reverseDirection(): void {
    switch (this.direction) {
      case Direction.NORTH:
        this.direction = Direction.SOUTH;
        break;
      case Direction.SOUTH:
        this.direction = Direction.NORTH;
        break;
      case Direction.EAST:
        this.direction = Direction.WEST;
        break;
      case Direction.WEST:
        this.direction = Direction.EAST;
        break;
    }
  }

  // Check if kaiju is alive
  isKaijuAlive(): boolean {
    return this.isAlive;
  }

  // Kill kaiju
  kill(): void {
    this.isAlive = false;
    this.power = 0;
  }

  // Mark as reached bed
  markReachedBed(): void {
    this.reachedBed = true;
  }

  // Check if kaiju reached bed
  hasReachedBed(): boolean {
    return this.reachedBed;
  }

  // Move in current direction
  move(): Position {
    const newPosition = { ...this.position };
    
    if (this.isImmobilized) {
      this.resetImmobilized();
      return newPosition;
    }

    switch (this.direction) {
      case Direction.NORTH:
        newPosition.row--;
        break;
      case Direction.SOUTH:
        newPosition.row++;
        break;
      case Direction.EAST:
        newPosition.col++;
        break;
      case Direction.WEST:
        newPosition.col--;
        break;
    }

    return newPosition;
  }

  // Combat with another kaiju
  combat(opponent: Kaiju): boolean {
    if (this.power > opponent.power) {
      opponent.kill();
      return true;
    } else if (this.power < opponent.power) {
      this.kill();
      return false;
    } else {
      // Tie is resolved by bed hierarchy (implementation in game logic)
      return false;
    }
  }
}

export default Kaiju; 