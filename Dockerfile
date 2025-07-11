# ----------------------------
# Stage 1: Build Vite frontend
# ----------------------------
FROM node:22 AS frontend

WORKDIR /app/client

# build-time variables
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY

# install dependencies
COPY Client/package*.json ./
RUN npm install

# copy rest of client source
COPY Client/ .

# build with env vars
RUN VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
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

# install Python dependencies
COPY Server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy backend code
COPY Server/ .

# copy the built frontend from previous stage
COPY --from=frontend /app/client/dist /app/Client/dist

EXPOSE 5000

# start Flask with Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "3600", "run:app"]
