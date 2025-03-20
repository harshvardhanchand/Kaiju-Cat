import React from 'react';
import './CommandPanel.css';
import { Command, CommandType, Direction } from '../models/types';

interface CommandPanelProps {
  commands: Command[];
  selectedCommand: Command | null;
  onCommandSelect: (command: Command) => void;
  selectedFloor: number;
  onFloorSelect: (floor: number) => void;
  budget: number;
  disabled: boolean;
}

const CommandPanel: React.FC<CommandPanelProps> = ({
  commands,
  selectedCommand,
  onCommandSelect,
  selectedFloor,
  onFloorSelect,
  budget,
  disabled,
}) => {
  // Filter commands by type
  const directionCommands = commands.filter(
    (cmd) => cmd.type === CommandType.DIRECTION
  );
  const specialCommands = commands.filter(
    (cmd) => cmd.type !== CommandType.DIRECTION
  );

  // Check if user can afford a command
  const canAfford = (command: Command) => budget >= command.cost;

  // Render direction icon
  const renderDirectionIcon = (direction?: Direction) => {
    switch (direction) {
      case Direction.NORTH:
        return '↑';
      case Direction.EAST:
        return '→';
      case Direction.SOUTH:
        return '↓';
      case Direction.WEST:
        return '←';
      default:
        return '';
    }
  };

  // Render special command icon
  const renderSpecialIcon = (type: CommandType) => {
    switch (type) {
      case CommandType.STOMP:
        return '👣';
      case CommandType.POWER_UP:
        return '⚡';
      default:
        return '';
    }
  };

  // Get command name
  const getCommandName = (command: Command) => {
    if (command.type === CommandType.DIRECTION && command.direction) {
      return command.direction.charAt(0).toUpperCase() + command.direction.slice(1);
    }
    
    switch (command.type) {
      case CommandType.STOMP:
        return 'Stomp';
      case CommandType.POWER_UP:
        return 'Power Up';
      default:
        return '';
    }
  };

  return (
    <div className={`command-panel ${disabled ? 'disabled' : ''}`}>
      <div className="panel-section">
        <h3>Direction Commands</h3>
        <div className="direction-commands">
          {directionCommands.map((command) => (
            <button
              key={`direction-${command.direction}`}
              className={`command-button direction ${command.direction} ${
                selectedCommand === command ? 'selected' : ''
              } ${!canAfford(command) ? 'disabled' : ''}`}
              onClick={() => canAfford(command) && onCommandSelect(command)}
              disabled={!canAfford(command)}
            >
              <div className="command-icon">{renderDirectionIcon(command.direction)}</div>
              <div className="command-name">{getCommandName(command)}</div>
              <div className="command-cost">${command.cost}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3>Special Commands</h3>
        <div className="special-commands">
          {specialCommands.map((command) => (
            <button
              key={`special-${command.type}`}
              className={`command-button special ${
                selectedCommand === command ? 'selected' : ''
              } ${!canAfford(command) ? 'disabled' : ''}`}
              onClick={() => canAfford(command) && onCommandSelect(command)}
              disabled={!canAfford(command)}
            >
              <div className="command-icon">{renderSpecialIcon(command.type)}</div>
              <div className="command-name">{getCommandName(command)}</div>
              <div className="command-cost">${command.cost}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3>Floor Selection</h3>
        <div className="floor-selection">
          <button
            className={`floor-button ${selectedFloor === 0 ? 'selected' : ''}`}
            onClick={() => onFloorSelect(0)}
          >
            Floor 1
          </button>
          <button
            className={`floor-button ${selectedFloor === 1 ? 'selected' : ''}`}
            onClick={() => onFloorSelect(1)}
          >
            Floor 2
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="selection-info">
          {selectedCommand ? (
            <>
              <div className="selected-command">
                <span>Selected: {getCommandName(selectedCommand)}</span>
                <span className="selected-cost">${selectedCommand.cost}</span>
              </div>
              <div className="floor-info">
                Target: Floor {selectedFloor + 1}
              </div>
            </>
          ) : (
            <div className="no-selection">No command selected</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPanel;
