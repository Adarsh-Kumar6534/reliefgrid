# RELIEFGRID REST API Reference (`/api/v1`)

All endpoints are versioned under `/api/v1` and return standardized JSON responses.

---

## Standard Response Envelopes

### Standard Response (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Paginated Response Structure
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 22,
    "page": 1,
    "page_size": 9,
    "total_pages": 3
  }
}
```

---

## 1. System & Health Probes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Liveness probe (Returns `{"status": "healthy"}`) |
| `GET` | `/ready` | Readiness probe (Tests DB connection) |
| `GET` | `/api/v1/system/status` | Detailed system component telemetry |

---

## 2. Dashboard & Search API

- `GET /api/v1/dashboard/summary` — Aggregated dashboard metrics feed.
- `GET /api/v1/search?q={query}` — Global multi-entity search across resources, needs, volunteers, and shelters.
- `GET /api/v1/activity?page=1&page_size=20&event_type={type}` — Paginated audit log feed.

---

## 3. Disaster Resources API

- `GET /api/v1/resources?page=1&page_size=9&type=FOOD&status=AVAILABLE&search=Ludhiana` — List resources with pagination and search.
- `GET /api/v1/resources/{id}` — Get resource details.
- `POST /api/v1/resources` — Register new emergency resource.
- `PUT /api/v1/resources/{id}` — Update resource details.
- `DELETE /api/v1/resources/{id}` — Deactivate resource (Marks status as `EXHAUSTED`).

---

## 4. Emergency Needs API

- `GET /api/v1/needs?page=1&page_size=9&priority=CRITICAL&search=Ludhiana` — List needs with pagination and filtering.
- `GET /api/v1/needs/{id}` — Get need details.
- `POST /api/v1/needs` — Post emergency requirement (triggers matching engine automatically).
- `PUT /api/v1/needs/{id}` — Update need priority, status, or remaining quantity.

---

## 5. Matching Engine API

- `GET /api/v1/matches?page=1&page_size=20&status=PROPOSED` — List generated matches.
- `GET /api/v1/matches/need/{need_id}` — Calculate top matches for a specific requirement.
- `POST /api/v1/matches/{id}/accept` — Accept match (processes partial quantity deduction, updates need to `MATCHED` / `PARTIALLY_MATCHED` and resource to `RESERVED` / `EXHAUSTED`).
- `POST /api/v1/matches/{id}/reject` — Reject candidate match.

---

## 6. Volunteers API

- `GET /api/v1/volunteers` — List active first responder volunteers.
- `POST /api/v1/volunteers` — Register or update volunteer availability profile.
