# RELIEFGRID Stage 6 Jenkins CI/CD Pipeline Architecture & Guide

This document details the **Pipeline-as-Code** CI/CD architecture implemented via the root [`Jenkinsfile`](file:///c:/devopsproject/Jenkinsfile) for automated testing, Docker container image building, registry publishing, and zero-downtime Kubernetes deployments.

---

## 1. CI/CD Architecture Overview

```text
    DEVELOPER
        │
        ▼ (Git Push to main)
     GITHUB REPOSITORY (ghcr.io/adarsh-kumar6534/reliefgrid)
        │
        ▼ (Webhook / Build Trigger)
     JENKINS CI/CD SERVER
        │
        ├── 1. Checkout & Extract Git Commit SHA
        ├── 2. Dependency Installation (Python + Node.js)
        ├── 3. Backend Unit Testing (Pytest Suite)
        ├── 4. Frontend Compilation Validation (Next.js Standalone Build)
        ├── 5. Production Docker Image Build (Backend & Frontend)
        ├── 6. Immutable Image Tagging (<build>-<commit-sha> & latest)
        ├── 7. Authenticated Image Push (GitHub Container Registry)
        ├── 8. Kubernetes Rolling Deployment (`reliefgrid` Namespace)
        │      ├── Apply Base Manifests (ConfigMaps, DBs, Services, Ingress)
        │      ├── Apply Capacity-Aware HPA (k8s/08-backend-hpa-aws.yaml: min 2, max 3)
        │      └── Execute `kubectl set image` with Immutable Build Tag
        └── 9. Rollout Verification (`kubectl rollout status`) & Pod Status Audit
```

---

## 2. Pipeline-as-Code Stages (`Jenkinsfile`)

| Stage | Action | Failure Behavior |
| :--- | :--- | :--- |
| **1. Checkout & Environment Info** | Clones repository, sets `DEPLOY_ENV` (default `aws`), and extracts 8-character `${GIT_COMMIT}` SHA for immutable image tagging. | Aborts pipeline |
| **2. Install Dependencies** | Installs Python packages via `pip install -r backend/requirements.txt` and Node modules via `npm ci`. | Aborts pipeline |
| **3. Backend Unit Tests** | Runs `pytest` suite inside `backend/`. Verifies API contracts, matching engine, and `/metrics`. | **Fails Fast**: Aborts build before any Docker container build occurs |
| **4. Frontend Build Validation** | Runs Next.js standalone build `npm run build` inside `frontend/`. | Aborts pipeline on TypeScript/Lint error |
| **5. Docker Build** | Builds multi-stage production containers using existing Stage 3 [`backend/Dockerfile`](file:///c:/devopsproject/backend/Dockerfile) and [`frontend/Dockerfile`](file:///c:/devopsproject/frontend/Dockerfile). | Aborts pipeline |
| **6. Push Images to Registry** | Authenticates securely via `ghcr.io` credentials (`docker-registry-credentials`) and pushes tagged images (`<build-number>-<commit-sha>` and `latest`). | Aborts pipeline |
| **7. Deploy to Kubernetes** | Applies base manifests, applies environment HPA (`k8s/08-backend-hpa-aws.yaml` for AWS), and executes `kubectl set image` using the immutable build tag LAST to avoid manifest image overwrite. | Aborts pipeline |
| **8. Verify Rollout Status** | Executes `kubectl rollout status` ensuring replacement pods pass `/ready` probes within 120 seconds, followed by `kubectl get pods` and `kubectl get hpa` audit. | Marks build unstable |

---

## 3. Required Jenkins Credentials Setup

To prevent committing sensitive access tokens or credentials into Git, Jenkins uses secure **Credential Bindings**:

1. **`docker-registry-credentials`** (Username with Password / API Token):
   - **Username**: GitHub username (`adarsh-kumar6534`)
   - **Password**: Personal Access Token (PAT) with `write:packages` and `read:packages` scope
2. **`k3s-kubeconfig`** (Secret File / Kubeconfig):
   - Grants Jenkins access to execute `kubectl` commands against the K3s control plane.

> [!IMPORTANT]
> Secrets are injected dynamically using Jenkins `withCredentials` blocks and masked in build logs to prevent credential leakage.

---

## 4. Environment Parameters & HPA Safeguards

- **`DEPLOY_ENV = aws` (Default)**:
  Applies [`k8s/08-backend-hpa-aws.yaml`](file:///c:/devopsproject/k8s/08-backend-hpa-aws.yaml) (`minReplicas: 2`, `maxReplicas: 3`, `averageUtilization: 60%`), ensuring single-node EC2 `t3.small` stability.
- **`DEPLOY_ENV = local`**:
  Applies [`k8s/backend-hpa.yaml`](file:///c:/devopsproject/k8s/backend-hpa.yaml) (`minReplicas: 2`, `maxReplicas: 8`, `averageUtilization: 60%`) for local Minikube testing.

---

## 5. Troubleshooting Jenkins Builds

- **Build fails at `Backend Unit Tests`**: Inspect Pytest log output. Fix failing assertions locally before re-pushing.
- **Build fails at `Push Images`**: Verify that `docker-registry-credentials` ID matches Jenkins credential store settings and PAT permissions have not expired.
- **Build fails at `Verify Rollout Status`**: Run `kubectl describe pod -n reliefgrid` on K3s node to verify database readiness or resource limits.
