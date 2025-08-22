# ----------------------------
# Stage 1: Build Vite frontend
# ----------------------------
    FROM node:22-slim AS frontend

    WORKDIR /app/client
    
    # build-time variables
    ARG VITE_API_BASE_URL
    ARG VITE_GOOGLE_MAPS_ID
    
    # install dependencies
    COPY Client/package*.json ./
    RUN npm install
    
    # copy rest of client source
    COPY Client/ .
    
    # build with env vars
    RUN VITE_API_BASE_URL=$VITE_API_BASE_URL \
        VITE_GOOGLE_MAPS_ID=$VITE_GOOGLE_MAPS_ID \
        npm run build
    
    # verify assets exist
    RUN test -d dist/assets && [ "$(ls -A dist/assets)" ] || (echo "❌ dist/assets missing or empty!" && exit 1)
    
    # ----------------------------
    # Stage 2: Build Flask backend
    # ----------------------------
    FROM python:3.11-slim AS backend
    
    ENV PYTHONDONTWRITEBYTECODE=1
    ENV PYTHONUNBUFFERED=1
    
    WORKDIR /app/Server
    
    # ---- system packages ----
    # - build-essential, cmake, libomp-dev: your existing native deps (e.g., lightgbm)
    # - libmagic1, file: REQUIRED for python-magic (provides libmagic.so + magic DB)
    RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libomp-dev \
        cmake \
        curl \
        libmagic1 \
        file \
     && rm -rf /var/lib/apt/lists/*
    
    # ---- python deps ----
    # NOTE: requirements.txt should include `python-magic` (NOT the PyPI package named `libmagic`)
    COPY Server/requirements.txt ./
    RUN pip install --upgrade pip setuptools wheel \
     && pip install --no-cache-dir --prefer-binary -r requirements.txt
    
    # ---- app code ----
    COPY Server/ .
    
    # bring built frontend from stage 1
    COPY --from=frontend /app/client/dist /app/Client/dist
    
    EXPOSE 5000
    
    # start Flask with Gunicorn
    CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "3600", "run:app"]