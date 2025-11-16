#!/usr/bin/env python3
"""
Local development server that imports the Flask app from api/index.py
This allows us to run the server locally while keeping the Vercel structure intact.
"""

import sys
import os

# Add the api directory to the Python path
api_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api')
sys.path.insert(0, api_dir)

try:
    from index import app, socketio
    print("Successfully imported Flask app from api/index.py")
except ImportError as e:
    print(f"Error importing from api/index.py: {e}")
    sys.exit(1)

if __name__ == '__main__':
    print("Starting local development server...")
    print("Server will be available at: http://localhost:5001")
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)