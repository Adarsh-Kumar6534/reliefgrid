# RELIEFGRID Capstone Presentation & Live Demonstration Script

**Project**: RELIEFGRID — A Self-Healing, Auto-Scaling Disaster Resource Matching Platform  
**Target Duration**: 8 – 15 Minutes  
**Target Audience**: Academic Evaluators, DevOps Engineers, and Software Architects  

---

## 🎬 PART 1: INTRODUCTION & OPERATIONAL CONTEXT (60 Seconds)

**Presenter Narration**:
> *"Good morning/afternoon. During major natural disasters—such as earthquakes, floods, or severe hurricanes—emergency response operations suffer from critical friction. Field shelters and disaster victims struggle to request life-saving resources, while emergency donors and triage teams lack real-time visibility into proximity, inventory, and urgency.*
>
> *We built **RELIEFGRID**: an intelligent, self-healing, auto-scaling disaster resource matching platform. ReliefGrid uses a 100-point explainable matching engine to connect emergency needs with available supplies. Crucially, ReliefGrid is built on a modern cloud-native DevOps foundation engineered to automatically handle extreme crisis traffic spikes, self-heal during container failures, and provide full real-time observability."*

---

## 🏗️ PART 2: INTEGRATED DEVOPS ARCHITECTURE (90 Seconds)

**Visual**: Display [`docs/architecture.md`](file:///c:/devopsproject/docs/architecture.md) architecture diagram.

**Presenter Narration**:
> *"ReliefGrid's architecture is organized into five tightly integrated DevOps layers:*
> 1. **Application & Match Layer**: Next.js 15 App Router frontend paired with a stateless FastAPI Python 3.13 backend and PostgreSQL/Redis storage.
> 2. **Containerization & Orchestration**: Multi-stage Docker production images running inside Kubernetes/K3s with active Liveness and Readiness probes.
> 3. **Infrastructure as Code**: Terraform modules provisioning an isolated AWS VPC, public subnet, security group, and an EC2 host running single-node K3s.
> 4. **CI/CD Pipeline**: Jenkins Pipeline-as-Code enforcing automated Pytest verification, Docker image tagging by Git commit SHA, and zero-downtime Kubernetes rollouts.
> 5. **Observability Stack**: Prometheus dynamic pod scraping, Kube-State-Metrics integration, and a pre-configured Grafana Operations Dashboard."*

---

## 💻 PART 3: LIVE APPLICATION DEMONSTRATION (2 Minutes)

**Visual**: Open Web Dashboard (`http://localhost:3000` or AWS public IP).

**Presenter Demonstration**:
1. **Disaster Telemetry Overview**: Show live stats for active emergency needs, available resources, matched allocations, and operational shelters.
2. **Resource & Needs Registry**: Navigate to [`/resources`](file:///c:/devopsproject/frontend/app/resources/page.tsx) and [`/needs`](file:///c:/devopsproject/frontend/app/needs/page.tsx). Demonstrate filter tags, priority badges (`CRITICAL`, `HIGH`), and location tracking.
3. **100-Point Matching Engine**: Navigate to [`/matching`](file:///c:/devopsproject/frontend/app/matching/page.tsx). Select an emergency need (e.g. *"Pediatric Trauma Kits"*). Show the 100-point breakdown score:
   $$\text{Match Score} = \text{Category (40)} + \text{Proximity (20)} + \text{Quantity (20)} + \text{Availability (10)} + \text{Priority (10)}$$
4. **Diagnostic Instance Header**: Open Browser Developer Tools (F12) Network tab. Show the `X-ReliefGrid-Instance: backend-68694c9d57-abcde` response header proving instance identification.

---

## ⚙️ PART 4: CI/CD PIPELINE AUTOMATION (90 Seconds)

**Visual**: Open Jenkins Dashboard (`http://localhost:8080` or Jenkins UI).

**Presenter Demonstration**:
1. Select **ReliefGrid-Pipeline**. Show the 8 automated stages defined in [`Jenkinsfile`](file:///c:/devopsproject/Jenkinsfile):
   `Checkout` ➔ `Install Dependencies` ➔ `Backend Unit Tests` ➔ `Frontend Build` ➔ `Docker Build` ➔ `Push Images` ➔ `Kubernetes Deploy` ➔ `Verify Rollout`.
2. **Fail-Fast Security Verification**: Explain that if a Pytest test fails in Stage 3, Jenkins immediately halts execution before any Docker container is built or pushed to the registry.
3. **Traceability**: Show how the deployed container tag matches the Git Commit SHA (`${BUILD_NUMBER}-${GIT_COMMIT[0..8]}`).

---

## 📊 PART 5: OBSERVABILITY BASELINE (60 Seconds)

**Visual**: Open Grafana (`http://localhost:3000`, Login: `admin`/`admin`). Select **"ReliefGrid Operations"** ➔ **"ReliefGrid — Disaster Operations & Platform Health"**.

**Presenter Demonstration**:
1. **Section A (System Overview)**:
   - Platform Status: `HEALTHY / ONLINE`
   - Active Backend Replicas: **2**
   - Active Frontend Replicas: **2**
   - Pod Restarts (30m): **0**
2. **Section B (Traffic)**: HTTP Request Rate is flat (~0 req/sec). Average CPU utilization is under 5%.

---

## 🚀 PART 6: SYNTHETIC CRISIS TRAFFIC INJECTION (2 Minutes)

**Presenter Narration**:
> *"We will now simulate a sudden severe regional earthquake disaster event using our k6 synthetic load generator (`load-test/crisis-load.js`). This test ramps traffic from 5 virtual users up to 75 concurrent virtual users making realistic requests across our Telemetry Overview, Resource Registry, Emergency Needs, and Matching Engine endpoints."*

**Action**: In terminal, run:
```powershell
k6 run load-test/crisis-load.js
```

---

## 📈 PART 7: REAL-TIME AUTO-SCALING (HPA IN ACTION) (2 Minutes)

**Visual**: Switch back to Grafana Dashboard and terminal running `kubectl get hpa backend-hpa -n reliefgrid -w`.

**Presenter Narration & Observation**:
1. **Traffic Spike**: Watch Grafana Panel **Section B (HTTP Request Rate)** spike from 0 to 60+ req/sec.
2. **Resource Pressure**: Watch **Avg CPU Utilization** exceed the 60% target threshold.
3. **HPA Scale-Out Event**: Show Kubernetes HPA automatically detecting resource pressure and scaling backend replicas:
   $$\text{Desired Replicas} = \left\lceil 2 \times \frac{140\%}{60\%} \right\rceil = 5 \rightarrow 8 \text{ Replicas}$$
4. **Grafana Section C**: Point out the **Current Replicas** line stepping up cleanly from **2 ➔ 4 ➔ 8**.

---

## ⚡ PART 8: LIVE SELF-HEALING POD RECOVERY (2 Minutes)

**Presenter Narration**:
> *"While 75 virtual users are actively querying the platform during peak crisis load, we will inject a catastrophic failure by forcibly terminating one of our active backend pod containers."*

**Action**: In main terminal, execute:
```powershell
kubectl delete pod <backend-pod-name> -n reliefgrid
```

**Visual & Grafana Observations**:
1. **Grafana Panel Section A**: `Pod Restarts (30m)` increments from 0 to 1.
2. **Zero Downtime**: Point to k6 terminal output showing **0 HTTP 5xx errors**. The remaining 7 replicas instantly absorb incoming traffic while the Kubernetes ReplicaSet controller detects `current < desired` and schedules a replacement pod.
3. **Readiness Gate**: The replacement pod enters the Service rotation *only* after passing its `/ready` database check.

---

## 📉 PART 9: TRAFFIC RAMP-DOWN & SCALE-IN RECOVERY (60 Seconds)

**Visual**: Watch k6 test complete and return to Grafana Dashboard.

**Presenter Observation**:
1. **Traffic Drops**: Request rate drops back to 0 req/sec.
2. **CPU Recovery**: Average CPU utilization drops below 5%.
3. **HPA Scale-In**: HPA observes stabilization window (60s) and gradually scales backend replicas back to baseline **2**.

---

## 🎯 PART 10: CONCLUSION & SUMMARY (60 Seconds)

**Presenter Summary**:
> *"In summary, ReliefGrid proves that complex disaster-matching platforms can achieve true cloud-native resilience. By integrating Terraform, K3s, Jenkins, Prometheus, Grafana, and Kubernetes HPA, ReliefGrid guarantees automated elastic scaling under extreme load, self-healing pod recovery under failure, and total operational observability. Thank you."*
