from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_executor import Executor
from .config import Config
from .extensions import db, login_manager, ma

login_manager = LoginManager()

# Initialize extensions
ma = Marshmallow()

# Create executor instance
executor = Executor()

def create_app(config=None):
    app = Flask(__name__)
    
    # Load default config
    app.config.from_object(Config)
    
    # Override with provided config if any
    if config:
        app.config.update(config)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    ma.init_app(app)
    executor.init_app(app)
    
    # Enable CORS
    cors = CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}},
                supports_credentials=True)
    app.config['CORS_HEADERS'] = 'Content-Type'

    # Register blueprints
    from .routes.report import report_bp
    from .routes.dashboard import dashboard_bp
    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)

    return app