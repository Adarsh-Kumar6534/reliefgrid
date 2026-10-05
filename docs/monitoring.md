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
 │  - Dynamic Pod Service Discovery (backend replicas)              │
 │  - Kubelet cAdvisor Integration (container CPU & memory)         │
 │  - Node-Exporter Integration (host EC2 metrics)                  │
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
 │ Includes: 17 Real-Time Panels organized into 4 Operational       │
 │           Sections (System Overview, Traffic, HPA, Resources)    │
 └──────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Application Metrics (`/metrics`)

The FastAPI backend is instrumented using `prometheus-fastapi-instrumentator` exposing `/metrics`:

| Metric Name | Type | Description | Labels |
| :--- | :--- | :--- | :--- |
| `http_requests_total` | Counter | Total HTTP requests handled | `handler`, `status`, `method`, `namespace`, `pod` |
| `http_request_duration_seconds` | Histogram | Request latency distribution in seconds | `handler`, `method`, `le`, `namespace`, `pod` |
| `http_requests_inprogress` | Gauge | Currently active in-flight requests | `handler`, `method` |
| `process_cpu_seconds_total` | Counter | Total CPU seconds consumed by Python process | N/A |
| `process_resident_memory_bytes` | Gauge | Resident memory bytes used by process | N/A |

---

## 3. Prometheus Scrape Configurations (`monitoring/prometheus/configmap.yaml`)

- **Scrape Interval**: `15s` (Optimized to capture rapid HPA scaling during crisis demonstrations without network congestion).
- **Dynamic Replica Discovery**: Evaluates Kubernetes pod annotations (`prometheus.io/scrape: "true"`) in `reliefgrid` namespace, dynamically aggregating metrics across all scaled backend pods.
- **Kubelet cAdvisor Integration**: Scrapes Kubelet embedded cAdvisor via `https://kubernetes.default.svc:443/api/v1/nodes/<node>/proxy/metrics/cadvisor` using internal ServiceAccount TLS verification.
- **Kube-State-Metrics Integration**: Scrapes `kube-state-metrics:8080` to track deployment replica states, restart counts, and HPA target utilization.
- **Node Exporter Integration**: Scrapes `node-exporter:9100` to track node-level CPU and memory utilization.

---

## 4. Pre-Provisioned 17-Panel Grafana Dashboard

Grafana is pre-configured with the **ReliefGrid — Disaster Operations & Platform Health** dashboard containing 17 panels:

### Section A: Platform Overview & Infrastructure Health
1. **Platform Operational Status**: Stat panel indicating `HEALTHY / ONLINE` or `CRITICAL`.
2. **Backend Available Replicas**: Live count of active backend pods (`kube_deployment_status_replicas_available`).
3. **Pod Restarts & Failures (30m)**: Tracks container restarts across all pods (`sum(increase(...[30m]))`).

### Section B: Application Traffic & Latency Metrics
4. **HTTP Request Rate**: Time-series graph showing requests/second (`sum(rate(http_requests_total[1m]))`).
5. **Requests by Endpoint**: Req/sec broken down by API handler.
6. **Response Latency (p95 / p50)**: Quantile latency calculation from `http_request_duration_seconds_bucket`.
7. **HTTP Error Rate (5xx %)**: Percentage of 5xx server errors (`status="5xx"`).
8. **Crisis Telemetry API Traffic**: Filtered traffic rate for `/resources`, `/needs`, `/matches`, and `/dev/load`.

### Section C: Kubernetes Auto-Scaling & HPA Observability
9. **Current Backend Replicas**: Current HPA replica count (`kube_horizontalpodautoscaler_status_current_replicas`).
10. **Desired Backend Replicas**: Target HPA replica count (`kube_horizontalpodautoscaler_status_desired_replicas`).
11. **HPA Min / Max Bounds**: Static bounds (Min 2, Max 3 on AWS).
12. **Backend CPU Utilization (%)**: Percentage graph comparing container CPU usage against 60% HPA target.

### Section D: Pod & Host Resource Telemetry & Recovery
13. **Backend CPU per Pod (mCPU)**: Millicores consumed per backend pod.
14. **Backend Memory per Pod (MB)**: Working set memory in megabytes per backend pod.
15. **Node CPU Usage (%)**: Host EC2 CPU utilization percentage.
16. **Node Memory Usage (%)**: Host EC2 memory utilization percentage.
17. **Replica Recovery State (%)**: Deployment availability percentage (`available / spec * 100`) demonstrating self-healing recovery.
