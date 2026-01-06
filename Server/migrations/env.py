import logging
from logging.config import fileConfig
from flask import current_app
from alembic import context

# Alembic Config object
config = context.config

# Set up Python logging via .ini config
fileConfig(config.config_file_name)
logger = logging.getLogger("alembic.env")


def get_engine():
    try:
        # Flask-SQLAlchemy < 3 and Alchemical
        return current_app.extensions["migrate"].db.get_engine()
    except (TypeError, AttributeError):
        # Flask-SQLAlchemy >= 3
        return current_app.extensions["migrate"].db.engine


def get_engine_url():
    try:
        return get_engine().url.render_as_string(hide_password=False).replace("%", "%%")
    except AttributeError:
        return str(get_engine().url).replace("%", "%%")


# Point Alembic to the runtime DB URL from Flask
config.set_main_option("sqlalchemy.url", get_engine_url())
target_db = current_app.extensions["migrate"].db


def get_metadata():
    """
    Return the MetaData Alembic will scan for autogenerate.

    If multiple binds are configured (Flask-SQLAlchemy `SQLALCHEMY_BINDS`),
    return a list of all MetaData objects so Alembic will detect models
    on non-default binds as well.
    """
    # Import all models so Alembic can detect them
    # This must happen within the app context (which Flask-Migrate provides)
    import app.models  # This imports all models via __init__.py
    
    if hasattr(target_db, "metadatas"):
        # Flask-SQLAlchemy exposes metadatas as a {bind_key: MetaData} dict
        return list(target_db.metadatas.values())
    return target_db.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode (no Engine, just a URL)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=get_metadata(),
        literal_binds=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode with an Engine/Connection."""

    # Prevent empty autogenerate revisions
    def process_revision_directives(context_, revision, directives):
        if getattr(config.cmd_opts, "autogenerate", False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info("No changes in schema detected.")

    conf_args = current_app.extensions["migrate"].configure_args

    # Add robust autogenerate defaults if not already provided
    conf_args.setdefault("compare_type", True)
    conf_args.setdefault("compare_server_default", True)
    # If you use schemas or __table_args__={"schema": "..."}
    conf_args.setdefault("include_schemas", True)

    if conf_args.get("process_revision_directives") is None:
        conf_args["process_revision_directives"] = process_revision_directives

    connectable = get_engine()

    mds = get_metadata()
    md_list = mds if isinstance(mds, (list, tuple)) else [mds]
    for md in md_list:
        logger.info("Alembic scanning tables: %s", sorted(md.tables.keys()))

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            **conf_args,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
