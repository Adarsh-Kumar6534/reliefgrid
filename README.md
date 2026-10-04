# RELIEFGRID
### *A Disaster Resource Matching Platform*

> **Stage 6 Jenkins CI/CD & Prometheus/Grafana Observability Complete** — Automated Pipeline-as-Code (`Jenkinsfile`), fail-fast unit testing (`pytest`), Docker container registry publishing, zero-downtime rolling K8s rollout, Prometheus dynamic pod metrics scraping (`/metrics`), kube-state-metrics integration, pre-provisioned Grafana Dashboard ("ReliefGrid — Disaster Operations & Platform Health"), and comprehensive Stage 6 DevOps Runbook.

---

## 📌 Problem & Mission

During natural disasters (floods, earthquakes, storms, medical emergencies), disaster management operations face severe friction:
- **Shelters and field camps** struggle to communicate urgent needs (food, clean water, medical trauma kits, blood reserves).
- **Donors and relief organizations** hold available supplies but lack real-time visibility into local proximity and urgency.
- **Volunteers** (paramedics, search & rescue teams) need immediate triage dispatch.

**RELIEFGRID** establishes a central emergency operations platform with an **Intelligent Deterministic Matching Engine** that matches resources with emergency needs based on category compatibility, Haversine proximity, quantity satisfaction, availability status, and emergency priority weighting.

---

## 🛠️ Technology Stack

### Application Layer (Stages 1 & 2)
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Prometheus Instrumentator
- **Database**: PostgreSQL / SQLite (Local default)
- **Cache**: Redis

### DevOps & Infrastructure (Stages 3, 4, 5 & 6)
- **CI/CD Pipeline (Stage 6)**: Jenkins Pipeline-as-Code (`Jenkinsfile`: Test -> Build -> Docker Tag -> Registry Push -> K8s Deployment)
- **Observability (Stage 6)**: Prometheus v2.51, Kube-State-Metrics v2.10, Grafana v10.4 with pre-provisioned "Disaster Operations & Platform Health" Dashboard
- **Containerization**: Multi-stage Dockerfiles (`frontend/Dockerfile`, `backend/Dockerfile`)
- **Local / Cloud Kubernetes**: K3s / Minikube, Metrics Server, HorizontalPodAutoscaler (`backend-hpa.yaml`, 2 to 8 replicas)
- **Synthetic Load Testing**: `k6` multi-stage crisis traffic simulator (`load-test/crisis-load.js`)
- **Infrastructure as Code (Stage 5)**: HashiCorp Terraform (`terraform/` module: VPC, Subnet, IGW, Route Table, Security Group, EC2 Instance, User-Data K3s bootstrap)

---

## 🧠 100-Point Explainable Matching Engine

$$\text{Total Match Score} = \text{Category (40)} + \text{Proximity (20)} + \text{Quantity (20)} + \text{Availability (10)} + \text{Priority Boost (10)}$$

---

## 📊 Deploying Monitoring & Observability (Stage 6)

```bash
# 1. Apply Prometheus, Kube-State-Metrics, and Grafana manifests
kubectl apply -f monitoring/prometheus/configmap.yaml
kubectl apply -f monitoring/prometheus/rbac.yaml
kubectl apply -f monitoring/prometheus/deployment.yaml
kubectl apply -f monitoring/prometheus/service.yaml
kubectl apply -f monitoring/kube-state-metrics/kube-state-metrics.yaml
kubectl apply -f monitoring/grafana/configmap.yaml
kubectl apply -f monitoring/grafana/dashboard-configmap.yaml
kubectl apply -f monitoring/grafana/deployment.yaml
kubectl apply -f monitoring/grafana/service.yaml

# 2. Port-forward Grafana for local visualization
kubectl port-forward svc/grafana-service 3000:3000 -n reliefgrid
```

Open `http://localhost:3000` (Login: `admin`/`admin`). Refer to [`docs/stage6-runbook.md`](file:///c:/devopsproject/docs/stage6-runbook.md) for the live observability demonstration sequence.

---

## ☁️ Deploying to AWS via Terraform (Stage 5)

```bash
cd terraform
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

Refer to [`docs/aws-deployment.md`](file:///c:/devopsproject/docs/aws-deployment.md) for AWS deployment procedures and [`docs/aws-cost-safety.md`](file:///c:/devopsproject/docs/aws-cost-safety.md) for cost-control guidelines.

---

## 📂 Project Monorepo Structure

```
reliefgrid/
├── Jenkinsfile               # Root Pipeline-as-Code (Checkout -> Pytest -> Next.js -> Docker -> Push -> K8s)
├── frontend/                 # Next.js 15 Standalone App
├── backend/                  # FastAPI Stateless Backend (with Prometheus /metrics endpoint)
├── terraform/                # Infrastructure as Code (AWS VPC, Subnet, IGW, SG, EC2, User-Data K3s)
│
├── k8s/                      # Declarative Kubernetes Manifests & HPA
│   ├── 00-namespace.yaml
│   ├── 01-configmap.yaml
│   ├── 02-secret.example.yaml
│   ├── 03-postgres.yaml
│   ├── 04-redis.yaml
│   ├── 05-backend.yaml       # Includes prometheus.io/scrape annotations
│   ├── 06-frontend.yaml
│   ├── 07-ingress.yaml
│   └── backend-hpa.yaml     # HorizontalPodAutoscaler (2 to 8 replicas)
│
├── monitoring/               # Stage 6 Observability Stack
│   ├── prometheus/           # Prometheus Server ConfigMap, RBAC, Deployment, Service
│   ├── kube-state-metrics/   # Cluster Object State Exporter
│   └── grafana/              # Datasource, Provider, Deployment, Service & Pre-Provisioned Dashboard
│
├── load-test/                # Synthetic Load Testing
│   ├── crisis-load.js        # Multi-stage k6 crisis simulation
│   └── fast-scaling-demo.js  # 2-minute rapid scaling test
│
├── scripts/                  # DevOps Helper Scripts
├── docs/                     # Runbooks & Architecture Documents
│   ├── architecture.md       # System design & metrics flow
│   ├── stage4-runbook.md     # Auto-scaling & Self-healing runbook
│   ├── aws-deployment.md     # AWS Deployment guide
│   ├── jenkins.md            # Jenkins CI/CD documentation
│   ├── monitoring.md         # Prometheus & Grafana documentation
│   └── stage6-runbook.md     # Stage 6 CI/CD & Observability runbook
│
├── docker-compose.yml        # Local multi-container development environment
└── README.md
```

---

## 🔮 Roadmap of Implemented & Future Stages

- [x] **Stage 1**: Foundation & Domain Architecture
- [x] **Stage 2**: Complete Application & Matching Studio
- [x] **Stage 3**: Docker Containerization & Local Kubernetes Manifests
- [x] **Stage 4**: Load Balancing, Horizontal Pod Autoscaling (HPA), and Self-Healing
- [x] **Stage 5**: Infrastructure as Code (Terraform) & Cloud Deployment (AWS EC2 + K3s)
- [x] **Stage 6**: Jenkins CI/CD Pipeline, Prometheus Metrics, and Grafana Dashboards
- [ ] **Future Stage 7**: Crisis Load Simulation & Final Integrated Presentation Demo
