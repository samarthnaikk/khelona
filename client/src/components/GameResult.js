import React from 'react';

const GameResult = ({ gameOver, winner, players, onPlayAgain }) => {
  if (!gameOver) return null;

  return (
    <div className="game-result">
      {winner === 'tie' ? (
        <div className="tie-message">It's a Tie!</div>
      ) : (
        <div className="winner-message">
          {winner === 'X' ? players[0] : players[1]} Wins!
        </div>
      )}
      <button className="play-again-btn" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
};

export default GameResult;