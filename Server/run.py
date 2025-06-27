from app import create_app, db
from app.models import User
from flask_cors import CORS  # Add this import
import sys
import os

# Ensure instance folder exists
instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'instance')
os.makedirs(instance_path, exist_ok=True)

app = create_app()

# Configure CORS - add this after app creation
CORS(app, 
     resources={
         r"/api/*": {
             "origins": ["http://localhost:5173", "http://10.91.197.108:5173"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"]
         }
     })

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, port=5000)