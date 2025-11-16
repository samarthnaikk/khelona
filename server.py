from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import string

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

games = {}  # game_code: { 'players': [], 'board': [...], 'turn': 0 }


def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@app.route('/create_game', methods=['POST'])
def create_game():
    try:
        code = generate_code()
        while code in games:
            code = generate_code()
        games[code] = {'players': [], 'board': ['']*9, 'turn': 0}
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
        emit('start_game', {'board': games[code]['board'], 'turn': games[code]['turn']}, room=code)

@socketio.on('make_move')
def on_make_move(data):
    code = data.get('code')
    idx = data.get('index')
    player = data.get('player')
    if code not in games or idx is None or player not in games[code]['players']:
        return
    board = games[code]['board']
    turn = games[code]['turn']
    if board[idx] == '' and games[code]['players'][turn] == player:
        board[idx] = 'X' if turn == 0 else 'O'
        games[code]['turn'] = 1 - turn
        emit('update_board', {'board': board, 'turn': games[code]['turn']}, room=code)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
