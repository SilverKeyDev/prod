# Stage 1: Build Vite frontend
FROM node:22 AS frontend

WORKDIR /app/client

# Install and build Vite project
COPY Client/package*.json ./
RUN npm install
COPY Client/ .
RUN npm run build

# Stage 2: Set up Flask backend
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies
COPY Server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY Server/ .

# Copy built frontend assets into Flask static folder
COPY --from=frontend /app/client/dist /app/static

# Expose Flask port
EXPOSE 5000

# Run Flask app
CMD ["python", "run.py"]
