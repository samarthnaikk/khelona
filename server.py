from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import string
from games import create_game, handle_game_move

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

games = {}  # game_code: { 'type': 'tic-tac-toe', 'state': {...} }

def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@app.route('/api/create_game', methods=['POST'])
def create_game_endpoint():
    try:
        code = generate_code()
        while code in games:
            code = generate_code()
        
        # Default to tic-tac-toe for now, can be extended to accept game type
        game_state = create_game('tic-tac-toe')
        games[code] = {'type': 'tic-tac-toe', 'state': game_state}
        
        print(f"Created game with code: {code}")
        return jsonify({'code': code})
    except Exception as e:
        print(f"Error creating game: {e}")
        return jsonify({'error': str(e)}), 500

@socketio.on('join_game')
def on_join_game(data):
    code = data.get('code')
    player = data.get('player')
    if code not in games or len(games[code]['state']['players']) >= 2:
        emit('join_error', {'error': 'Invalid or full game code'})
        return
    
    games[code]['state']['players'].append(player)
    join_room(code)
    emit('player_joined', {'players': games[code]['state']['players']}, room=code)
    
    if len(games[code]['state']['players']) == 2:
        game_state = games[code]['state']
        emit('start_game', {
            'board': game_state['board'], 
            'turn': game_state['turn'],
            'game_over': game_state['game_over'],
            'winner': game_state['winner']
        }, room=code)

@socketio.on('make_move')
def on_make_move(data):
    code = data.get('code')
    idx = data.get('index')
    player = data.get('player')
    
    if code not in games or idx is None or player not in games[code]['state']['players']:
        return
    
    game_info = games[code]
    game_state = game_info['state']
    game_type = game_info['type']
    
    # Get player index
    try:
        player_index = game_state['players'].index(player)
    except ValueError:
        return
    
    # Check if it's the player's turn
    if game_state['turn'] != player_index or game_state['game_over']:
        return
    
    # Handle the move using the game-specific handler
    success, updated_state = handle_game_move(game_type, game_state, player_index, idx)
    
    if success:
        games[code]['state'] = updated_state
        emit('update_board', {
            'board': updated_state['board'], 
            'turn': updated_state['turn'],
            'game_over': updated_state['game_over'],
            'winner': updated_state['winner'],
            'winning_line': updated_state['winning_line']
        }, room=code)

@socketio.on('chat_message')
def on_chat_message(data):
    code = data.get('code')
    player = data.get('player')
    message = data.get('message')
    if code in games and player in games[code]['state']['players']:
        emit('chat_message', {
            'player': player,
            'message': message,
            'timestamp': __import__('datetime').datetime.now().strftime('%H:%M')
        }, room=code)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
