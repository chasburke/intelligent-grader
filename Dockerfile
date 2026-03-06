# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
# Vite's output directory is currently set to ../backend/static via vite.config.js,
# but we'll override it here or just copy it from there. It's safer to just let it build.
RUN npm run build

# Stage 2: Serve with FastAPI
FROM python:3.9-slim
WORKDIR /app

# Upgrade pip and install aiofiles (needed for static serving in FastAPI)
RUN pip install --upgrade pip

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install aiofiles

# Copy the backend code
COPY backend/ ./

# Copy the built React app from Stage 1 into the backend's static folder
COPY --from=frontend-builder /app/backend/static ./static

# Expose port and run
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
