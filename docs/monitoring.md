# RELIEFGRID Stage 6 Monitoring & Observability Architecture

This document details the **Prometheus & Grafana Observability Stack** implemented in Stage 6 to monitor real-time disaster operations, pod resource consumption, HPA auto-scaling trends, and self-healing lifecycle events.

---

## 1. Observability Architecture Overview

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                     KUBERNETES PODS & CLUSTER                    │
 │                                                                  │
 │  ┌───────────────────────┐             ┌───────────────────────┐ │
 │  │ backend-pod (Replica1)│             │ backend-pod (ReplicaN)│ │
 │  │ GET /metrics (8000)   │             │ GET /metrics (8000)   │ │
 │  └───────────┬───────────┘             └───────────┬───────────┘ │
 └──────────────┼─────────────────────────────────────┼─────────────┘
                │ (Scrape Every 15s)                  │
                ▼                                     ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                        PROMETHEUS SERVER                         │
 │                   (prometheus-service:9090)                      │
 │                                                                  │
 │  - Dynamic Pod Service Discovery                                 │
 │  - Kube-State-Metrics Exporter Integration                       │
 │  - TSDB Time-Series Metric Retention                             │
 └──────────────────────────────┬───────────────────────────────────┘
                                │ (PromQL Queries)
                                ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                         GRAFANA DASHBOARD                        │
 │                    (grafana-service:3000)                        │
 │                                                                  │
 │ Title: "ReliefGrid — Disaster Operations & Platform Health"      │
 │ Includes: System Overview, Traffic Latency, HPA Auto-Scaling,    │
 │           Emergency Needs/Resources/Matching API Telemetry       │
 └──────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Application Metrics (`/metrics`)

The FastAPI backend is instrumented using `prometheus-fastapi-instrumentator` exposing `/metrics`:

| Metric Name | Type | Description | Labels |
| :--- | :--- | :--- | :--- |
| `http_requests_total` | Counter | Total HTTP requests handled | `handler`, `status`, `method` |
| `http_request_duration_seconds` | Histogram | Request latency distribution in seconds | `handler`, `method`, `le` |
| `http_requests_inprogress` | Gauge | Currently active in-flight requests | `handler` |
| `process_cpu_seconds_total` | Counter | Total CPU seconds consumed by Python process | N/A |
| `process_resident_memory_bytes` | Gauge | Resident memory bytes used by process | N/A |

---

## 3. Prometheus Scrape Configuration (`monitoring/prometheus/configmap.yaml`)

- **Scrape Interval**: `15s` (Optimized to capture rapid HPA scaling during crisis demonstrations without network congestion).
- **Dynamic Replica Discovery**: Evaluates Kubernetes pod annotations (`prometheus.io/scrape: "true"`) in `reliefgrid` namespace, dynamically aggregating metrics across all 2-8 scaled backend pods.
- **Kube-State-Metrics Integration**: Scrapes `kube-state-metrics:8080` to track deployment replica states, restart counts, and HPA target utilization.

---

## 4. Pre-Provisioned Grafana Dashboard Panels

Grafana is pre-configured with the **ReliefGrid — Disaster Operations & Platform Health** dashboard:

### Section A: System Overview & Infrastructure Health
- **Platform Operational Status**: Stat panel indicating `HEALTHY / ONLINE` or `CRITICAL`.
- **Backend Replica Count**: Live count of active backend pods (`kube_deployment_status_replicas`).
- **Frontend Replica Count**: Live count of frontend pods.
- **Pod Restarts (30m)**: Tracks container restarts across all pods.

### Section B: Application Traffic & Latency Metrics
- **HTTP Request Rate**: Time-series graph showing requests/second (`sum(rate(http_requests_total[1m]))`).
- **Response Latency**: Histogram quantile showing p95 and p50 request latency.

### Section C: Kubernetes Auto-Scaling & HPA Observability
- **HPA Replica Scaling**: Dual-series graph comparing `Current Replicas` vs `Desired Replicas`.
- **Backend CPU Utilization**: Percentage graph comparing pod CPU usage against 60% HPA target.

### Section D: ReliefGrid Crisis Telemetry Operations
- **Resource Registry Traffic**: Rate of `/api/v1/resources` requests.
- **Emergency Needs Traffic**: Rate of `/api/v1/needs` requests.
- **Matching Engine Evaluation Traffic**: Rate of `/api/v1/matches` requests.
