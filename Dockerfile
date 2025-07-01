# ----------------------------
# Stage 1: Build Vite frontend
# ----------------------------
FROM node:22 AS frontend

WORKDIR /app/client

# build-time variables
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY

# install deps
COPY Client/package*.json ./
RUN npm install

# copy the rest of the client source
COPY Client/ .

# build React/Vite
RUN VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    npm run build

# ✅ Fail build if assets are missing or empty
RUN test -d dist/assets && [ "$(ls -A dist/assets)" ] || (echo "❌ dist/assets is missing or empty after build!" && exit 1)

# ----------------------------
# Stage 2: Set up Flask backend
# ----------------------------
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/Server

# install Python deps
COPY Server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy backend code
COPY Server/ .

# copy built frontend to expected location
COPY --from=frontend /app/client/dist /app/Client/dist

EXPOSE 5000

# run Flask app with Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
