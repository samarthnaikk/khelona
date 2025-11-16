
import React, { useState } from 'react';
import './App.css';

function App() {
  const [step, setStep] = useState('menu'); // menu, create, join, game
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
    const s = window.io('http://localhost:5000');
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

  const handleCreate = async () => {
    if (!player) return setMessage('Enter your name');
    const res = await fetch('/create_game', { method: 'POST' });
    const data = await res.json();
    setCode(data.code);
    connectSocket(data.code, player);
    setStep('waiting');
  };

  const handleJoin = () => {
    if (!player || !inputCode) return setMessage('Enter name and code');
    setCode(inputCode);
    connectSocket(inputCode, player);
    setStep('waiting');
  };

  const handleMove = idx => {
    if (board[idx] || turn !== myIndex) return;
    socket.emit('make_move', { code, index: idx, player });
  };

  return (
    <div className="App">
      <h1>Khelona: Tic Tac Toe</h1>
      {step === 'menu' && (
        <div>
          <input placeholder="Your name" value={player} onChange={e => setPlayer(e.target.value)} />
          <button onClick={handleCreate}>Create Game</button>
          <input placeholder="Game code" value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} />
          <button onClick={handleJoin}>Join Game</button>
          {message && <div style={{color:'red'}}>{message}</div>}
        </div>
      )}
      {step === 'waiting' && (
        <div>
          <div>Game code: <b>{code}</b></div>
          <div>Share this code with your friend!</div>
          <div>Players: {players.join(', ')}</div>
          <div>Waiting for another player...</div>
        </div>
      )}
      {step === 'game' && (
        <div>
          <div>Game code: <b>{code}</b></div>
          <div>Players: {players.join(' vs ')}</div>
          <div>Your symbol: <b>{myIndex === 0 ? 'X' : 'O'}</b></div>
          <div>Turn: {players[turn] || ''}</div>
          <div className="board">
            {board.map((cell, idx) => (
              <button key={idx} className="cell" onClick={() => handleMove(idx)}>{cell}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
