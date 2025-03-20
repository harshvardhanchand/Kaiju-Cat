import React from 'react';
import './GameStatus.css';

interface GameStatusProps {
  score: number;
  currentMove: number;
  moveLimit: number;
  budget: number;
  initialBudget: number;
  gameOver: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({
  score,
  currentMove,
  moveLimit,
  budget,
  initialBudget,
  gameOver,
}) => {
  return (
    <div className="game-status">
      <div className="status-item">
        <span className="status-label">Score:</span>
        <span className="status-value">{score}</span>
      </div>
      
      <div className="status-item">
        <span className="status-label">Moves:</span>
        <span className="status-value">
          {currentMove} / {moveLimit}
        </span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentMove / moveLimit) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="status-item">
        <span className="status-label">Budget:</span>
        <span className="status-value">
          ${budget} / ${initialBudget}
        </span>
        <div className="progress-bar">
          <div
            className="progress-fill budget"
            style={{ width: `${(budget / initialBudget) * 100}%` }}
          />
        </div>
      </div>
      
      {gameOver && (
        <div className="game-over-message">
          {score > 0 ? "Game Over! Well played!" : "Game Over!"}
        </div>
      )}
    </div>
  );
};

export default GameStatus; 