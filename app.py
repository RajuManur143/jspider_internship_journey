# PYTHON/FLASK BACKEND EXAMPLE
# Save as: app.py
# Install: pip install flask flask-cors flask-sqlalchemy python-dotenv
# Run: python app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import re
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# In-memory database (replace with SQLAlchemy + PostgreSQL/MySQL for production)
registered_users = []

def is_valid_email(email):
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def is_valid_mobile(mobile):
    return re.match(r'^[6-9]\d{9}$', mobile) is not None

@app.route('/api/users/register', methods=['POST'])
def register():
    try:
        data = request.json
        name = data.get('name')
        mobile = data.get('mobile')
        email = data.get('email')
        password = data.get('password')

        # Validation
        if not all([name, mobile, email, password]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        if len(name) < 3:
            return jsonify({'success': False, 'message': 'Name must be at least 3 characters'}), 400

        if not is_valid_mobile(mobile):
            return jsonify({'success': False, 'message': 'Invalid mobile number'}), 400

        if not is_valid_email(email):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400

        # Check for duplicates
        if any(u['email'] == email or u['mobile'] == mobile for u in registered_users):
            return jsonify({'success': False, 'message': 'User already exists'}), 400

        # Create new user
        new_user = {
            'id': str(int(datetime.now().timestamp() * 1000)),
            'name': name,
            'mobile': mobile,
            'email': email,
            'password': generate_password_hash(password),
            'created_at': datetime.now().isoformat()
        }

        registered_users.append(new_user)

        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'data': {
                'id': new_user['id'],
                'name': new_user['name'],
                'email': new_user['email'],
                'mobile': new_user['mobile']
            }
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    users = [{
        'id': u['id'],
        'name': u['name'],
        'email': u['email'],
        'mobile': u['mobile'],
        'created_at': u['created_at']
    } for u in registered_users]
    
    return jsonify({'total': len(users), 'users': users}), 200

@app.route('/api/users/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        user = next((u for u in registered_users if u['email'] == email), None)

        if not user or not check_password_hash(user['password'], password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email']
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    print('🚀 Flask server running on http://localhost:5000')
    print('✅ API Ready for registration form')
    app.run(debug=True, port=5000)
