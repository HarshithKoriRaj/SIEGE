# Siege Backend

FastAPI backend for the Siege MVP.

## Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Configuration

- `SIEGE_DB_PATH`: SQLite database path. Defaults to `./siege.db`.
- `CORS_ORIGINS`: Comma-separated frontend origins. Defaults to `http://localhost:3000`.

## API

Start a campaign:

```bash
curl -X POST http://localhost:8000/api/start-siege \
  -H "Content-Type: application/json" \
  -d '{"target_url": null, "target_description": "Customer support chatbot for an ecommerce site"}'
```

Fetch campaign status:

```bash
curl http://localhost:8000/api/campaign/1
```

