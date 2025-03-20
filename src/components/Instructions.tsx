import React from 'react';
import './Instructions.css';

interface InstructionsProps {
  onClose: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ onClose }) => {
  return (
    <div className="instructions-overlay">
      <div className="instructions-modal">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Infinite Kaiju: Game Instructions</h2>
        
        <section className="instruction-section">
          <h3>Objective</h3>
          <p>Guide your Kaiju creatures to their respective cat beds within 15 moves. The more Kaiju reach their beds, the higher your score!</p>
        </section>
        
        <section className="instruction-section">
          <h3>Kaiju Types</h3>
          <ul>
            <li><strong>Blue Kaiju:</strong> 3000 initial power</li>
            <li><strong>Green Kaiju:</strong> 2000 initial power</li>
            <li><strong>Red Kaiju:</strong> 1000 initial power</li>
          </ul>
          <p>Kaiju automatically move forward each turn based on their facing direction.</p>
        </section>
        
        <section className="instruction-section">
          <h3>Commands</h3>
          <p>You have a budget of $110 to place commands on building floors:</p>
          <ul>
            <li><strong>Directional Commands ($10 each):</strong> Turn North, South, East, or West</li>
            <li><strong>Stomp ($20):</strong> Costs 2 moves, breaks two floors of a building simultaneously</li>
            <li><strong>Power Up ($30):</strong> Adds 1000 power to the respective Kaiju</li>
          </ul>
        </section>
        
        <section className="instruction-section">
          <h3>Buildings</h3>
          <ul>
            <li><strong>High-Value Buildings:</strong> Two floors (500 power/floor)</li>
            <li><strong>Low-Value Buildings:</strong> Two floors (250 power/floor)</li>
            <li><strong>Power Plants:</strong> Double current Kaiju power</li>
          </ul>
        </section>
        
        <section className="instruction-section">
          <h3>Obstacles</h3>
          <ul>
            <li><strong>Mud:</strong> Temporarily immobilizes Kaiju for one turn</li>
            <li><strong>Spike Traps:</strong> Reduce Kaiju power by 50% upon contact</li>
            <li><strong>Boulders:</strong> Cause Kaiju to rebound in the opposite direction</li>
          </ul>
        </section>
        
        <section className="instruction-section">
          <h3>Cat Beds</h3>
          <p>Each Kaiju must reach their respective bed in the right-most column.</p>
          <p><strong>Bonuses:</strong></p>
          <ul>
            <li>First cat: +2000 power</li>
            <li>Second cat: Power x3</li>
            <li>Third cat: Power x5</li>
          </ul>
          <p>Simultaneous arrivals prioritized by lower power score.</p>
        </section>
        
        <section className="instruction-section">
          <h3>Combat</h3>
          <p>When two Kaiju collide, higher-powered Kaiju wins; ties decided by bed hierarchy (top {`>`} middle {`>`} bottom). Loser dies (power becomes 0).</p>
        </section>
        
        <button className="start-button" onClick={onClose}>
          Got it! Let's Play
        </button>
      </div>
    </div>
  );
};

export default Instructions; 