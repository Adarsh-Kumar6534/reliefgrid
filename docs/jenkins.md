# RELIEFGRID Stage 6 Jenkins CI/CD Pipeline Architecture & Guide (Windows Agent)

This document details the **Pipeline-as-Code** CI/CD architecture implemented via the root [`Jenkinsfile`](file:///c:/devopsproject/Jenkinsfile) configured for execution on a native **Windows Jenkins Service Agent**.

---

## 1. CI/CD Architecture Overview

```text
    DEVELOPER
        │
        ▼ (Git Push to main)
     GITHUB REPOSITORY (ghcr.io/adarsh-kumar6534/reliefgrid)
        │
        ▼ (Webhook / Build Trigger)
     WINDOWS JENKINS SERVICE AGENT
        │
        ├── 1. Checkout & Extract Git Commit SHA (`env.IMAGE_TAG`)
        ├── 2. Dependency Installation (Python `pip` + Node.js `npm ci`)
        ├── 3. Backend Unit Testing (`python -m pytest`)
        ├── 4. Frontend Compilation Validation (`npm run build`)
        ├── 5. Production Docker Image Build via Docker Desktop (`docker build`)
        ├── 6. Immutable Image Tagging (`<build-number>-<commit-sha>` & `latest`)
        ├── 7. Authenticated Image Push to GHCR (`docker login` & `docker push`)
        ├── 8. Kubernetes Deployment via Secret File Kubeconfig Injection (`kubectl --kubeconfig`)
        │      ├── Apply Base Manifests (ConfigMaps, DBs, Services, Ingress)
        │      ├── Apply Capacity-Aware HPA (`k8s/08-backend-hpa-aws.yaml`: min 2, max 3)
        │      └── Execute `kubectl set image` with Immutable Build Tag
        └── 9. Rollout Verification (`kubectl rollout status`) & Pod/HPA Status Audit
```

---

## 2. Pipeline-as-Code Stages (`Jenkinsfile`)

| Stage | Action | Failure Behavior |
| :--- | :--- | :--- |
| **1. Checkout & Environment Info** | Clones repository, sets `DEPLOY_ENV` (default `aws`), and extracts 8-character `${GIT_COMMIT}` SHA for immutable image tagging (`env.IMAGE_TAG`). | Aborts pipeline |
| **2. Install Dependencies** | Runs `bat` commands to install Python packages via `pip install -r backend/requirements.txt` and Node modules via `npm ci`. | Aborts pipeline |
| **3. Backend Unit Tests** | Runs `python -m pytest` suite inside `backend/`. Verifies API contracts, matching engine, and `/metrics`. | **Fails Fast**: Aborts build before any Docker container build occurs |
| **4. Frontend Build Validation** | Runs Next.js standalone build `npm run build` inside `frontend/`. | Aborts pipeline on TypeScript/Lint error |
| **5. Docker Build** | Builds multi-stage production containers via Docker Desktop using existing Stage 3 [`backend/Dockerfile`](file:///c:/devopsproject/backend/Dockerfile) and [`frontend/Dockerfile`](file:///c:/devopsproject/frontend/Dockerfile). | Aborts pipeline |
| **6. Push Images to Registry** | Authenticates securely via `ghcr.io` credentials (`docker-registry-credentials`) and pushes tagged images (`<build-number>-<commit-sha>` and `latest`). | Aborts pipeline |
| **7. Deploy to Kubernetes** | Binds `k3s-kubeconfig` Secret File credential (`KUBECONFIG_FILE`), applies base manifests, applies environment HPA (`k8s/08-backend-hpa-aws.yaml` for AWS), and executes `kubectl set image` using the immutable build tag LAST. | Aborts pipeline |
| **8. Verify Rollout Status** | Executes `kubectl --kubeconfig="%KUBECONFIG_FILE%" rollout status` ensuring replacement pods pass `/ready` probes within 120 seconds, followed by `kubectl get pods` and `kubectl get hpa` audit. | Marks build unstable |

---

## 3. Required Jenkins Credentials Setup

To prevent committing sensitive access tokens or credentials into Git, Jenkins uses secure **Credential Bindings**:

1. **`docker-registry-credentials`** (Username with Password / API Token):
   - **Type**: Username with password
   - **Username**: GitHub username (`adarsh-kumar6534`)
   - **Password**: Personal Access Token (PAT) with `write:packages` and `read:packages` scope
2. **`k3s-kubeconfig`** (Secret File):
   - **Type**: Secret file
   - **File Content**: The exported `kubeconfig` YAML file from your K3s server.
   - **Injected Variable**: `%KUBECONFIG_FILE%`
   - **Execution Guarantee**: Passed explicitly via `--kubeconfig="%KUBECONFIG_FILE%"` to every `kubectl` invocation. This guarantees target communication with the AWS K3s cluster and prevents accidental fallback to the local host's Minikube context.

> [!IMPORTANT]
> Secrets are injected dynamically using Jenkins `withCredentials` blocks and masked in build logs to prevent credential leakage.

---

## 4. Environment Parameters & HPA Safeguards

- **`DEPLOY_ENV = aws` (Default)**:
  Applies [`k8s/08-backend-hpa-aws.yaml`](file:///c:/devopsproject/k8s/08-backend-hpa-aws.yaml) (`minReplicas: 2`, `maxReplicas: 3`, `averageUtilization: 60%`), ensuring single-node EC2 `t3.small` stability.
- **`DEPLOY_ENV = local`**:
  Applies [`k8s/backend-hpa.yaml`](file:///c:/devopsproject/k8s/backend-hpa.yaml) (`minReplicas: 2`, `maxReplicas: 8`, `averageUtilization: 60%`) for local Minikube testing.

---

## 5. Host & Agent Requirements (Windows Machine)

- **Operating System**: Windows 10/11 or Windows Server (Jenkins running as a service)
- **Tooling Installed in PATH**:
  - `Docker Desktop` (Engine running)
  - `kubectl`
  - `Git`
  - `Python` (3.10+) with `pytest`
  - `Node.js` (20+) with `npm`
