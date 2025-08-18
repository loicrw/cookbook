FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Build argument for environment
ARG ENV=development

# Install uv
RUN pip install uv

# Copy requirements first to leverage Docker cache
COPY backend/requirements.txt .
RUN uv pip install --system -r requirements.txt \
    && if [ "$ENV" = "production" ] ; then \
       uv pip install --system gunicorn psycopg2-binary whitenoise ; \
    fi

# Copy project files
COPY backend/ .

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
