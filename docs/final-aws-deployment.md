# RELIEFGRID Final AWS Cloud Deployment Runbook

This guide details the complete, end-to-end cloud deployment sequence for ReliefGrid on **Amazon Web Services (AWS)** using **Terraform (IaC)**, **K3s (Kubernetes)**, and the **Stage 6 Observability Stack**.

> [!WARNING]
> **AWS CHARGES WARNING**: Running `terraform apply` provisions live AWS EC2 compute, EBS storage, and public IP resources. Review [`docs/aws-cost-safety.md`](file:///c:/devopsproject/docs/aws-cost-safety.md) before initiating deployment.

---

## 1. Complete Cloud Deployment Sequence

### Step 1.1: Verify AWS CLI Identity
```bash
# Purpose: Confirm AWS CLI authentication with your target AWS account
aws sts get-caller-identity
```

### Step 1.2: Generate AWS SSH Key Pair
```bash
# Purpose: Create an SSH key pair for EC2 node access
aws ec2 create-key-pair \
  --key-name reliefgrid-key \
  --query 'KeyMaterial' \
  --output text > reliefgrid-key.pem

chmod 400 reliefgrid-key.pem
```

### Step 1.3: Provision Infrastructure with Terraform
```bash
cd terraform

# Initialize provider plugins
terraform init

# Validate configuration formatting
terraform fmt
terraform validate

# Copy and configure custom variable inputs
cp terraform.tfvars.example terraform.tfvars
# Set key_pair_name = "reliefgrid-key" and admin_cidr = "<YOUR_PUBLIC_IP>/32"

# Preview and apply cloud infrastructure
terraform plan
terraform apply
```

Note the output values returned:
- `public_ip`: Public IPv4 address of the EC2 instance
- `application_url`: `http://<public_ip>`

---

## 2. Server Node & K3s Verification

```bash
# SSH into EC2 server node
ssh -i reliefgrid-key.pem ubuntu@<PUBLIC_IP>

# Verify K3s control plane readiness
sudo kubectl get nodes
```

Expected Output:
```
NAME               STATUS   ROLES                  AGE     VERSION
ip-10-0-1-125      Ready    control-plane,master   2m15s   v1.31.2+k3s1
```

---

## 3. Publish Container Images to Registry

From your local workstation, build and publish production images:

```bash
# Build, tag, and push containers to GitHub Container Registry or Docker Hub
./scripts/publish-images.sh ghcr.io/YOUR_GITHUB_USERNAME v1
```

---

## 4. Deploy ReliefGrid & Observability Stack to AWS K3s

On the remote EC2 instance (or using local `kubectl` configured with cluster access), deploy all application and monitoring manifests:

```bash
# 1. Deploy Application Infrastructure & HPA
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.example.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-redis.yaml
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml
kubectl apply -f k8s/backend-hpa.yaml

# 2. Deploy Stage 6 Observability Stack (Prometheus, Kube-State-Metrics, Grafana)
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

---

## 5. Cloud Crisis Load Test & Observability Verification

### Step 5.1: Access Web Interface & Grafana
- **Application Web UI**: Open `http://<PUBLIC_IP>` in browser.
- **Grafana Dashboard**: Port-forward Grafana port 3000:
  ```bash
  kubectl port-forward svc/grafana-service 3000:3000 -n reliefgrid
  ```
  Open `http://localhost:3000` (Login: `admin`/`admin`) -> Select **"ReliefGrid — Disaster Operations & Platform Health"**.

### Step 5.2: Execute Cloud Crisis Load Test
From your local workstation, run synthetic crisis load against the AWS public endpoint:
```bash
BASE_URL=http://<PUBLIC_IP> k6 run load-test/crisis-load.js
```

### Step 5.3: Verify Real-Time Cloud Auto-Scaling & Self-Healing
1. Watch Grafana panel **Section C (HPA)** display CPU utilization exceeding 60% and backend replicas scaling from **2 ➔ 4 ➔ 8 pods**.
2. Delete a backend pod on EC2 (`kubectl delete pod <backend-pod-name> -n reliefgrid`) and observe instant ReplicaSet pod replacement with zero HTTP 5xx errors recorded by k6.
3. Observe scale-in back to **2 pods** after traffic stops.

---

## 6. Infrastructure Teardown & Cleanup

```bash
cd terraform
terraform destroy
```

Confirm in the AWS Management Console that the EC2 instance, Security Group, and VPC have been completely removed.
