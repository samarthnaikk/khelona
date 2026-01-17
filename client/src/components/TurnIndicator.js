import React from 'react';

const TurnIndicator = ({ turn, myIndex, players, gameOver, throwsLeft }) => {
  if (gameOver) return null;

  return (
    <div className="dart-turn-indicator">
      <div className="turn-text">
        {turn === myIndex ? "Your turn!" : `${players[turn]}'s turn`}
      </div>
      {throwsLeft !== undefined && (
        <div className="throws-left">
          Throws remaining: <strong>{throwsLeft}</strong>
        </div>
      )}
    </div>
  );
};

export default TurnIndicator;
