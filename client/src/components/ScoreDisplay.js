import React from 'react';

const ScoreDisplay = ({ players, scores, myIndex, turn }) => {
  return (
    <div className="dart-score-display">
      <div className={`dart-player-score ${turn === 0 ? 'active' : ''}`}>
        <div className="player-name">
          {players[0]} {myIndex === 0 ? '(You)' : ''}
        </div>
        <div className="score">{scores[0] || 0}</div>
      </div>
      <div className="vs-divider">VS</div>
      <div className={`dart-player-score ${turn === 1 ? 'active' : ''}`}>
        <div className="player-name">
          {players[1]} {myIndex === 1 ? '(You)' : ''}
        </div>
        <div className="score">{scores[1] || 0}</div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
