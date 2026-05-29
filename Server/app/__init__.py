# Fix Hugging Face parallelism warnings - must be set before any HF imports
import logging
import os

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_MAX_THREADS", "14")

_HEALTHZ_IS_PRODUCTION = os.getenv("FLASK_ENV") == "production"

# Optional on macOS to avoid fork shenanigans in dev
try:
    import multiprocessing as mp

    mp.set_start_method("spawn")  # no-op if already set
except Exception:
    logging.getLogger(__name__).exception(
        "multiprocessing.set_start_method('spawn') failed; continuing with platform default"
    )

from flask import Flask
from flask_compress import Compress  # pyright: ignore[reportMissingImports]
from flask_cors import CORS
from flask_executor import Executor
from flask_migrate import Migrate

from .config import Config
from .config.constants._constants_public_urls import (
    DEV_FRONTEND_ORIGIN,
    DEV_FRONTEND_ORIGIN_LOOPBACK,
    PUBLIC_PRODUCTION_ORIGIN,
)
from .extensions import db

# Initialize extensions (db from extensions; others local for create_app)
executor = Executor()
compress = Compress()


def create_app(config=None):
    import time

    _boot_t0 = time.perf_counter()

    # STATIC FOLDER: matches Docker
    STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../Client/dist")
    # IMPORTANT: move Flask's built-in static off "/" to avoid intercepting SPA routes like /login
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")
    static_dir: str = app.static_folder or STATIC_DIR

    # Load config
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    # Configure centralized logging for entire application
    from .utils.security.app_logging import configure_app_logging

    configure_app_logging(app)

    # Initialize centralized logger (category-based with PII scrubbing)
    import sys

    server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if server_dir not in sys.path:
        sys.path.insert(0, server_dir)
    from logger import LOG_CATEGORIES, get_logger

    logger = get_logger()
    logger.info(LOG_CATEGORIES["API"], "Centralized logger initialized")

    def _log_boot_phase(phase: str) -> None:
        elapsed_ms = int((time.perf_counter() - _boot_t0) * 1000)
        logger.info(
            LOG_CATEGORIES["API"],
            f"gunicorn_boot_phase={phase} elapsed_ms={elapsed_ms} pid={os.getpid()}",
        )

    _log_boot_phase("logger_ready")

    # Initialize extensions
    db.init_app(app)
    executor.init_app(app)
    compress.init_app(app)
    Migrate(app, db)
    _log_boot_phase("extensions_ready")

    # Initialize PostHog analytics
    from .posthog_client import init_posthog

    init_posthog()

    from logger.posthog_otlp import init_posthog_otlp

    init_posthog_otlp("silverkey-api")

    # Initialize database within app context
    with app.app_context():
        from . import models as _models  # noqa: F401 — register all ORM tables for Alembic/mappers

        # Production schema is owned by Alembic; skip create_all to avoid extra DDL round-trips at boot.
        if os.getenv("FLASK_ENV") == "production":
            logger.info(
                LOG_CATEGORIES["API"],
                "Skipping db.create_all() in production (migrations own schema)",
            )
        else:
            db.create_all()

        # Validate SQLAlchemy mapper configuration at startup (fail fast)
        try:
            from sqlalchemy.orm import configure_mappers

            configure_mappers()
            logger.info(LOG_CATEGORIES["API"], "SQLAlchemy mappers configured successfully")
        except Exception as mapper_error:
            logger.error(
                LOG_CATEGORIES["ERRORS"], f"SQLAlchemy mapper configuration failed: {mapper_error}"
            )
            raise RuntimeError(
                f"Database model configuration error: {mapper_error}"
            ) from mapper_error

    _log_boot_phase("db_mappers_ready")

    from .utils.migrate_mode import is_migrate_only

    if is_migrate_only():
        logger.info(
            LOG_CATEGORIES["API"],
            "SILVERKEY_MIGRATE_ONLY: skipping routes, CORS, and full env validation",
        )
        _log_boot_phase("migrate_only_ready")
        return app

    # CORS Configuration with runtime origins list
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    ALLOWED = [o.strip() for o in raw.split(",") if o.strip()]
    if not ALLOWED:
        ALLOWED = [
            DEV_FRONTEND_ORIGIN,
            DEV_FRONTEND_ORIGIN_LOOPBACK,
            PUBLIC_PRODUCTION_ORIGIN,
        ]

    from .services.analytics.posthog_constants import (
        POSTHOG_DISTINCT_ID_HEADER,
        POSTHOG_SESSION_ID_HEADER,
    )

    CORS(
        app,
        resources={
            r"/api/*": {"origins": ALLOWED},
            r"/healthz": {"origins": ALLOWED},
            r"/livez": {"origins": ALLOWED},
            r"/readyz": {"origins": ALLOWED},
        },
        supports_credentials=True,
        expose_headers=["Content-Type", "X-CSRFToken", "X-Request-ID"],
        allow_headers=[
            "Content-Type",
            "X-CSRFToken",
            "Authorization",
            "X-Request-ID",
            POSTHOG_DISTINCT_ID_HEADER,
            POSTHOG_SESSION_ID_HEADER,
        ],
        methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        vary_header=True,
    )

    # S3 client is initialized lazily on first use via s3_service._ensure_s3_client() (avoids boto/head_bucket at boot).

    # Validate environment variables at startup
    from .utils.security.env_validator import check_api_keys
    from .utils.validation.config_validator import validate_and_raise

    try:
        validate_and_raise()  # Raises RuntimeError if required vars are missing
        from app.utils.testing_mode import is_testing

        if not is_testing():
            api_status = check_api_keys()
            missing_apis = [name for name, status in api_status.items() if not status]
            if missing_apis:
                logger.warn(
                    LOG_CATEGORIES["SECURITY"], f"Missing API keys: {', '.join(missing_apis)}"
                )
    except RuntimeError:
        # Re-raise RuntimeError from config validation (critical)
        raise
    except Exception as e:
        logger.warn(LOG_CATEGORIES["SECURITY"], f"Environment validation warning: {str(e)}")

    _log_boot_phase("env_validate_done")

    # Register blueprints
    from .routes.admin import admin_bp
    from .routes.agent.agent import agent_bp
    from .routes.auth.auth import auth_bp
    from .routes.auth.preferences import preferences_bp
    from .routes.auth.search_display import search_display_bp
    from .routes.auth.user import user_bp
    from .routes.calendar.google_calendar import google_calendar_bp
    from .routes.chat.chatbot import chatbot_bp
    from .routes.client_errors import client_errors_bp
    from .routes.documents.report import report_bp
    from .routes.documents.secure_upload import secure_upload_bp
    from .routes.feed import feed_bp
    from .routes.forms import forms_bp
    from .routes.maps import maps_bp
    from .routes.offer import offer_bp
    from .routes.public import public_bp
    from .routes.rev_share import rev_share_bp, rev_share_redirect_bp
    from .routes.search.home_matching import home_matching_bp
    from .routes.search.research import research_bp
    from .routes.search.search import search_bp
    from .routes.tasks import tasks_bp
    from .routes.transactions import transactions_bp
    from .routes.viewings import viewings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(search_display_bp)
    app.register_blueprint(home_matching_bp)
    app.register_blueprint(maps_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(research_bp)
    app.register_blueprint(secure_upload_bp)
    app.register_blueprint(offer_bp)
    app.register_blueprint(google_calendar_bp)
    app.register_blueprint(viewings_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(client_errors_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(rev_share_bp)
    app.register_blueprint(rev_share_redirect_bp)
    app.register_blueprint(forms_bp)

    try:
        from .routes.documents.docusign import docusign_bp, webhook_bp

        app.register_blueprint(docusign_bp)
        app.register_blueprint(webhook_bp)
        logger.info(LOG_CATEGORIES["API"], "DocuSign routes registered")
    except ImportError as e:
        logger.warn(LOG_CATEGORIES["API"], f"DocuSign routes not available: {e}")

    _log_boot_phase("blueprints_registered")

    from .http.error_handlers import register_after_request_headers, register_error_handlers
    from .http.flask_runtime_routes import register_flask_runtime_routes

    register_flask_runtime_routes(app, static_dir, healthz_is_production=_HEALTHZ_IS_PRODUCTION)

    from .http.api_telemetry import register_api_telemetry

    register_api_telemetry(app)
    register_after_request_headers(app)
    register_error_handlers(app)

    _log_boot_phase("app_factory_complete")
    return app
