from app import create_app, db
from app.models import User
import sys
import os

# Ensure instance folder exists
instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'instance')
os.makedirs(instance_path, exist_ok=True)

app = create_app()

if __name__ == '__main__':

    port = 5001  # Default port
    if len(sys.argv) > 1 and sys.argv[1] == '--port':
        port = int(sys.argv[2])
    app.run(debug=False, port=port)
