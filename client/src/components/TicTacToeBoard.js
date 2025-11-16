import React from 'react';

const TicTacToeBoard = ({ board, onMove, turn, myIndex, gameOver, winningLine }) => {
  const handleMove = (idx) => {
    if (board[idx] || turn !== myIndex || gameOver) return;
    onMove(idx);
  };

  return (
    <div className="board">
      {board.map((cell, idx) => (
        <button 
          key={idx} 
          className={`cell ${cell ? 'filled' : ''} ${turn === myIndex && !cell && !gameOver ? 'clickable' : ''} ${winningLine.includes(idx) ? 'winning-cell' : ''} ${cell === 'X' ? 'x-cell' : cell === 'O' ? 'o-cell' : ''}`} 
          onClick={() => handleMove(idx)}
          disabled={!!cell || turn !== myIndex || gameOver}
        >
          {cell}
        </button>
      ))}
    </div>
  );
};

export default TicTacToeBoard;