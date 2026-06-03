"""Verify deploy/runtime artifacts for backend scale-readiness."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]


def test_dockerfile_uses_gunicorn_entrypoint():
    dockerfile = (REPO_ROOT / "Dockerfile.web").read_text()
    assert "gunicorn-entrypoint.sh" in dockerfile
    assert 'CMD ["./scripts/gunicorn-entrypoint.sh"]' in dockerfile


def test_ec2_deploy_starts_beat_and_passes_scale_env():
    script = (REPO_ROOT / ".github/scripts/ec2-deploy.sh").read_text()
    assert "start_beat_container" in script
    assert "cre_beat" in script
    assert "scale_env_docker_flags" in script
    assert "WEB_CONCURRENCY" in script
    assert "DEPLOY_IMAGE_TAG" in script
    assert "DEPLOY_HEAVY_WORKER" in script
    assert "-Q default,heavy,docusign" in script


def test_docker_compose_prod_parity_includes_core_services():
    compose = (REPO_ROOT / "scripts/deploy/prod-parity/docker-compose.yml").read_text()
    for service in ("redis", "app", "worker", "beat"):
        assert f"  {service}:" in compose
    assert "WEB_CONCURRENCY" in compose
    assert "CELERY_WORKER_POOL" in compose


def test_load_harness_scripts_exist():
    load_dir = REPO_ROOT / "scripts/load"
    for name in ("smoke.js", "health-db.js", "authenticated-read.js", "README.md"):
        assert (load_dir / name).is_file()


def test_scaling_docs_exist():
    docs = REPO_ROOT / "documentation/server/ops"
    assert (docs / "scaling-playbook.md").is_file()
    assert (docs / "posthog-capacity-queries.md").is_file()


def test_gunicorn_entrypoint_gthread_passes_threads(tmp_path):
    """Intercept gunicorn exec and assert env-driven args."""
    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    capture_file = tmp_path / "args.txt"
    gunicorn_stub = fake_bin / "gunicorn"
    gunicorn_stub.write_text(
        "#!/usr/bin/env bash\n" 'printf "%s\\n" "$@" > "$GUNICORN_CAPTURE_FILE"\n',
    )
    gunicorn_stub.chmod(0o755)

    entrypoint = REPO_ROOT / "Server/scripts/gunicorn-entrypoint.sh"
    env = os.environ.copy()
    env["PATH"] = f"{fake_bin}{os.pathsep}{env['PATH']}"
    env["GUNICORN_CAPTURE_FILE"] = str(capture_file)
    env["WEB_CONCURRENCY"] = "2"
    env["GUNICORN_THREADS"] = "6"
    env["GUNICORN_WORKER_CLASS"] = "gthread"

    result = subprocess.run(
        ["bash", str(entrypoint)],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    args = capture_file.read_text().splitlines()
    assert args[0] == "--preload"
    assert "-w" in args and "2" in args
    assert "--worker-class" in args and "gthread" in args
    assert "--threads" in args and "6" in args
    assert "run:app" in args


def test_gunicorn_entrypoint_sync_omits_threads(tmp_path):
    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    capture_file = tmp_path / "args.txt"
    gunicorn_stub = fake_bin / "gunicorn"
    gunicorn_stub.write_text(
        "#!/usr/bin/env bash\n" 'printf "%s\\n" "$@" > "$GUNICORN_CAPTURE_FILE"\n',
    )
    gunicorn_stub.chmod(0o755)

    entrypoint = REPO_ROOT / "Server/scripts/gunicorn-entrypoint.sh"
    env = os.environ.copy()
    env["PATH"] = f"{fake_bin}{os.pathsep}{env['PATH']}"
    env["GUNICORN_CAPTURE_FILE"] = str(capture_file)
    env["GUNICORN_WORKER_CLASS"] = "sync"

    subprocess.run(["bash", str(entrypoint)], env=env, check=True)
    args = capture_file.read_text()
    assert "--threads" not in args


def test_celery_env_overrides_in_subprocess():
    server_dir = REPO_ROOT / "Server"
    env = os.environ.copy()
    env["PYTHONPATH"] = str(server_dir)
    env["DATABASE_URL"] = env.get("DATABASE_URL", "sqlite:///:memory:")
    env["CELERY_CONCURRENCY"] = "8"
    env["CELERY_WORKER_POOL"] = "prefork"
    code = """
from app.celery.celery_worker import celery
print(celery.conf.worker_concurrency, celery.conf.worker_pool)
"""
    result = subprocess.run(
        [sys.executable, "-c", code],
        cwd=str(server_dir),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    concurrency, pool = result.stdout.strip().split()
    assert int(concurrency) == 8
    assert pool == "prefork"
