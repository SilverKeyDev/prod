from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_executor import Executor
from .config import Config
from .extensions import db, login_manager, ma
from flask_jwt_extended import JWTManager

jwt = JWTManager()

login_manager = LoginManager()

# Initialize extensions
ma = Marshmallow()

# Create executor instance
executor = Executor()

import os
from flask import send_from_directory

def create_app(config=None):
    app = Flask(__name__, static_folder="../static", static_url_path="")

    # Load config
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    # Init extensions
    db.init_app(app)
    login_manager.init_app(app)
    ma.init_app(app)
    executor.init_app(app)
    jwt.init_app(app)

    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://10.91.197.108:5173", "https://silverkeyestates.com"],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "expose_headers": ["Content-Type", "X-CSRFToken"],
            "max_age": 600
        }
    })

    # Handle preflight requests
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    # Import models to ensure they are registered with SQLAlchemy
    from .models.user import User
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Blueprints
    from .routes.report import report_bp
    from .routes.dashboard import dashboard_bp
    from .routes.auth import auth_bp
    
    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)

    

    # Serve frontend
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def static_proxy(path):
        file_path = os.path.join(app.static_folder, path)
        if os.path.isfile(file_path):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, "index.html")

    return app
