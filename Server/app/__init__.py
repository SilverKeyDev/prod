from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_executor import Executor
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
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    app = Flask(
        __name__,
        static_folder=static_dir,
        static_url_path=""
    )

    # Load config
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    # Init extensions
    login_manager.init_app(app)
    ma.init_app(app)
    executor.init_app(app)
    db.init_app(app)

    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://10.91.197.108:5173",
                "https://silverkeyestates.com"
            ],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "expose_headers": ["Content-Type", "X-CSRFToken"],
            "max_age": 600
        }
    })

    # Preflight / CORS handling
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    # Import models to register with SQLAlchemy
    from .models.user import User

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

    # SPA catch-all for React/Vue client routing
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        file_path = os.path.join(app.static_folder, path)
        if os.path.isfile(file_path):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, "index.html")

    return app
