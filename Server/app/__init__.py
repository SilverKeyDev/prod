from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import login_manager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_executor import Executor
from .config import Config
from .extensions import db, login_manager, ma

login_manager = login_manager()

# Initialize extensions
ma = Marshmallow()

# Create executor instance
executor = Executor()

import os

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

    # CORS
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5000"]}},
         supports_credentials=True)
    app.config['CORS_HEADERS'] = 'Content-Type'

    # Blueprints
    from .routes.report import report_bp
    from .routes.dashboard import dashboard_bp
    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)

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
