import React from 'react';

const DartBoard = ({ onThrow, turn, myIndex, gameOver }) => {
  const handleThrow = () => {
    if (turn !== myIndex || gameOver) return;
    onThrow();
  };

  return (
    <div className="dartboard-container">
      <div className="dartboard">
        <div className="dartboard-ring bullseye">
          <span className="ring-label">50</span>
        </div>
        <div className="dartboard-ring inner-bull">
          <span className="ring-label">25</span>
        </div>
        <div className="dartboard-ring triple">
          <span className="ring-label">Triple</span>
        </div>
        <div className="dartboard-ring outer">
          <span className="ring-label">Single</span>
        </div>
        <div className="dartboard-ring double">
          <span className="ring-label">Double</span>
        </div>
      </div>
      <button 
        className={`throw-dart-btn ${turn === myIndex && !gameOver ? 'active' : ''}`}
        onClick={handleThrow}
        disabled={turn !== myIndex || gameOver}
      >
        {turn === myIndex && !gameOver ? 'Throw Dart 🎯' : 'Wait for your turn'}
      </button>
    </div>
  );
};

export default DartBoard;
