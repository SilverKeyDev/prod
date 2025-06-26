from app import create_app, db
from app.models import User
import sys
import os

# Ensure instance folder exists
instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'instance')
os.makedirs(instance_path, exist_ok=True)

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, port=5000)
