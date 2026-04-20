# Siege

Siege is an automated AI red-teaming prototype. The current slice contains the FastAPI backend MVP with SQLite campaign storage and a deterministic mock attack engine.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend exposes:

- `POST /api/start-siege`
- `GET /api/campaign/{id}`

By default, CORS allows `http://localhost:3000` and `http://127.0.0.1:3000`. Override it with `CORS_ORIGINS`, using a comma-separated list.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://127.0.0.1:8000`. Override it with `NEXT_PUBLIC_API_BASE_URL`.

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```
