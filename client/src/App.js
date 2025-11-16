
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
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [showCopyNotification, setShowCopyNotification] = useState(false);

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
      setGameOver(data.game_over || false);
      setWinner(data.winner || null);
      setStep('game');
      setMessage('');
    });
    s.on('update_board', data => {
      setBoard([...data.board]);
      setTurn(data.turn);
      setGameOver(data.game_over || false);
      setWinner(data.winner || null);
      setWinningLine(data.winning_line || []);
    });
    s.on('chat_message', data => {
      setChatMessages(prev => [...prev, data]);
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

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('chat_message', { code, player, message: newMessage });
      setNewMessage('');
    }
  };

  const handleCodeInput = (index, value) => {
    if (value.length <= 1) {
      const newDigits = [...codeDigits];
      newDigits[index] = value.toUpperCase();
      setCodeDigits(newDigits);
      setInputCode(newDigits.join(''));
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`code-input-${index + 1}`)?.focus();
      }
    }
  };

  const handlePaste = (index, e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 6);
    const newDigits = [...codeDigits];
    
    for (let i = 0; i < pastedData.length && (index + i) < 6; i++) {
      newDigits[index + i] = pastedData[i];
    }
    
    setCodeDigits(newDigits);
    setInputCode(newDigits.join(''));
    
    // Focus on the next empty input or the last one
    const nextIndex = Math.min(index + pastedData.length, 5);
    document.getElementById(`code-input-${nextIndex}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`)?.focus();
    }
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
            <div className="otp-inputs">
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  value={digit}
                  onChange={e => handleCodeInput(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={e => handlePaste(index, e)}
                  className="otp-input"
                  maxLength="1"
                />
              ))}
            </div>
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
            <div className="code-container">
              <div className="code">{code}</div>
              <button className="copy-btn" onClick={copyCode}>
                Copy Code
              </button>
            </div>
            {showCopyNotification && (
              <div className="copy-notification">
                ✅ Code copied to clipboard!
              </div>
            )}
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
          {!gameOver && (
            <div className="current-turn">
              {turn === myIndex ? "Your turn!" : `${players[turn]}'s turn`}
            </div>
          )}
          
          {gameOver && (
            <div className="game-result">
              {winner === 'tie' ? (
                <div className="tie-message">🤝 It's a Tie!</div>
              ) : (
                <div className="winner-message">
                  🎉 {winner === 'X' ? players[0] : players[1]} Wins!
                </div>
              )}
              <button className="play-again-btn" onClick={goBack}>
                Play Again
              </button>
            </div>
          )}
          
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
          
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.player === player ? 'own-message' : 'other-message'}`}>
                  <span className="message-sender">{msg.player}:</span>
                  <span className="message-text">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="chat-input"
              />
              <button onClick={sendMessage} className="send-btn">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
