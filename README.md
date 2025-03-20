# Infinite Kaiju

A browser-based procedural strategy game where players guide Kaiju creatures by placing commands on the game board.

## Overview

Infinite Kaiju is a lightweight, browser-based puzzle strategy game, delivering endlessly replayable experiences through procedurally generated maps. Players strategically guide Kaiju creatures by placing commands on the game board to change their direction, aiming to enhance critical thinking, adaptability, and sustained engagement.

## Game Mechanics

### Kaiju Types
- **Blue Kaiju**: 3000 initial power
- **Green Kaiju**: 2000 initial power
- **Red Kaiju**: 1000 initial power

### Commands
- **Directional Commands** ($10 each): Turn North, South, East, or West
- **Stomp** ($20): Costs 2 moves, breaks two floors of a building simultaneously
- **Power Up** ($30): Adds 1000 power to the respective Kaiju

### Buildings
- **High-Value Buildings**: Two floors (500 power/floor)
- **Low-Value Buildings**: Two floors (250 power/floor)
- **Power Plants**: Double current Kaiju power

### Obstacles
- **Mud**: Temporarily immobilizes Kaiju for one turn
- **Spike Traps**: Reduce Kaiju power by 50% upon contact
- **Boulders**: Cause Kaiju to rebound in the opposite direction

### Cat Beds
Each Kaiju must reach their respective bed in the right-most column.
- First cat: +2000 power
- Second cat: Power x3
- Third cat: Power x5

### Combat
When two Kaiju collide, higher-powered Kaiju wins; ties decided by bed hierarchy (top > middle > bottom). Loser dies (power becomes 0).

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository:
```
git clone https://github.com/yourusername/infinite-kaiju.git
cd infinite-kaiju
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Technologies Used
- TypeScript
- React
- CSS3

## License
This project is licensed under the ISC License
