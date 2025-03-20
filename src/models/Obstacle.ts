import Entity from './Entity';
import { CellType, ObstacleType, Position } from './types';

class Obstacle extends Entity {
  private obstacleType: ObstacleType;

  constructor(position: Position, obstacleType: ObstacleType) {
    super(position, CellType.OBSTACLE);
    this.obstacleType = obstacleType;
  }

  // Get obstacle type
  getObstacleType(): ObstacleType {
    return this.obstacleType;
  }
}

export default Obstacle; 