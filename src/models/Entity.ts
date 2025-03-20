import { CellType, Position } from './types';

abstract class Entity {
  position: Position;
  type: CellType;
  id: string;

  constructor(position: Position, type: CellType) {
    this.position = position;
    this.type = type;
    this.id = `${type}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get position
  getPosition(): Position {
    return { ...this.position };
  }

  // Set position
  setPosition(position: Position): void {
    this.position = { ...position };
  }

  // Get entity type
  getType(): CellType {
    return this.type;
  }

  // Get entity ID
  getId(): string {
    return this.id;
  }
}

export default Entity; 