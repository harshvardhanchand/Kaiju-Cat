import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Header from './components/Header';
import Instructions from './components/Instructions';

const App: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="app">
      <Header onInstructionsClick={() => setShowInstructions(true)} />
      <main>
        <GameBoard />
      </main>
      {showInstructions && (
        <Instructions onClose={() => setShowInstructions(false)} />
      )}
    </div>
  );
};

export default App; 