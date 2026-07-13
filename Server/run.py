import argparse
import os

from dotenv import load_dotenv

load_dotenv()

from app import create_app  # noqa: E402  # load .env before importing app config

app = create_app()


def _flask_debug_from_env() -> bool:
    return os.getenv("FLASK_DEBUG", "").strip().lower() in ("1", "true", "yes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run SilverKey Flask (development server)")
    parser.add_argument("--host", default="0.0.0.0", help="Bind host")
    parser.add_argument("--port", type=int, default=5000, help="Bind port")
    args = parser.parse_args()
    app.run(host=args.host, port=args.port, debug=_flask_debug_from_env())
