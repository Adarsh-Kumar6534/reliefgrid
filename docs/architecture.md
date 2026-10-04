# RELIEFGRID Architecture & System Design Document

## 1. Overview

**RELIEFGRID** is an intelligent disaster resource matching platform engineered to connect emergency needs (shelters, hospitals, relief camps) with available resources (donors, volunteers, medical suppliers) during crisis events.

This document details the **Stage 6 CI/CD & Observability Architecture**, covering Jenkins Pipeline-as-Code, Prometheus dynamic pod scraping, kube-state-metrics integration, and Grafana dashboard visualization.

---

## 2. Integrated System & Observability Architecture (Stage 6)

```
                       DEVELOPER / GIT PUSH
                                │
                                ▼
                       JENKINS CI/CD SERVER
                                │ (Test, Build, Push, Deploy)
                                ▼
                     KUBERNETES INGRESS ROUTER
                                │
             ┌──────────────────┴──────────────────┐
             │ Path: /                             │ Path: /api/v1
             ▼                                     ▼
   ┌───────────────────┐                 ┌───────────────────┐
   │ frontend-service  │                 │  backend-service  │
   │ (ClusterIP:3000)  │                 │  (ClusterIP:8000) │
   └─────────┬─────────┘                 └─────────┬─────────┘
             │                                     │
      ┌──────┴──────┐                   ┌──────────┼──────────┐
      ▼             ▼                   ▼          ▼          ▼
   ┌──────┐      ┌──────┐            ┌──────┐   ┌──────┐   ┌──────┐
   │ Pod1 │      │ Pod2 │            │ Pod1 │   │ Pod2 │   │ PodN │
   └──────┘      └──────┘            └──┬───┘   └──┬───┘   └──┬───┘
                                        │          │          │ (GET /metrics)
                                        └──────────┼──────────┘
                                                   │
                                                   ▼
                                         PROMETHEUS METRICS SERVER
                                         (prometheus-service:9090)
                                                   │
                                                   ▼ (PromQL Data Source)
                                         GRAFANA DASHBOARD
                                         (grafana-service:3000)
                                         "ReliefGrid Operations"
```

---

## 3. CI/CD Pipeline Architecture (`Jenkinsfile`)

- **Pipeline-as-Code**: Root [`Jenkinsfile`](file:///c:/devopsproject/Jenkinsfile) defining 8 automated stages.
- **Fail Fast Security**: Pytest suite runs before any container build. A broken test halts the pipeline before image publication.
- **Immutable Image Tagging**: Container images tagged with `${BUILD_NUMBER}-${GIT_COMMIT[0..8]}` and `latest`.
- **Zero-Downtime Rollout**: Uses `kubectl rollout status` to ensure replacement pods pass `/ready` probes before traffic cutover.

---

## 4. Observability Stack Architecture (`monitoring/`)

- **Backend Instrumentation**: FastAPI instrumented via `prometheus-fastapi-instrumentator` exposing `/metrics`.
- **Prometheus Server**: Dynamic pod discovery scraping `/metrics` across all scaled backend replicas (2 to 8 pods) every 15s.
- **Kube-State-Metrics**: Exposes deployment state, pod restart changes, and HPA replica counts.
- **Grafana Pre-Provisioned Dashboard**: **"ReliefGrid — Disaster Operations & Platform Health"** displaying live operational status, latency histograms, HPA auto-scaling trends, and crisis traffic rates.
