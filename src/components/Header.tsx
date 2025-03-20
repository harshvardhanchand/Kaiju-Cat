import React from 'react';
import './Header.css';

interface HeaderProps {
  onInstructionsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onInstructionsClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="game-title">Infinite Kaiju</h1>
        <div className="header-buttons">
          <button 
            className="instructions-button"
            onClick={onInstructionsClick}
          >
            Instructions
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 