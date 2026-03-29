# Use the official Python Alpine or Slim images as a starting point
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Ensure standard output is not buffered, preventing lost logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy requirements and install them securely
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual application files
COPY ./app ./app

# Expose the API port
EXPOSE 8000

# Command to run the FastAPI server using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
