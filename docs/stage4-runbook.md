# RELIEFGRID Stage 4 DevOps Runbook: Resilience, Auto-Scaling & Self-Healing

This runbook provides exact, step-by-step procedures for demonstrating **Horizontal Pod Autoscaling (HPA)**, **Service Load Balancing**, **Self-Healing Pod Recovery**, and **Crisis Traffic Simulation** in local Kubernetes.

---

## 1. Prerequisites & Cluster Environment Setup

Ensure the following tools are installed on your local machine:
- **Docker Desktop** (with Kubernetes enabled) or **Minikube**
- **kubectl** CLI
- **k6** (for synthetic load generation)

### Step 1.1: Verify Kubernetes Cluster Connectivity
```powershell
# Purpose: Confirm that kubectl is connected to an active local Kubernetes control plane
kubectl cluster-info
```

### Step 1.2: Enable Kubernetes Metrics Server
HPA relies on container CPU metrics provided by the Metrics Server.
```powershell
# Purpose: Enable the lightweight Metrics Server addon in Minikube
minikube addons enable metrics-server

# Purpose: Verify that node and pod metrics are being reported cleanly
kubectl top nodes
```

---

## 2. Deploy ReliefGrid to Local Kubernetes

### Step 2.1: Apply Manifests in Order
```powershell
# Purpose: Create the dedicated isolated namespace for ReliefGrid
kubectl apply -f k8s/00-namespace.yaml

# Purpose: Load environment configuration settings
kubectl apply -f k8s/01-configmap.yaml

# Purpose: Create base64 encoded database credentials secret
kubectl apply -f k8s/02-secret.example.yaml

# Purpose: Provision persistent volume claim, PostgreSQL database, and Redis cache
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-redis.yaml

# Purpose: Deploy 2-replica backend, 2-replica frontend, and HPA autoscaler
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml
kubectl apply -f k8s/backend-hpa.yaml
```

### Step 2.2: Verify Initial Pod & Service Status
```powershell
# Purpose: Verify that 2 backend pods and 2 frontend pods are in 'Running' and 'Ready' state
kubectl get pods -n reliefgrid -o wide
```

Expected output:
```
NAME                                 READY   STATUS    RESTARTS   AGE
backend-68694c9d57-abcde             1/1     Running   0          45s
backend-68694c9d57-fghij             1/1     Running   0          45s
frontend-5d8f99b4bc-klmno            1/1     Running   0          45s
frontend-5d8f99b4bc-pqrst            1/1     Running   0          45s
postgres-798485c6b6-uvwxy            1/1     Running   0          60s
redis-69bfd68c98-z1234               1/1     Running   0          60s
```

---

## 3. Demonstration 1: Service Load Balancing Across Replicas

### Step 3.1: Execute Load Balancing Verification Script
```powershell
# Purpose: Send 20 HTTP requests to backend instance endpoint and log pod distribution
python scripts/verify-load-balancing.py
```

Expected Output:
```
==================================================
  RELIEFGRID LOAD BALANCING VERIFICATION TOOL
==================================================
Target Endpoint : http://localhost:8000/api/v1/instance
Total Requests  : 20

Request #01 -> Handled by Pod: backend-68694c9d57-abcde
Request #02 -> Handled by Pod: backend-68694c9d57-fghij
Request #03 -> Handled by Pod: backend-68694c9d57-abcde
...
--------------------------------------------------
  TRAFFIC DISTRIBUTION SUMMARY
--------------------------------------------------
  Pod [backend-68694c9d57-abcde]: 10 requests (50.0%)
  Pod [backend-68694c9d57-fghij]: 10 requests (50.0%)

SUCCESS: Traffic is actively load-balanced across multiple backend replicas!
```

---

## 4. Demonstration 2: Horizontal Pod Autoscaling (HPA Scale-Out & Scale-In)

### Step 4.1: Inspect Initial HPA Status
```powershell
# Purpose: Verify HPA target Deployment, min/max replicas (2/8), and current CPU utilization
kubectl get hpa backend-hpa -n reliefgrid
```

Expected output prior to load:
```
NAME          REFERENCE            TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
backend-hpa   Deployment/backend   0%/60%    2         8         2          2m
```

### Step 4.2: Launch Crisis Load Generator
In a separate terminal, launch the multi-stage k6 crisis load test:
```powershell
# Purpose: Generate synthetic crisis traffic to stress backend CPU and trigger auto-scaling
k6 run load-test/crisis-load.js
```

### Step 4.3: Monitor HPA Auto-Scaling in Real Time
In your main terminal, watch the HPA target utilization and replica count adjust:
```powershell
# Purpose: Watch HPA CPU utilization and pod replica count scale from 2 -> 4 -> 8
kubectl get hpa backend-hpa -n reliefgrid -w
```

Observed Timeline:
1. **Normal Load (0s - 30s)**: CPU < 60%, Replicas = **2**
2. **Crisis Spike (1m - 3m)**: CPU rises to 140%/60%, HPA calculates desired replicas:
   $$\text{Desired Replicas} = \lceil 2 \times \frac{140\%}{60\%} \rceil = 5 \rightarrow 8$$
   Replicas scale up to **4**, then **8**.
3. **Traffic Decrease (4m - 5m)**: Load generator stops. CPU drops to 0%/60%.
4. **Scale-In Stabilization**: After 60 seconds stabilization, HPA gradually scales back to **2** replicas.

---

## 5. Demonstration 3: Kubernetes Self-Healing Pod Recovery

### Step 5.1: Identify Running Backend Pods
```powershell
# Purpose: Get the exact names of active backend pods prior to failure injection
kubectl get pods -n reliefgrid -l app=backend
```

### Step 5.2: Simulate Pod Failure (Kill a Pod)
```powershell
# Purpose: Manually terminate one backend pod to trigger Kubernetes self-healing
kubectl delete pod <backend-pod-name> -n reliefgrid
```

### Step 5.3: Observe Automatic Pod Replacement
```powershell
# Purpose: Watch Kubernetes ReplicaSet immediately schedule a replacement pod
kubectl get pods -n reliefgrid -l app=backend -w
```

Observed Sequence:
```
NAME                       READY   STATUS        RESTARTS   AGE
backend-68694c9d57-abcde   1/1     Terminating   0          5m
backend-68694c9d57-new01   0/1     ContainerCreating 0      1s
backend-68694c9d57-new01   0/1     Running       0          3s
backend-68694c9d57-new01   1/1     Running       0          10s  (Readiness passed)
```

### Step 5.4: Verify Continuous Application Availability
```powershell
# Purpose: Confirm that the system continues serving responses without downtime during pod replacement
curl http://localhost:8000/ready
```

---

## 6. Demonstration 4: Combined Crisis Load + Pod Failure Resilience

1. Start k6 load test: `k6 run load-test/crisis-load.js`
2. Wait for HPA to scale out backend pods to 4+ replicas (`kubectl get hpa -n reliefgrid`).
3. Delete an active backend pod mid-test: `kubectl delete pod <backend-pod-name> -n reliefgrid`.
4. Observe:
   - Remaining replicas immediately absorb incoming HTTP traffic.
   - Kubernetes ReplicaSet starts a replacement pod.
   - Replacement pod passes `/ready` probe and enters active Service rotation.
   - Zero HTTP 5xx errors recorded by k6.

---

## 7. Troubleshooting Guide

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `HPA TARGETS <unknown>/60%` | Metrics Server not running or initializing | Run `minikube addons enable metrics-server` and wait 60s for metrics scraping. |
| Pods stuck in `Pending` | Local Docker RAM/CPU exhausted | Adjust HPA maxReplicas or decrease CPU request in `k8s/05-backend.yaml`. |
| Replacement pod stuck in `0/1 Ready` | Database connection timing out | Verify PostgreSQL pod status: `kubectl get pods -n reliefgrid -l app=postgres`. |
