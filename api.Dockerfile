# ── Lightest possible Flask image ─────────────────────────────────────────────
FROM python:3.11-alpine

# Don't write .pyc files; don't buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
RUN mkdir /upload
WORKDIR /app

# Install deps first (cached layer unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY config.ini  .
COPY db.py       .
COPY app_api.py  .
COPY routes/     ./routes/

EXPOSE 8000

ENTRYPOINT ["python", "app_api.py"]
