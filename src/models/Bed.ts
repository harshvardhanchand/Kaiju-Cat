import Entity from './Entity';
import { CellType, KaijuType, Position } from './types';

class Bed extends Entity {
  private kaijuType: KaijuType;
  private bedPosition: 'top' | 'middle' | 'bottom';

  constructor(position: Position, kaijuType: KaijuType, bedPosition: 'top' | 'middle' | 'bottom') {
    super(position, CellType.BED);
    this.kaijuType = kaijuType;
    this.bedPosition = bedPosition;
  }

  // Get kaiju type
  getKaijuType(): KaijuType {
    return this.kaijuType;
  }

  // Get bed position for tiebreaking
  getBedPosition(): 'top' | 'middle' | 'bottom' {
    return this.bedPosition;
  }

  // Check if the bed is for a specific kaiju
  isForKaiju(kaijuType: KaijuType): boolean {
    return this.kaijuType === kaijuType;
  }
}

export default Bed; 