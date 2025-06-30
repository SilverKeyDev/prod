from app import create_app, db
from flask_cors import CORS

app = create_app()

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://10.91.197.108:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run()