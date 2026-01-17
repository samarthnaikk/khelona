# Technical Documentation - Khelona

## Table of Contents
1. [Application Overview](#application-overview)
2. [Entry Point](#entry-point)
3. [Application Architecture](#application-architecture)
4. [Backend API Endpoints](#backend-api-endpoints)
5. [React Components](#react-components)
6. [Main Application Functions](#main-application-functions)
7. [Application Flow](#application-flow)

---

## Application Overview

Khelona is a real-time 2-player Tic Tac Toe web game built with React. The application enables players to create or join games using unique 6-character codes and play in real-time. The frontend is built with React and communicates with a backend API hosted on Vercel.

**Technology Stack:**
- Frontend: React 19.2.0
- Communication: REST API with polling (HTTP) or Socket.IO (WebSocket)
- Styling: CSS
- Build Tool: Create React App (react-scripts 5.0.1)
- Deployment: Vercel

---

## Entry Point

### index.js
**Location:** `/client/src/index.js`

**Purpose:** Application entry point that renders the React app into the DOM.

**Key Operations:**
- Creates React root using `ReactDOM.createRoot()`
- Renders the `<App />` component inside `<React.StrictMode>`
- Initializes web vitals reporting via `reportWebVitals()`

**Dependencies:**
- `react`, `react-dom`
- `./App` (main application component)
- `./reportWebVitals` (performance monitoring)

---

## Application Architecture

### High-Level Flow
1. User lands on home screen and selects "Tic Tac Toe"
2. User enters their name and either creates a new game or joins existing game with code
3. Game creator waits for second player to join using the generated code
4. Once two players join, game starts automatically
5. Players take turns making moves
6. Game ends when there's a winner or tie
7. Players can play again (returns to home screen)

### State Management
The application uses React hooks for state management:
- `useState` for local component state
- `useEffect` for side effects (polling, intervals)
- `useCallback` for memoized callback functions

### Communication Methods
The application has two implementations:
1. **App.js** - REST API with adaptive polling (currently active)
2. **App_socketio.js** - WebSocket-based real-time communication (alternative implementation)

---

## Backend API Endpoints

All endpoints are hosted at: `https://khelona-backend.vercel.app`

### POST /create_game
**Purpose:** Creates a new game instance and returns a unique game code.

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body: None

**Response:**
```json
{
  "code": "ABC123"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

---

### POST /join_game
**Purpose:** Allows a player to join an existing game using a game code.

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "code": "ABC123",
  "player": "PlayerName"
}
```

**Response:**
```json
{
  "player_index": 0
}
```
- `player_index`: Player's position (0 or 1) in the game

**Error Response:**
```json
{
  "error": "Game not found" | "Game is full" | "Player name already taken"
}
```

---

### GET /game_state/:code
**Purpose:** Retrieves the current state of a game (used for polling).

**Request:**
- Method: `GET`
- URL Parameter: `code` (6-character game code)

**Response:**
```json
{
  "state": {
    "players": ["Player1", "Player2"],
    "board": ["X", "", "O", "", "", "", "", "", ""],
    "turn": 1,
    "game_over": false,
    "winner": null,
    "winning_line": []
  }
}
```

**State Fields:**
- `players`: Array of player names (max 2)
- `board`: Array of 9 strings representing board cells ("X", "O", or "")
- `turn`: Index of current player (0 or 1)
- `game_over`: Boolean indicating if game has ended
- `winner`: "X", "O", "tie", or null
- `winning_line`: Array of winning cell indices (e.g., [0, 1, 2])

---

### POST /make_move
**Purpose:** Records a player's move in the game.

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "code": "ABC123",
  "index": 4,
  "player": "PlayerName"
}
```
- `index`: Board position (0-8) where move is made

**Response:**
- Success: HTTP 200
- Failure: HTTP error status

**Side Effects:**
- Updates game board state
- Switches turn to other player
- Checks for win/tie conditions
- Updates `game_over`, `winner`, and `winning_line` if game ends

---

### POST /send_message
**Purpose:** Sends a chat message in the game (currently disabled in UI).

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "code": "ABC123",
  "player": "PlayerName",
  "message": "Hello!"
}
```

**Constraints:**
- Message max length: 50 characters

---

### GET /get_messages/:code
**Purpose:** Retrieves chat messages for a game (currently disabled in UI).

**Request:**
- Method: `GET`
- URL Parameter: `code` (6-character game code)

**Response:**
```json
{
  "messages": [
    {
      "player": "Player1",
      "message": "Good game!"
    }
  ]
}
```

---

## React Components

### App Component
**Location:** `/client/src/App.js`

**Purpose:** Main application component managing game flow and state.

**State Variables:**
- `step`: Current application screen ('home', 'enterName', 'waiting', 'game')
- `selectedGame`: Selected game type ('tic-tac-toe')
- `code`: Current game code (6 characters)
- `player`: Current player's name
- `inputCode`: Joined game code input
- `players`: Array of player names in current game
- `board`: Array of 9 cells representing game board
- `turn`: Current turn (0 or 1)
- `myIndex`: Current player's index (0 or 1)
- `message`: Error/info message to display
- `gameOver`: Boolean indicating game end
- `winner`: Winner indicator ("X", "O", "tie", or null)
- `winningLine`: Array of winning cell indices
- `codeDigits`: Array of 6 code input digits
- `showCopyNotification`: Boolean for copy notification
- `lastGameStateHash`: Hash of last game state for change detection
- `pollInterval`: Current polling interval in milliseconds
- `consecutiveNoChanges`: Counter for unchanged poll responses

**Props:** None (root component)

**Rendered Screens:**
1. Home Screen - Game selection
2. Enter Name Screen - Name input and game creation/joining
3. Waiting Screen - Waiting for second player
4. Game Screen - Active gameplay

---

### TicTacToeBoard Component
**Location:** `/client/src/components/TicTacToeBoard.js`

**Purpose:** Renders the 3x3 Tic Tac Toe game board.

**Props:**
- `board` (Array[9]): Current board state
- `onMove` (Function): Callback when cell is clicked
- `turn` (Number): Current player's turn (0 or 1)
- `myIndex` (Number): Current user's player index
- `gameOver` (Boolean): Whether game has ended
- `winningLine` (Array): Indices of winning cells

**Behavior:**
- Renders 9 clickable cells
- Disables cells that are filled or when it's not player's turn
- Highlights winning cells when game ends
- Applies different styling for X and O cells

**CSS Classes:**
- `board`: Container
- `cell`: Individual cell
- `filled`: Cell with X or O
- `clickable`: Cell that can be clicked
- `winning-cell`: Cell in winning line
- `x-cell`: Cell containing X
- `o-cell`: Cell containing O

---

### GameCard Component
**Location:** `/client/src/components/GameCard.js`

**Purpose:** Displays a selectable game card on the home screen.

**Props:**
- `gameType` (String): Type of game ('tic-tac-toe')
- `onClick` (Function): Callback when card is clicked

**Behavior:**
- Renders game icon, title, and description
- Currently only supports 'tic-tac-toe'
- Returns null if gameType is not recognized

**Game Configuration:**
- 'tic-tac-toe':
  - Icon: Red X and blue O
  - Title: "Tic Tac Toe"
  - Description: "Classic 3x3 grid game"

---

### GameResult Component
**Location:** `/client/src/components/GameResult.js`

**Purpose:** Displays game result and play again option.

**Props:**
- `gameOver` (Boolean): Whether game has ended
- `winner` (String): Winner indicator ("X", "O", "tie", or null)
- `players` (Array): Array of player names
- `onPlayAgain` (Function): Callback to start new game

**Behavior:**
- Returns null if game is not over
- Displays tie message if winner is 'tie'
- Displays winner's name if there's a winner
- Shows "Play Again" button

**Output:**
- Tie: "It's a Tie!"
- Winner: "{PlayerName} Wins!"

---

### Chat Component
**Location:** `/client/src/components/Chat.js`

**Purpose:** Real-time chat interface for players (currently disabled in main app).

**Props:**
- `messages` (Array): Array of chat message objects
- `newMessage` (String): Current message input value
- `onMessageChange` (Function): Callback for input changes
- `onSendMessage` (Function): Callback to send message
- `player` (String): Current player's name

**Message Object Structure:**
```javascript
{
  player: "PlayerName",
  message: "Message text"
}
```

**Behavior:**
- Displays scrollable message list
- Distinguishes own messages from other player's messages
- Limits messages to 50 characters
- Shows character count in placeholder
- Allows sending with Enter key
- Disables send button when input is empty

**CSS Classes:**
- `chat-container`: Main container
- `chat-messages`: Message list
- `chat-message`: Individual message
- `own-message`: Current player's messages
- `other-message`: Other player's messages

---

### CodeInput Component
**Location:** `/client/src/components/CodeInput.js`

**Purpose:** Six-digit code input with auto-focus behavior.

**Props:**
- `codeDigits` (Array[6]): Array of digit values
- `onCodeInput` (Function): Callback for digit input
- `onPaste` (Function): Callback for paste events
- `onKeyDown` (Function): Callback for keydown events

**Behavior:**
- Renders 6 individual input boxes
- Auto-focuses next input on entry
- Handles paste to fill multiple inputs
- Backspace navigates to previous input
- Converts input to uppercase
- Limits each input to 1 character

**Input IDs:** `code-input-0` through `code-input-5`

---

## Main Application Functions

### createGameStateHash(state)
**Location:** App.js line 32

**Purpose:** Creates a hash string of game state for change detection.

**Parameters:**
- `state` (Object): Game state object

**Returns:** JSON string representing game state

**Used For:** Detecting if game state has changed to avoid unnecessary UI updates

---

### pollGameState()
**Location:** App.js line 44

**Purpose:** Polls backend for current game state and updates local state.

**Parameters:** None (uses closure variables)

**Returns:** Promise<void>

**Behavior:**
- Fetches game state from `/game_state/:code`
- Compares with last known state using hash
- Updates state only if changes detected
- Implements adaptive polling with exponential backoff
- Resets to fast polling (1s) when changes occur
- Increases to slow polling (3s) after consecutive no-changes
- Switches from 'waiting' to 'game' when second player joins

**Side Effects:**
- Updates: `players`, `board`, `turn`, `gameOver`, `winner`, `winningLine`
- Updates polling optimization: `lastGameStateHash`, `consecutiveNoChanges`, `pollInterval`

**Error Handling:** Logs errors to console without disrupting app

---

### handleGameSelect(gameName)
**Location:** App.js line 112

**Purpose:** Handles game selection from home screen.

**Parameters:**
- `gameName` (String): Selected game type

**Behavior:**
- Sets `selectedGame` to gameName
- Transitions to 'enterName' screen

---

### handleCreateGame()
**Location:** App.js line 117

**Purpose:** Creates a new game and joins as first player.

**Parameters:** None

**Returns:** Promise<void>

**Validation:**
- Checks if player name is entered
- Checks if name length ≤ 10 characters

**Behavior:**
1. Validates player name
2. Sends POST request to `/create_game`
3. Receives game code
4. Calls `joinGameRequest()` to join the game
5. Transitions to 'waiting' screen

**Error Handling:**
- Displays error message on validation failure
- Displays error message on API failure
- Logs errors to console

---

### joinGameRequest(gameCode, playerName)
**Location:** App.js line 146

**Purpose:** Joins an existing game with given code.

**Parameters:**
- `gameCode` (String): 6-character game code
- `playerName` (String): Player's name

**Returns:** Promise<Boolean> - Success status

**Behavior:**
1. Sends POST request to `/join_game`
2. Receives player index (0 or 1)
3. Sets `myIndex` state
4. Returns success/failure status

**Error Handling:**
- Returns false on failure
- Displays error message
- Logs errors to console

---

### handleJoinGame()
**Location:** App.js line 169

**Purpose:** Handles joining game from enter name screen.

**Parameters:** None

**Returns:** Promise<void>

**Validation:**
- Checks if player name and code are entered
- Checks if name length ≤ 10 characters

**Behavior:**
1. Validates inputs
2. Sets code state
3. Calls `joinGameRequest()`
4. Transitions to 'waiting' screen on success

---

### handleMove(idx)
**Location:** App.js line 179

**Purpose:** Handles player's move on the board.

**Parameters:**
- `idx` (Number): Board cell index (0-8)

**Returns:** Promise<void>

**Validation:**
- Checks if cell is empty
- Checks if it's player's turn
- Checks if game is not over

**Behavior:**
1. Validates move legality
2. Sends POST request to `/make_move`
3. Forces immediate game state poll on success
4. Resets polling optimization counters

**Side Effects:**
- Updates board state via `pollGameState()`
- Resets `pollInterval` to 1000ms
- Resets `consecutiveNoChanges` to 0

---

### copyCode()
**Location:** App.js line 200

**Purpose:** Copies game code to clipboard.

**Parameters:** None

**Behavior:**
- Copies code to clipboard using navigator API
- Shows copy notification for 2 seconds
- Sets `showCopyNotification` to true, then false after 2s

---

### sendMessage()
**Location:** App.js lines 206-237 (commented out)

**Purpose:** Sends chat message (currently disabled).

**Parameters:** None

**Validation:**
- Checks if message is not empty
- Checks if message length ≤ 50 characters

**Behavior:**
1. Validates message
2. Sends POST request to `/send_message`
3. Clears message input
4. Fetches updated messages after 100ms delay

**Note:** Feature is commented out in current implementation

---

### handleCodeInput(index, value)
**Location:** App.js line 239

**Purpose:** Handles input in code digit boxes.

**Parameters:**
- `index` (Number): Input box index (0-5)
- `value` (String): Input value

**Behavior:**
- Limits input to 1 character
- Converts to uppercase
- Updates `codeDigits` array
- Updates `inputCode` string
- Auto-focuses next input if value entered

---

### handlePaste(index, e)
**Location:** App.js line 253

**Purpose:** Handles paste events in code inputs.

**Parameters:**
- `index` (Number): Input box index where paste occurred
- `e` (Event): Paste event

**Behavior:**
- Prevents default paste behavior
- Extracts up to 6 characters from clipboard
- Converts to uppercase
- Fills multiple inputs starting from current index
- Focuses on next empty input or last input

---

### handleKeyDown(index, e)
**Location:** App.js line 270

**Purpose:** Handles keyboard navigation in code inputs.

**Parameters:**
- `index` (Number): Input box index
- `e` (Event): Keydown event

**Behavior:**
- On Backspace: Focuses previous input if current is empty

---

### goBack()
**Location:** App.js line 276

**Purpose:** Resets application to home screen.

**Parameters:** None

**Behavior:**
- Resets all state variables to initial values
- Clears player name, codes, and game state
- Resets polling optimization state
- Transitions to 'home' screen

**State Reset:**
- `step`: 'home'
- `message`, `player`, `inputCode`, `code`: empty strings
- `gameOver`: false
- `winner`, `winningLine`: null/empty
- `lastGameStateHash`: empty
- `pollInterval`: 1000
- `consecutiveNoChanges`: 0

---

## Application Flow

### Game Creation Flow
1. User clicks "Tic Tac Toe" card on home screen
   - Triggers: `handleGameSelect('tic-tac-toe')`
   - State: `step` = 'enterName', `selectedGame` = 'tic-tac-toe'

2. User enters name and clicks "Create Game"
   - Triggers: `handleCreateGame()`
   - Validates name (not empty, ≤10 chars)
   - API Call: POST `/create_game`
   - Receives: Game code (e.g., "ABC123")

3. System automatically joins the created game
   - Calls: `joinGameRequest(code, player)`
   - API Call: POST `/join_game`
   - Receives: `player_index` (0)
   - State: `step` = 'waiting', `myIndex` = 0

4. Waiting screen displays
   - Shows game code
   - Shows player list (1/2)
   - Starts polling game state every 1 second
   - User can copy code to share with friend

5. Second player joins
   - Backend updates game state with 2 players
   - Poll detects change
   - State: `step` = 'game'
   - Game starts automatically

---

### Game Joining Flow
1. User clicks "Tic Tac Toe" card on home screen
   - Triggers: `handleGameSelect('tic-tac-toe')`
   - State: `step` = 'enterName'

2. User enters name and 6-digit code, clicks "Join Game"
   - Triggers: `handleJoinGame()`
   - Validates name and code (not empty, name ≤10 chars)
   - Calls: `joinGameRequest(inputCode, player)`
   - API Call: POST `/join_game`

3. If successful:
   - Receives: `player_index` (1)
   - State: `step` = 'waiting', `myIndex` = 1
   - Starts polling game state

4. If game has 2 players:
   - State: `step` = 'game'
   - Game starts immediately

---

### Gameplay Flow
1. Game screen displays:
   - Board with 9 cells
   - Player names with current turn indicator
   - Game code and player symbol (X or O)
   - "Your turn!" or "{Player}'s turn" message

2. Player makes a move:
   - Clicks empty cell when it's their turn
   - Triggers: `handleMove(idx)`
   - Validates: Cell empty, player's turn, game not over
   - API Call: POST `/make_move`
   - Forces immediate poll to update board

3. Polling continuously checks game state:
   - Detects board changes
   - Updates board display
   - Switches turn indicator
   - Checks for game end

4. Game ends when:
   - Three in a row (horizontal, vertical, diagonal) - Winner determined
   - All cells filled with no winner - Tie

5. Game result displays:
   - Winner's name or "It's a Tie!"
   - "Play Again" button
   - Winning cells highlighted

6. Play again:
   - Triggers: `goBack()`
   - Returns to home screen
   - All state reset

---

### Polling Optimization

The application implements adaptive polling to balance responsiveness and efficiency:

**Fast Polling (1 second):**
- Initial state
- After making a move
- When game state changes detected

**Slow Polling (up to 3 seconds):**
- After 3+ consecutive polls with no changes
- Exponential backoff: interval × 1.5
- Max interval: 3000ms

**Benefits:**
- Reduces unnecessary API calls during idle periods
- Maintains responsiveness during active gameplay
- Improves server load and battery life

---

### Alternative Implementation (App_socketio.js)

The repository includes an alternative implementation using Socket.IO for real-time WebSocket communication instead of REST polling. Key differences:

**Connection:**
- Establishes persistent WebSocket connection
- Uses Socket.IO events instead of HTTP requests

**Events:**
- `join_game`: Join game room
- `player_joined`: Player list updated
- `start_game`: Game begins
- `make_move`: Send move to server
- `update_board`: Receive board update
- `chat_message`: Real-time chat (enabled)

**Advantages:**
- True real-time updates without polling
- Lower latency
- Reduced server load

**Trade-offs:**
- Requires WebSocket support on backend
- More complex connection management
- Current deployment uses REST polling for simplicity

---

## Build and Development

### Development Server
```bash
cd client
npm install
npm start
```
- Starts on `http://localhost:3000`
- Hot reload enabled
- Connects to production backend

### Production Build
```bash
cd client
npm run build
```
- Creates optimized build in `client/build/`
- Ready for deployment

### Testing
```bash
cd client
npm test
```
- Runs React test suite
- Uses Jest and React Testing Library

---

## Environment Configuration

### Backend URL
The backend API URL is hardcoded in the application:
```
https://khelona-backend.vercel.app
```

To change the backend URL, update all fetch calls in `App.js` and socket connection in `App_socketio.js`.

### Ports
- Frontend Development: `3000` (default Create React App)
- Backend: Configured on Vercel

---

## Data Structures

### Game State Object
```javascript
{
  players: ["Player1", "Player2"],  // Array of player names
  board: ["X", "", "O", "", "X", "", "", "", ""],  // 9-cell board
  turn: 0,  // Current player index
  game_over: false,  // Game end flag
  winner: null,  // "X", "O", "tie", or null
  winning_line: [0, 1, 2]  // Winning cell indices
}
```

### Board Cell Indices
```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

### Winning Combinations
Possible `winning_line` arrays:
- Rows: [0,1,2], [3,4,5], [6,7,8]
- Columns: [0,3,6], [1,4,7], [2,5,8]
- Diagonals: [0,4,8], [2,4,6]

---

## Error Handling

### User-Facing Errors
- Empty name: "Enter your name"
- Long name: "Name should not be more than 10 characters"
- Missing inputs: "Enter name and code"
- Game not found: "Game not found"
- Game full: "Game is full"

### API Errors
- Network errors logged to console
- Friendly messages shown to user
- Polling continues despite errors
- Failed moves don't crash app

### Validation Points
- Name input: Max 10 characters
- Code input: Exactly 6 characters (uppercase)
- Move validation: Empty cell, correct turn, game active
- Message input: Max 50 characters (when enabled)
