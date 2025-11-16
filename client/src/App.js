import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GameCard from './components/GameCard';
import TicTacToeBoard from './components/TicTacToeBoard';
import GameResult from './components/GameResult';
import Chat from './components/Chat';
import CodeInput from './components/CodeInput';

function App() {
  const [step, setStep] = useState('home'); // home, enterName, waiting, joinGame, game
  const [selectedGame, setSelectedGame] = useState('');
  const [code, setCode] = useState('');
  const [player, setPlayer] = useState('');
  const [inputCode, setInputCode] = useState('');
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
  const [lastGameStateHash, setLastGameStateHash] = useState('');
  const [pollInterval, setPollInterval] = useState(1000);
  const [consecutiveNoChanges, setConsecutiveNoChanges] = useState(0);

  // Helper function to create a hash of game state for comparison
  const createGameStateHash = (state) => {
    return JSON.stringify({
      players: state.players,
      board: state.board,
      turn: state.turn,
      game_over: state.game_over,
      winner: state.winner,
      winning_line: state.winning_line
    });
  };

  // Optimized polling function to check game state
  const pollGameState = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`https://khelona-backend.vercel.app/game_state/${code}`);
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          const state = data.state;
          const currentHash = createGameStateHash(state);
          
          // Only update state and fetch messages if game state actually changed
          if (currentHash !== lastGameStateHash) {
            setPlayers(state.players);
            setBoard(state.board);
            setTurn(state.turn);
            setGameOver(state.game_over);
            setWinner(state.winner);
            setWinningLine(state.winning_line || []);
            setLastGameStateHash(currentHash);
            setConsecutiveNoChanges(0);
            
            // Reset to fast polling when changes occur
            if (pollInterval > 1000) {
              setPollInterval(1000);
            }
            
            if (state.players.length === 2 && step === 'waiting') {
              setStep('game');
            }
            
            // Only fetch messages when game state changes or it's my turn
            if (step === 'game' && (turn === myIndex || state.turn === myIndex)) {
              const messagesRes = await fetch(`https://khelona-backend.vercel.app/get_messages/${code}`);
              if (messagesRes.ok) {
                const messagesData = await messagesRes.json();
                if (messagesData.messages) {
                  setChatMessages(messagesData.messages);
                }
              }
            }
          } else {
            // Implement exponential backoff when no changes occur
            const newConsecutiveNoChanges = consecutiveNoChanges + 1;
            setConsecutiveNoChanges(newConsecutiveNoChanges);
            
            // Gradually increase polling interval up to 3 seconds
            if (newConsecutiveNoChanges > 3 && pollInterval < 3000) {
              setPollInterval(Math.min(pollInterval * 1.5, 3000));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error polling game state:', error);
    }
  }, [code, step, lastGameStateHash, pollInterval, consecutiveNoChanges, turn, myIndex]);

  // Adaptive polling with dynamic intervals
  useEffect(() => {
    let interval;
    if ((step === 'waiting' || step === 'game') && code) {
      interval = setInterval(pollGameState, pollInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, code, pollGameState, pollInterval]);

  const handleGameSelect = (gameName) => {
    setSelectedGame(gameName);
    setStep('enterName');
  };

  const handleCreateGame = async () => {
    if (!player) return setMessage('Enter your name');
    if (player.length > 10) return setMessage('Name should not be more than 10 characters');
    try {
      const res = await fetch('https://khelona-backend.vercel.app/create_game', { 
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
      
      // Join the game
      await joinGameRequest(data.code, player);
      setStep('waiting');
    } catch (error) {
      console.error('Error creating game:', error);
      setMessage('Failed to create game. Make sure the server is running.');
    }
  };

  const joinGameRequest = async (gameCode, playerName) => {
    try {
      const res = await fetch('https://khelona-backend.vercel.app/join_game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: gameCode, player: playerName })
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        return false;
      }
      setMyIndex(data.player_index);
      return true;
    } catch (error) {
      console.error('Error joining game:', error);
      setMessage('Failed to join game.');
      return false;
    }
  };

  const handleJoinGame = async () => {
    if (!player || !inputCode) return setMessage('Enter name and code');
    if (player.length > 10) return setMessage('Name should not be more than 10 characters');
    setCode(inputCode);
    const success = await joinGameRequest(inputCode, player);
    if (success) {
      setStep('waiting');
    }
  };

  const handleMove = async (idx) => {
    if (board[idx] || turn !== myIndex || gameOver) return;
    try {
      const res = await fetch('https://khelona-backend.vercel.app/make_move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, index: idx, player })
      });
      if (res.ok) {
        // Force immediate poll after making a move and reset polling interval
        setPollInterval(1000);
        setConsecutiveNoChanges(0);
        pollGameState();
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  const sendMessage = async () => {
    if (newMessage.trim() && newMessage.length <= 50) {
      try {
        const res = await fetch('https://khelona-backend.vercel.app/send_message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, player, message: newMessage.trim() })
        });
        if (res.ok) {
          setNewMessage('');
          // Force immediate message fetch after sending a message
          setTimeout(async () => {
            try {
              const messagesRes = await fetch(`https://khelona-backend.vercel.app/get_messages/${code}`);
              if (messagesRes.ok) {
                const messagesData = await messagesRes.json();
                if (messagesData.messages) {
                  setChatMessages(messagesData.messages);
                }
              }
            } catch (error) {
              console.error('Error fetching messages after send:', error);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
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

  const goBack = () => {
    setStep('home');
    setMessage('');
    setPlayer('');
    setInputCode('');
    setCode('');
    setGameOver(false);
    setWinner(null);
    setWinningLine([]);
    setChatMessages([]);
    // Reset polling optimization state
    setLastGameStateHash('');
    setPollInterval(1000);
    setConsecutiveNoChanges(0);
  };

  return (
    <div className="App">
      <h1>Khelona - 2 Player Games</h1>
      
      {step === 'home' && (
        <div className="home-screen">
          <h2>Choose a Game</h2>
          <div className="games-grid">
            <GameCard gameType="tic-tac-toe" onClick={handleGameSelect} />
          </div>
        </div>
      )}

      {step === 'enterName' && (
        <div className="enter-name-screen">
          <button className="back-btn" onClick={goBack}>← Back</button>
          <h2>{selectedGame === 'tic-tac-toe' ? 'Tic Tac Toe' : selectedGame}</h2>
          <div className="name-input-section">
            <input 
              placeholder="Enter your name (max 10 chars)" 
              value={player} 
              onChange={e => setPlayer(e.target.value.slice(0, 10))}
              className="name-input"
              maxLength={10}
            />
            <button onClick={handleCreateGame} className="create-btn">Create Game</button>
          </div>
          <div className="divider">OR</div>
          <div className="join-section">
            <CodeInput 
              codeDigits={codeDigits}
              onCodeInput={handleCodeInput}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleJoinGame} className="join-btn">Join Game</button>
          </div>
          {message && <div className="error-message">{message}</div>}
        </div>
      )}

      {step === 'waiting' && (
        <div className="waiting-screen">
          <h2>Tic Tac Toe</h2>
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
                Code copied to clipboard!
              </div>
            )}
            <p>Share this code with your friend to join!</p>
          </div>
          <div className="players-list">
            <h4>Players ({players.length}/2)</h4>
            {players.map((p, i) => (
              <div key={i} className="player-item">
                {p} {p === player ? '(You)' : ''}
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
          <div className="game-main">
            <div className="game-header">
              <h2>Tic Tac Toe</h2>
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
            
            <GameResult 
              gameOver={gameOver}
              winner={winner}
              players={players}
              onPlayAgain={goBack}
            />
            
            <TicTacToeBoard 
              board={board}
              onMove={handleMove}
              turn={turn}
              myIndex={myIndex}
              gameOver={gameOver}
              winningLine={winningLine}
            />
          </div>
          
          <div className="game-side">
            <Chat 
              messages={chatMessages}
              newMessage={newMessage}
              onMessageChange={e => setNewMessage(e.target.value)}
              onSendMessage={sendMessage}
              player={player}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;