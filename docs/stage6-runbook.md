# RELIEFGRID Stage 6 DevOps Runbook: CI/CD & Observability

This runbook provides exact procedures for deploying, verifying, and demonstrating the **Jenkins CI/CD Pipeline**, **Prometheus Metrics Scraper**, and **Grafana Disaster Operations Dashboard** in Kubernetes.

---

## 1. Deploy Monitoring & Observability Stack

Apply all Stage 6 monitoring manifests to the `reliefgrid` namespace:

```powershell
# Purpose: Deploy ClusterRole RBAC, Prometheus Server, Kube-State-Metrics, and Grafana
kubectl apply -f monitoring/prometheus/configmap.yaml
kubectl apply -f monitoring/prometheus/rbac.yaml
kubectl apply -f monitoring/prometheus/deployment.yaml
kubectl apply -f monitoring/prometheus/service.yaml
kubectl apply -f monitoring/kube-state-metrics/kube-state-metrics.yaml
kubectl apply -f monitoring/grafana/configmap.yaml
kubectl apply -f monitoring/grafana/dashboard-configmap.yaml
kubectl apply -f monitoring/grafana/deployment.yaml
kubectl apply -f monitoring/grafana/service.yaml
```

### Step 1.1: Verify Monitoring Pod Health
```powershell
# Purpose: Confirm that Prometheus, Grafana, and kube-state-metrics pods are Running and Ready
kubectl get pods -n reliefgrid -l "app in (prometheus, grafana, kube-state-metrics)"
```

Expected Output:
```
NAME                                  READY   STATUS    RESTARTS   AGE
grafana-5c8b74966d-x1234              1/1     Running   0          30s
kube-state-metrics-6f6889b4f-y5678    1/1     Running   0          30s
prometheus-7d9d88587-z9012            1/1     Running   0          30s
```

---

## 2. Port-Forwarding for Local Observability Access

### Step 2.1: Access Grafana Dashboard
```powershell
# Purpose: Forward Grafana service port 3000 to localhost
kubectl port-forward svc/grafana-service 3000:3000 -n reliefgrid
```
- **URL**: `http://localhost:3000`
- **Username**: `admin`
- **Password**: `admin`
- **Pre-Loaded Dashboard**: Select **"ReliefGrid Operations"** -> **"ReliefGrid — Disaster Operations & Platform Health"**.

### Step 2.2: Access Prometheus Target Status (Optional Diagnostic)
```powershell
# Purpose: Forward Prometheus service port 9090 to localhost
kubectl port-forward svc/prometheus-service 9090:9090 -n reliefgrid
```
- **URL**: `http://localhost:9090/targets`
- Confirm `reliefgrid-backend` targets display `UP`.

---

## 3. Jenkins Pipeline Execution & Verification

### Step 3.1: Trigger Pipeline
1. Open Jenkins Web Interface.
2. Select **ReliefGrid-Pipeline**.
3. Click **Build Now**.

### Step 3.2: Verify Pipeline Stage Output
Verify that all 8 stages complete successfully:
- `Checkout & Environment Info` -> Extracts commit SHA
- `Install Dependencies` -> Installs Python & Node packages
- `Backend Unit Tests` -> Pytest execution (`13/13 Passed`)
- `Frontend Build Validation` -> Next.js standalone compilation
- `Docker Build` -> Builds backend & frontend containers
- `Push Images to Registry` -> Authenticates and pushes images
- `Deploy to Kubernetes` -> Applies updated container tags
- `Verify Rollout Status` -> Rollout status check

---

## 4. Full Live Observability Demonstration Sequence

This demonstration correlates synthetic crisis traffic, HPA auto-scaling, self-healing recovery, and Grafana dashboard telemetry.

### Step 4.1: Establish Baseline Telemetry
1. Open Grafana Dashboard (`http://localhost:3000`).
2. Observe Baseline State:
   - Platform Status: `HEALTHY / ONLINE`
   - Active Backend Replicas: **2**
   - HTTP Req/sec: ~0
   - Avg CPU Utilization: < 5%

### Step 4.2: Launch Crisis Load Simulation
In a separate terminal, execute the k6 crisis load test:
```powershell
# Purpose: Stress backend CPU and generate high HTTP traffic volume
k6 run load-test/crisis-load.js
```

### Step 4.3: Observe Auto-Scaling & Metrics on Grafana
Watch the Grafana Dashboard update in real time (`5s` refresh):
1. **Section B (Traffic)**: `HTTP Request Rate` spikes to 50+ req/sec.
2. **Section C (HPA)**: `Avg CPU Utilization` exceeds 60% target.
3. **Section C (HPA)**: `Desired Replicas` & `Current Replicas` step up from **2 → 4 → 8**.
4. **Section D (Crisis Telemetry)**: Observe `/resources`, `/needs`, and `/matches` traffic distribution.

### Step 4.4: Inject Mid-Traffic Pod Failure (Self-Healing Test)
While k6 traffic is actively running, delete an active backend pod:
```powershell
# Purpose: Simulate sudden container failure under high traffic
kubectl delete pod <backend-pod-name> -n reliefgrid
```

Observe in Grafana:
- `Pod Restarts (30m)` increments by 1.
- `HTTP Request Rate` remains flat (no traffic loss recorded by k6).
- Replica count briefly drops to 7, then returns to 8 as Kubernetes ReplicaSet brings up a replacement pod.

### Step 4.5: Observe Traffic Recovery & Scale-In
When the k6 test finishes:
1. `HTTP Request Rate` drops to 0.
2. `Avg CPU Utilization` drops to < 5%.
3. HPA enters 60s stabilization window and scales backend replicas back to **2**.

---

## 5. Stage 6 Troubleshooting Guide

| Component | Error Symptom | Cause & Solution |
| :--- | :--- | :--- |
| **Jenkins** | `docker push` denied | Credentials `docker-registry-credentials` missing or expired PAT. Update Jenkins credentials. |
| **Jenkins** | `pytest failed` | Unit test failed. Run `pytest` locally to fix broken assertions before pushing. |
| **Prometheus** | Target `reliefgrid-backend` is `DOWN` | Backend pod missing `prometheus.io/scrape: "true"` annotation or port 8000 blocked. Check `k8s/05-backend.yaml`. |
| **Grafana** | Dashboard panels show `No Data` | Prometheus datasource URL incorrect. Verify `http://prometheus-service.reliefgrid.svc.cluster.local:9090` in `monitoring/grafana/configmap.yaml`. |
