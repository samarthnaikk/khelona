
import React, { useState } from 'react';
import './App.css';
import io from 'socket.io-client';

function App() {
  const [step, setStep] = useState('home'); // home, enterName, waiting, joinGame, game
  const [selectedGame, setSelectedGame] = useState('');
  const [code, setCode] = useState('');
  const [player, setPlayer] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState(Array(9).fill(''));
  const [turn, setTurn] = useState(0);
  const [myIndex, setMyIndex] = useState(null);
  const [message, setMessage] = useState('');

  // Connect to backend
  const connectSocket = (gameCode, playerName) => {
    const s = io('http://localhost:5001');
    setSocket(s);
    s.emit('join_game', { code: gameCode, player: playerName });
    s.on('join_error', data => setMessage(data.error));
    s.on('player_joined', data => {
      setPlayers(data.players);
      setMyIndex(data.players.indexOf(playerName));
    });
    s.on('start_game', data => {
      setBoard(data.board);
      setTurn(data.turn);
      setStep('game');
      setMessage('');
    });
    s.on('update_board', data => {
      setBoard([...data.board]);
      setTurn(data.turn);
    });
    return s;
  };

  const handleGameSelect = (gameName) => {
    setSelectedGame(gameName);
    setStep('enterName');
  };

  const handleCreateGame = async () => {
    if (!player) return setMessage('Enter your name');
    try {
      const res = await fetch('http://localhost:5001/create_game', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        return;
      }
      setCode(data.code);
      connectSocket(data.code, player);
      setStep('waiting');
    } catch (error) {
      console.error('Error creating game:', error);
      setMessage('Failed to create game. Make sure the server is running.');
    }
  };

  const handleJoinGame = () => {
    if (!player || !inputCode) return setMessage('Enter name and code');
    setCode(inputCode);
    connectSocket(inputCode, player);
    setStep('waiting');
  };

  const goBack = () => {
    setStep('home');
    setMessage('');
    setPlayer('');
    setInputCode('');
  };

  const handleMove = idx => {
    if (board[idx] || turn !== myIndex) return;
    socket.emit('make_move', { code, index: idx, player });
  };

  return (
    <div className="App">
      <h1>🎮 Khelona - 2 Player Games</h1>
      
      {step === 'home' && (
        <div className="home-screen">
          <h2>Choose a Game</h2>
          <div className="games-grid">
            <div className="game-card" onClick={() => handleGameSelect('tic-tac-toe')}>
              <div className="game-icon">⭕</div>
              <h3>Tic Tac Toe</h3>
              <p>Classic 3x3 grid game</p>
            </div>
            {/* More games can be added here */}
          </div>
        </div>
      )}

      {step === 'enterName' && (
        <div className="enter-name-screen">
          <button className="back-btn" onClick={goBack}>← Back</button>
          <h2>{selectedGame === 'tic-tac-toe' ? '⭕ Tic Tac Toe' : selectedGame}</h2>
          <div className="name-input-section">
            <input 
              placeholder="Enter your name" 
              value={player} 
              onChange={e => setPlayer(e.target.value)}
              className="name-input"
            />
            <button onClick={handleCreateGame} className="create-btn">Create Game</button>
          </div>
          <div className="divider">OR</div>
          <div className="join-section">
            <input 
              placeholder="Enter game code" 
              value={inputCode} 
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              className="code-input"
            />
            <button onClick={handleJoinGame} className="join-btn">Join Game</button>
          </div>
          {message && <div className="error-message">{message}</div>}
        </div>
      )}

      {step === 'waiting' && (
        <div className="waiting-screen">
          <h2>⭕ Tic Tac Toe</h2>
          <div className="game-code-display">
            <h3>Game Code</h3>
            <div className="code">{code}</div>
            <p>Share this code with your friend to join!</p>
          </div>
          <div className="players-list">
            <h4>Players ({players.length}/2)</h4>
            {players.map((p, i) => (
              <div key={i} className="player-item">
                {p} {i === 0 ? '(You)' : ''}
              </div>
            ))}
          </div>
          <div className="waiting-indicator">
            <div className="spinner"></div>
            <p>Waiting for another player...</p>
          </div>
        </div>
      )}

      {step === 'game' && (
        <div className="game-screen">
          <div className="game-header">
            <h2>⭕ Tic Tac Toe</h2>
            <div className="game-info">
              <span>Code: <strong>{code}</strong></span>
              <span>You are: <strong>{myIndex === 0 ? 'X' : 'O'}</strong></span>
            </div>
          </div>
          <div className="players-display">
            <div className={`player ${turn === 0 ? 'active' : ''}`}>
              {players[0]} (X)
            </div>
            <div className="vs">VS</div>
            <div className={`player ${turn === 1 ? 'active' : ''}`}>
              {players[1]} (O)
            </div>
          </div>
          <div className="current-turn">
            {turn === myIndex ? "Your turn!" : `${players[turn]}'s turn`}
          </div>
          <div className="board">
            {board.map((cell, idx) => (
              <button 
                key={idx} 
                className={`cell ${cell ? 'filled' : ''} ${turn === myIndex && !cell ? 'clickable' : ''}`} 
                onClick={() => handleMove(idx)}
                disabled={!!cell || turn !== myIndex}
              >
                {cell}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
