import os

# IMPORTANT:
# This file lives under Server/app/config/, but the original `basedir` in
# Server/app/config.py was computed relative to Server/app/ (one directory up).
# We compute the same path to preserve behavior (instance dir location).
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Ensure instance directory exists
instance_dir = os.path.join(basedir, "instance")
os.makedirs(instance_dir, exist_ok=True)
