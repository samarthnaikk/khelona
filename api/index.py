from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import string
from games import create_game, handle_game_move

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", path='/api/socket.io', logger=True, engineio_logger=True)

games = {}  # game_code: { 'type': 'tic-tac-toe', 'state': {...} }

# Test route
@app.route('/', methods=['GET'])
def home():
    try:
        return jsonify({
            'message': 'Backend is running!',
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'message': 'Backend reachable but error occurred',
            'status': 'error',
            'error': str(e)
        })

@app.route('/test', methods=['GET'])
def test():
    try:
        # Test if games module is working
        test_game = create_game('tic-tac-toe')
        return jsonify({
            'message': 'API is working!', 
            'status': 'success',
            'games_module': 'working',
            'test_game_created': bool(test_game)
        })
    except Exception as e:
        return jsonify({
            'message': 'API working but games module has issues',
            'status': 'partial',
            'error': str(e)
        })

def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@app.route('/create_game', methods=['POST'])
def create_game_endpoint():
    try:
        print("Creating game...")
        code = generate_code()
        while code in games:
            code = generate_code()
        
        print(f"Generated code: {code}")
        # Default to tic-tac-toe for now, can be extended to accept game type
        try:
            game_state = create_game('tic-tac-toe')
            print(f"Game state created: {game_state}")
        except Exception as game_error:
            print(f"Error creating game state: {game_error}")
            return jsonify({'error': f'Game creation failed: {str(game_error)}'}), 500
            
        games[code] = {'type': 'tic-tac-toe', 'state': game_state}
        
        print(f"Created game with code: {code}")
        return jsonify({'code': code})
    except Exception as e:
        print(f"Error creating game: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

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

# HTTP-based endpoints for Vercel compatibility
@app.route('/join_game', methods=['POST'])
def join_game_http():
    try:
        data = request.get_json()
        code = data.get('code')
        player = data.get('player')
        
        if code not in games or len(games[code]['state']['players']) >= 2:
            return jsonify({'error': 'Invalid or full game code'}), 400
        
        games[code]['state']['players'].append(player)
        player_index = len(games[code]['state']['players']) - 1
        
        return jsonify({
            'success': True,
            'player_index': player_index,
            'players': games[code]['state']['players']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/game_state/<code>', methods=['GET'])
def get_game_state(code):
    if code in games:
        return jsonify({'state': games[code]['state']})
    return jsonify({'error': 'Game not found'}), 404

@app.route('/make_move', methods=['POST'])
def make_move_http():
    try:
        data = request.get_json()
        code = data.get('code')
        idx = data.get('index')
        player = data.get('player')
        
        if code not in games or idx is None or player not in games[code]['state']['players']:
            return jsonify({'error': 'Invalid request'}), 400
        
        game_info = games[code]
        game_state = game_info['state']
        game_type = game_info['type']
        
        try:
            player_index = game_state['players'].index(player)
        except ValueError:
            return jsonify({'error': 'Player not found'}), 400
        
        if game_state['turn'] != player_index or game_state['game_over']:
            return jsonify({'error': 'Not your turn'}), 400
        
        success, updated_state = handle_game_move(game_type, game_state, player_index, idx)
        
        if success:
            games[code]['state'] = updated_state
            return jsonify({'success': True, 'state': updated_state})
        else:
            return jsonify({'error': 'Invalid move'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/send_message', methods=['POST'])
def send_message_http():
    try:
        data = request.get_json()
        code = data.get('code')
        player = data.get('player')
        message = data.get('message')
        
        if code not in games or player not in games[code]['state']['players']:
            return jsonify({'error': 'Invalid request'}), 400
        
        # Add messages list to game state if it doesn't exist
        if 'messages' not in games[code]['state']:
            games[code]['state']['messages'] = []
        
        # Add the message with timestamp
        import datetime
        games[code]['state']['messages'].append({
            'player': player,
            'message': message,
            'timestamp': datetime.datetime.now().strftime('%H:%M')
        })
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_messages/<code>', methods=['GET'])
def get_messages(code):
    if code in games:
        messages = games[code]['state'].get('messages', [])
        return jsonify({'messages': messages})
    return jsonify({'error': 'Game not found'}), 404

# For Vercel deployment
def handler(request):
    return app(request.environ, request.start_response)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
