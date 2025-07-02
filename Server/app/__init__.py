from flask import Flask, send_from_directory, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_executor import Executor
from datetime import datetime
from .config import Config
import os
import logging

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
ma = Marshmallow()
executor = Executor()


def create_app(config=None):
    # STATIC FOLDER: matches Docker
    STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../Client/dist")
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")

    # Load config
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    ma.init_app(app)
    executor.init_app(app)
    migrate = Migrate(app, db)

    # CORS Configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://10.91.197.108:5173",
                "https://silverkeyestates.com"
            ],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "expose_headers": ["Content-Type", "X-CSRFToken"],
            "max_age": 600
        }
    })

    # Import models to register with SQLAlchemy
    from .models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Initialize S3 service
    with app.app_context():
        try:
            from .services.s3_service import s3_service
            logger = logging.getLogger(__name__)
            logger.info("S3 service initialized successfully")
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to initialize S3 service: {str(e)}")
            logger.error("Application will continue with local storage fallback")

    # Register blueprints
    from .routes.report import report_bp
    from .routes.dashboard import dashboard_bp
    from .routes.auth import auth_bp

    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)

    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        path = os.path.join(app.static_folder, "assets")
        print(f"Serving from {path} filename={filename}")
        return send_from_directory(path, filename)

    
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        if path == "":
            # root
            print("CATCH_ALL: Serving index.html for root path")
            return send_from_directory(app.static_folder, "index.html")

        requested_file = os.path.join(app.static_folder, path)
        if os.path.isfile(requested_file):
            # serve the actual file
            print(f"CATCH_ALL: Serving static file: {path}")
            return send_from_directory(app.static_folder, path)
        else:
            # fallback to index.html for client-side routing
            print(f"CATCH_ALL: Path not found: {path} — serving index.html fallback")
            return send_from_directory(app.static_folder, "index.html")



    return app
