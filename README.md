# Khelona

A real-time 2-player Tic Tac Toe web game where players can create games, share codes, and play together instantly.

**🎮 Play Now**: [https://khelona.samarthnaikk.me](https://khelona.samarthnaikk.me)

---

## Overview

Khelona is a multiplayer web application that enables two players to play Tic Tac Toe in real-time. Players can create a game room, share a unique 6-character code with a friend, and start playing immediately once both players join.

### Key Features
- **Easy Game Creation**: Generate a game with one click
- **Simple Join Process**: Join games using a 6-character code
- **Real-Time Gameplay**: Moves sync instantly between players
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **No Registration Required**: Jump straight into the action

---

## Architecture

### Technology Stack
- **Frontend**: React 19.2.0 with React Hooks
- **Backend**: Python-based REST API hosted on Vercel
- **Communication**: HTTP polling with adaptive intervals (REST) or WebSocket (Socket.IO alternative)
- **Styling**: Custom CSS
- **Build Tool**: Create React App

### High-Level Structure
```
khelona/
├── client/              # React frontend application
│   ├── src/
│   │   ├── App.js      # Main application logic (REST polling)
│   │   ├── App_socketio.js  # Alternative Socket.IO implementation
│   │   ├── components/ # Reusable React components
│   │   └── index.js    # Application entry point
│   ├── public/         # Static assets
│   └── package.json    # Frontend dependencies
└── vercel.json         # Deployment configuration
```

The application uses a **React-based single-page application (SPA)** architecture where all game logic and UI rendering happen on the client side. The backend provides a REST API for game state management and move validation.

---

## Getting Started

### Prerequisites
- **Node.js** (version 14 or higher)
- **npm** or **yarn** package manager
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/samarthnaikk/khelona.git
   cd khelona
   ```

2. **Navigate to the client directory**
   ```bash
   cd client
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode
Start the development server with hot-reload:
```bash
npm start
```

The application will open at `http://localhost:3000` and automatically connect to the production backend at `https://khelona-backend.vercel.app`.

#### Production Build
Create an optimized production build:
```bash
npm run build
```

The build output will be in the `client/build/` directory, ready for deployment.

#### Testing
Run the test suite:
```bash
npm test
```

---

## Configuration

### Backend URL
The frontend connects to a hosted backend API. The backend URL is configured in:
- `client/src/App.js` (REST implementation)
- `client/src/App_socketio.js` (Socket.IO implementation)

**Default Backend**: `https://khelona-backend.vercel.app`

To use a different backend, update all API endpoint URLs in the respective App file.

### Environment Variables
Currently, no environment variables are required for the frontend. All configuration is hardcoded in the source files.

### Port Configuration
- **Development Server**: Port `3000` (default for Create React App)
- **Production**: Configured by your hosting provider (e.g., Vercel)

---

## How to Play

1. **Choose Tic Tac Toe** on the home screen
2. **Enter your name** (max 10 characters)
3. **Create a new game** or **join an existing game**:
   - **Creating**: Click "Create Game" to generate a 6-character code
   - **Joining**: Enter the code shared by your friend and click "Join Game"
4. **Wait for your opponent** to join (if you created the game)
5. **Play the game**:
   - Players take turns placing X and O
   - First player to get three in a row wins
   - If the board fills with no winner, it's a tie
6. **Play again** by clicking the "Play Again" button

---

## Project Structure

### Frontend Components
- **App.js**: Main application component with game flow and state management
- **TicTacToeBoard**: Renders the 3x3 game board
- **GameCard**: Displays selectable game cards on the home screen
- **GameResult**: Shows game outcome and play again option
- **CodeInput**: Six-digit code input with auto-focus
- **Chat**: Real-time chat component (currently disabled)

### Application Screens
1. **Home**: Game selection screen
2. **Enter Name**: Name input and game creation/joining
3. **Waiting**: Waiting room while finding opponent
4. **Game**: Active gameplay with board and turn indicators

---

## Deployment

The application is deployed on Vercel with the following configuration:

- **Frontend**: Static React build deployed from `client/build/`
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/build`

See `vercel.json` for deployment configuration details.

---

## Technical Documentation

For detailed technical information, including:
- Complete API endpoint specifications
- Function-level documentation
- Component props and behaviors
- Application flow diagrams
- Data structures and state management

Please refer to **[documentation.md](documentation.md)**.

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

## Links

- **Live Application**: [https://khelona.samarthnaikk.me](https://khelona.samarthnaikk.me)
- **Backend API**: [https://khelona-backend.vercel.app](https://khelona-backend.vercel.app)
- **Technical Documentation**: [documentation.md](documentation.md)
- **Repository**: [https://github.com/samarthnaikk/khelona](https://github.com/samarthnaikk/khelona)
