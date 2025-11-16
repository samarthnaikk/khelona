from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import string

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

games = {}  # game_code: { 'players': [], 'board': [...], 'turn': 0, 'winner': None, 'game_over': False }


def check_winner(board):
    # Check rows, columns, and diagonals
    lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # columns
        [0, 4, 8], [2, 4, 6]              # diagonals
    ]
    
    for line in lines:
        if board[line[0]] and board[line[0]] == board[line[1]] == board[line[2]]:
            return board[line[0]], line
    
    # Check for tie
    if all(cell != '' for cell in board):
        return 'tie', []
    
    return None, []

def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@app.route('/create_game', methods=['POST'])
def create_game():
    try:
        code = generate_code()
        while code in games:
            code = generate_code()
        games[code] = {'players': [], 'board': ['']*9, 'turn': 0, 'winner': None, 'game_over': False, 'winning_line': []}
        print(f"Created game with code: {code}")
        return jsonify({'code': code})
    except Exception as e:
        print(f"Error creating game: {e}")
        return jsonify({'error': str(e)}), 500

@socketio.on('join_game')
def on_join_game(data):
    code = data.get('code')
    player = data.get('player')
    if code not in games or len(games[code]['players']) >= 2:
        emit('join_error', {'error': 'Invalid or full game code'})
        return
    games[code]['players'].append(player)
    join_room(code)
    emit('player_joined', {'players': games[code]['players']}, room=code)
    if len(games[code]['players']) == 2:
        emit('start_game', {
            'board': games[code]['board'], 
            'turn': games[code]['turn'],
            'game_over': games[code]['game_over'],
            'winner': games[code]['winner']
        }, room=code)

@socketio.on('make_move')
def on_make_move(data):
    code = data.get('code')
    idx = data.get('index')
    player = data.get('player')
    if code not in games or idx is None or player not in games[code]['players']:
        return
    board = games[code]['board']
    turn = games[code]['turn']
    if board[idx] == '' and games[code]['players'][turn] == player and not games[code]['game_over']:
        board[idx] = 'X' if turn == 0 else 'O'
        
        # Check for winner
        winner, winning_line = check_winner(board)
        if winner:
            games[code]['game_over'] = True
            games[code]['winner'] = winner
            games[code]['winning_line'] = winning_line
        else:
            games[code]['turn'] = 1 - turn
        
        emit('update_board', {
            'board': board, 
            'turn': games[code]['turn'],
            'game_over': games[code]['game_over'],
            'winner': games[code]['winner'],
            'winning_line': games[code]['winning_line']
        }, room=code)

@socketio.on('chat_message')
def on_chat_message(data):
    code = data.get('code')
    player = data.get('player')
    message = data.get('message')
    if code in games and player in games[code]['players']:
        emit('chat_message', {
            'player': player,
            'message': message,
            'timestamp': __import__('datetime').datetime.now().strftime('%H:%M')
        }, room=code)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
