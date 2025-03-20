// Direction types
export enum Direction {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
}

// Command types
export enum CommandType {
  DIRECTION = 'direction',
  STOMP = 'stomp',
  POWER_UP = 'power_up',
}

export interface Command {
  type: CommandType;
  cost: number;
  direction?: Direction;
}

// Game entity types
export enum KaijuType {
  BLUE = 'blue',
  GREEN = 'green',
  RED = 'red',
}

export enum ObstacleType {
  MUD = 'mud',
  SPIKE_TRAP = 'spike_trap',
  BOULDER = 'boulder',
}

export enum BuildingType {
  HIGH_VALUE = 'high_value',
  LOW_VALUE = 'low_value',
  POWER_PLANT = 'power_plant',
}

export enum CellType {
  EMPTY = 'empty',
  KAIJU = 'kaiju',
  BUILDING = 'building',
  OBSTACLE = 'obstacle',
  BED = 'bed',
}

// Position interface
export interface Position {
  row: number;
  col: number;
}

// Game board configuration
export interface GameConfig {
  rows: number;
  cols: number;
  moveLimit: number;
  initialBudget: number;
}

// Command prices
export const COMMAND_PRICES = {
  [CommandType.DIRECTION]: 10,
  [CommandType.STOMP]: 20,
  [CommandType.POWER_UP]: 30,
};

// Kaiju initial power
export const KAIJU_INITIAL_POWER = {
  [KaijuType.BLUE]: 3000,
  [KaijuType.GREEN]: 2000,
  [KaijuType.RED]: 1000,
}; 