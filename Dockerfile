# Stage 1: Build Vite frontend
FROM node:22 AS frontend

WORKDIR /app/client

# Accept build-time variables
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY

# Copy and install dependencies
COPY Client/package*.json ./
RUN npm install

# Copy rest of the client code
COPY Client/ .

# Inject build-time variables directly into the build command
RUN VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    npm run build

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
COPY --from=frontend /app/Server/static /app/static

# Expose Flask port
EXPOSE 5000

# Run Flask app
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
