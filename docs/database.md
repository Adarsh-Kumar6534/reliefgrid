# RELIEFGRID Database Design & Data Models

## 1. Relational Entity Schema

```
 ┌────────────────┐         1:N         ┌────────────────┐
 │     users      ├────────────────────►│   resources    │
 └───────┬────────┘                     └───────┬────────┘
         │                                      │
         │ 1:N                                  │ 1:N
         ▼                                      ▼
 ┌────────────────┐       N:1:N         ┌────────────────┐
 │     needs      ├────────────────────►│    matches     │
 └────────────────┘                     └────────────────┘
         │
         │ 1:1                                  ┌────────────────┐
         ▼                                      │ activity_logs  │
 ┌────────────────────────┐                     └────────────────┘
 │ volunteer_availability │
 └────────────────────────┘
```

---

## 2. Table Specifications

### 2.1 `users`
- `id` (INTEGER, PK, Index)
- `name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(100), UNIQUE, Index)
- `phone` (VARCHAR(30))
- `role` (VARCHAR(30), Index) — `DONOR`, `VOLUNTEER`, `SHELTER`, `HOSPITAL`, `ADMIN`
- `location` (VARCHAR(150))
- `created_at` (TIMESTAMP)

### 2.2 `resources`
- `id` (INTEGER, PK, Index)
- `owner_id` (INTEGER, FK -> users.id, Index)
- `type` (VARCHAR(50), Index) — `FOOD`, `WATER`, `MEDICINE`, `BLOOD`, `CLOTHING`, `SHELTER`, `VOLUNTEER`, `OTHER`
- `title` (VARCHAR(150), NOT NULL)
- `description` (TEXT)
- `quantity` (FLOAT, DEFAULT 1.0)
- `unit` (VARCHAR(30), NOT NULL)
- `location` (VARCHAR(150), NOT NULL)
- `latitude` (FLOAT, Index)
- `longitude` (FLOAT, Index)
- `availability_status` (VARCHAR(30), Index) — `AVAILABLE`, `RESERVED`, `EXHAUSTED`
- `expiry_date` (VARCHAR(50))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2.3 `needs`
- `id` (INTEGER, PK, Index)
- `requester_id` (INTEGER, FK -> users.id, Index)
- `type` (VARCHAR(50), Index) — `FOOD`, `WATER`, `MEDICINE`, `BLOOD`, `CLOTHING`, `SHELTER`, `VOLUNTEER`, `OTHER`
- `title` (VARCHAR(150), NOT NULL)
- `description` (TEXT)
- `quantity_required` (FLOAT, DEFAULT 1.0)
- `unit` (VARCHAR(30), NOT NULL)
- `location` (VARCHAR(150), NOT NULL)
- `latitude` (FLOAT, Index)
- `longitude` (FLOAT, Index)
- `priority` (VARCHAR(30), Index) — `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `status` (VARCHAR(30), Index) — `OPEN`, `PARTIALLY_MATCHED`, `MATCHED`, `CLOSED`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2.4 `matches`
- `id` (INTEGER, PK, Index)
- `need_id` (INTEGER, FK -> needs.id, Index)
- `resource_id` (INTEGER, FK -> resources.id, Index)
- `match_score` (FLOAT, NOT NULL) — Range: 0.0 to 100.0
- `distance` (FLOAT, NOT NULL) — Distance in km
- `status` (VARCHAR(30), Index) — `PROPOSED`, `ACCEPTED`, `REJECTED`, `COMPLETED`
- `reason` (TEXT) — JSON formatted explainability reasons
- `created_at` (TIMESTAMP)

### 2.5 `volunteer_availability`
- `id` (INTEGER, PK, Index)
- `user_id` (INTEGER, FK -> users.id, UNIQUE, Index)
- `skills` (VARCHAR(255), NOT NULL)
- `availability_status` (VARCHAR(30), Index) — `AVAILABLE`, `BUSY`, `OFFLINE`
- `location` (VARCHAR(150), NOT NULL)
- `latitude` (FLOAT)
- `longitude` (FLOAT)
- `updated_at` (TIMESTAMP)

### 2.6 `activity_logs`
- `id` (INTEGER, PK, Index)
- `event_type` (VARCHAR(50), Index) — `RESOURCE_CREATED`, `NEED_CREATED`, `MATCH_CREATED`, `MATCH_ACCEPTED`, `MATCH_REJECTED`, `RESOURCE_UPDATED`, `NEED_UPDATED`
- `title` (VARCHAR(150), NOT NULL)
- `description` (TEXT, NOT NULL)
- `entity_type` (VARCHAR(50))
- `entity_id` (INTEGER)
- `status` (VARCHAR(30), DEFAULT "COMPLETED")
- `created_at` (TIMESTAMP, Index)
