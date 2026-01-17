import React from 'react';

const GameCard = ({ gameType, onClick }) => {
  const gameConfig = {
    'tic-tac-toe': {
      icon: (
        <>
          <span style={{color: '#FF4C4C'}}>X</span>
          <span style={{color: '#4FC3F7'}}>O</span>
        </>
      ),
      title: 'Tic Tac Toe',
      description: 'Classic 3x3 grid game'
    },
    'dart': {
      icon: '🎯',
      title: 'Dart',
      description: 'Hit the target, score points'
    }
  };

  const config = gameConfig[gameType];
  if (!config) return null;

  return (
    <div className="game-card" onClick={() => onClick(gameType)}>
      <div className="game-icon">
        {config.icon}
      </div>
      <h3>{config.title}</h3>
      <p>{config.description}</p>
    </div>
  );
};

export default GameCard;